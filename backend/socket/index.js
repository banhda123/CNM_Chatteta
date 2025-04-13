const jwt = require('jsonwebtoken');
const db = require('../config/db');
const User = require('../models/User');
const logger = require('../config/logger');

module.exports = (io) => {
  // Map to store user socket connections
  const userSockets = new Map();
  
  // Socket connection handler
  io.on('connection', async (socket) => {
    logger.info(`Socket connected: ${socket.id}`);
    
    const token = socket.handshake.auth.token;
    if (!token) {
      logger.warn('Connection attempt without token');
      return socket.disconnect();
    }

    let conn;
    try {
      // Verify token and extract userId
      const decoded = jwt.verify(token.replace('Bearer ', ''), process.env.JWT_SECRET);
      const userId = decoded.userId;
      socket.userId = userId;
      
      // Store socket connection for this user
      if (!userSockets.has(userId)) {
        userSockets.set(userId, new Set());
      }
      userSockets.get(userId).add(socket.id);
      
      // Join user's room for direct messages
      socket.join(`user_${userId}`);
      
      // Update user status to online
      await User.updateStatus(userId, 'online');
      io.emit('status-update', { userId, status: 'online' });
      
      conn = await db.getConnection();

      // Join user's conversations
      const [conversations] = await conn.query(
        'SELECT conversation_id FROM conversation_members WHERE user_id = ?',
        [userId]
      );
      conversations?.forEach(conv => socket.join(`conversation_${conv.conversation_id}`));
      conn.release();
      conn = null;

      // Handle status updates
      socket.on('update-status', async ({ status }) => {
        try {
          if (await User.updateStatus(userId, status)) {
            io.emit('status-update', { userId, status });
            logger.info(`User ${userId} status updated to ${status}`);
          }
        } catch (error) {
          logger.error(`Status update error for user ${userId}: ${error.message}`);
          socket.emit('error', { message: 'Cannot update status' });
        }
      });

      // Join conversation
      socket.on('join-conversation', async (conversationId) => {
        try {
          const conn = await db.getConnection();
          const [membership] = await conn.query(
            'SELECT 1 FROM conversation_members WHERE conversation_id = ? AND user_id = ?',
            [conversationId, userId]
          );
          conn.release();
          
          if (!membership.length) {
            logger.warn(`Unauthorized conversation access attempt by user ${userId}`);
            return socket.emit('error', { message: 'Unauthorized access' });
          }

          socket.join(`conversation_${conversationId}`);
          logger.info(`User ${userId} joined conversation ${conversationId}`);
          
          // Notify other users in the conversation that this user is online
          socket.to(`conversation_${conversationId}`).emit('user-joined', { 
            userId, 
            conversationId,
            timestamp: new Date().toISOString()
          });
        } catch (error) {
          logger.error(`Join conversation error: ${error.message}`);
          socket.emit('error', { message: 'Cannot join conversation' });
        }
      });

      // Send message
      socket.on('send-message', async ({ conversationId, content, type = 'text' }) => {
        try {
          const conn = await db.getConnection();
          const [membership] = await conn.query(
            'SELECT 1 FROM conversation_members WHERE conversation_id = ? AND user_id = ?',
            [conversationId, userId]
          );
          
          if (!membership.length) {
            logger.warn(`Unauthorized message send attempt by user ${userId}`);
            conn.release();
            return socket.emit('error', { message: 'Unauthorized access' });
          }

          const [result] = await conn.query(
            'INSERT INTO messages (conversation_id, sender_id, content, type) VALUES (?, ?, ?, ?)',
            [conversationId, userId, content, type]
          );
          
          const insertId = result.insertId;
          
          const [rows] = await conn.query(
            'SELECT username, fullname, avatar FROM users WHERE id = ?', 
            [userId]
          );
          
          const user = rows[0];
          
          conn.release();
          
          const newMessage = {
            id: insertId,
            conversation_id: conversationId,
            sender_id: userId,
            sender_name: user.username,
            sender_fullname: user.fullname,
            sender_avatar: user.avatar,
            content,
            type,
            created_at: new Date().toISOString()
          };
          
          io.to(`conversation_${conversationId}`).emit('new-message', newMessage);
          logger.info(`New message sent in conversation ${conversationId} by user ${userId}`);
        } catch (error) {
          logger.error(`Send message error: ${error.message}`);
          socket.emit('error', { message: 'Cannot send message' });
        }
      });
      
      // Handle typing status
      socket.on('typing', ({ conversationId, isTyping }) => {
        socket.to(`conversation_${conversationId}`).emit('user-typing', {
          userId,
          conversationId,
          isTyping
        });
      });

      // Handle disconnect
      socket.on('disconnect', async () => {
        logger.info(`Socket disconnected: ${socket.id}`);
        
        if (userId) {
          // Remove this socket from the user's socket set
          if (userSockets.has(userId)) {
            userSockets.get(userId).delete(socket.id);
            
            // If user has no more active sockets, set them as offline
            if (userSockets.get(userId).size === 0) {
              userSockets.delete(userId);
              await User.updateStatus(userId, 'offline');
              io.emit('status-update', { userId, status: 'offline' });
              logger.info(`User ${userId} is now offline (no active connections)`);
            }
          }
        }
      });
    } catch (error) {
      logger.error(`Socket error: ${error.message}`);
      socket.disconnect();
    } finally {
      if (conn) conn.release();
    }
  });
  
  // Return middleware to make io available to route handlers
  return (req, res, next) => {
    req.io = io;
    next();
  };
};