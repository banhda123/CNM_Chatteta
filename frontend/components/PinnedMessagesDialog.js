import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Avatar,
  Typography,
  Box,
  IconButton,
  Divider,
  CircularProgress
} from '@mui/material';
import {
  Close as CloseIcon,
  PushPin as PushPinIcon,
  PushPinOutlined as PushPinOutlinedIcon
} from '@mui/icons-material';
import ChatService from '../services/ChatService';
import AuthService from '../services/AuthService';
import SocketService from '../services/SocketService';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

const PinnedMessagesDialog = ({ open, onClose, conversation }) => {
  const [pinnedMessages, setPinnedMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAdmin2, setIsAdmin2] = useState(false);

  useEffect(() => {
    if (open && conversation) {
      loadPinnedMessages();
      setupSocketListeners();
      checkUserRole();
    }
    
    return () => {
      // Clean up socket listeners when component unmounts or dialog closes
      SocketService.removeListener('message_pinned');
      SocketService.removeListener('message_unpinned');
    };
  }, [open, conversation]);

  const checkUserRole = () => {
    const userData = AuthService.getUserData();
    setCurrentUser(userData);
    
    if (conversation && userData) {
      // Check if current user is admin or admin2
      const isUserAdmin = conversation.admin && 
        (conversation.admin._id === userData._id || conversation.admin === userData._id);
      
      const isUserAdmin2 = conversation.admin2 && 
        (conversation.admin2._id === userData._id || conversation.admin2 === userData._id);
      
      setIsAdmin(isUserAdmin);
      setIsAdmin2(isUserAdmin2);
    }
  };

  const setupSocketListeners = () => {
    // Ensure socket is connected
    SocketService.connect();
    
    // Join the conversation room to receive updates
    if (conversation && conversation._id) {
      SocketService.joinConversation(conversation._id);
    }
    
    // Listen for message pinned event
    SocketService.onMessagePinned((data) => {
      console.log('Socket: Message pinned', data);
      if (data.conversation && data.conversation.toString() === conversation._id.toString()) {
        // Add the newly pinned message to the list
        setPinnedMessages(prevMessages => [data.message, ...prevMessages]);
      }
    });
    
    // Listen for message unpinned event
    SocketService.onMessageUnpinned((data) => {
      console.log('Socket: Message unpinned', data);
      if (data.conversation && data.conversation.toString() === conversation._id.toString()) {
        // Remove the unpinned message from the list
        setPinnedMessages(prevMessages => 
          prevMessages.filter(msg => msg._id.toString() !== data.messageId.toString())
        );
      }
    });
  };

  const loadPinnedMessages = async () => {
    if (!conversation || !conversation._id) return;
    
    setLoading(true);
    setError('');
    
    try {
      const token = AuthService.getAccessToken();
      const response = await ChatService.getPinnedMessages(conversation._id, token);
      
      if (response.success) {
        setPinnedMessages(response.pinnedMessages || []);
      } else {
        setError(response.message || 'Failed to load pinned messages');
      }
    } catch (error) {
      console.error('Error loading pinned messages:', error);
      setError('Failed to load pinned messages. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUnpinMessage = async (messageId) => {
    if (!messageId) return;
    
    try {
      const token = AuthService.getAccessToken();
      
      // Optimistic update - remove the message from the list immediately
      setPinnedMessages(prevMessages => 
        prevMessages.filter(msg => msg._id.toString() !== messageId.toString())
      );
      
      // Call the API to unpin the message
      const response = await ChatService.unpinMessage(messageId, token);
      
      if (!response.success) {
        // If the API call fails, reload the pinned messages
        loadPinnedMessages();
        setError(response.message || 'Failed to unpin message');
      }
    } catch (error) {
      console.error('Error unpinning message:', error);
      setError('Failed to unpin message. Please try again.');
      loadPinnedMessages(); // Reload the pinned messages if there's an error
    }
  };

  const formatMessageContent = (message) => {
    if (!message) return '';
    
    switch (message.type) {
      case 'text':
        return message.content;
      case 'image':
        return '[Hình ảnh]';
      case 'file':
        return `[Tệp: ${message.fileName || 'File'}]`;
      case 'audio':
        return '[Ghi âm]';
      case 'video':
        return '[Video]';
      case 'gif':
        return '[GIF]';
      case 'system':
        return message.content;
      default:
        return message.content || '';
    }
  };

  const formatPinnedTime = (date) => {
    if (!date) return '';
    
    try {
      return formatDistanceToNow(new Date(date), { addSuffix: true, locale: vi });
    } catch (error) {
      console.error('Error formatting date:', error);
      return '';
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center">
            <PushPinIcon sx={{ mr: 1 }} />
            <Typography variant="h6">Tin nhắn đã ghim</Typography>
          </Box>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        {loading ? (
          <Box display="flex" justifyContent="center" my={3}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Typography color="error" align="center" my={2}>
            {error}
          </Typography>
        ) : pinnedMessages.length === 0 ? (
          <Typography align="center" my={2}>
            Không có tin nhắn nào được ghim trong cuộc trò chuyện này.
          </Typography>
        ) : (
          <List>
            {pinnedMessages.map((message) => (
              <React.Fragment key={message._id}>
                <ListItem alignItems="flex-start">
                  <ListItemAvatar>
                    <Avatar src={message.sender?.avatar} alt={message.sender?.name} />
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center">
                        <Typography component="span" variant="subtitle2">
                          {message.sender?.name}
                        </Typography>
                        <Typography 
                          component="span" 
                          variant="caption" 
                          color="text.secondary"
                          sx={{ ml: 1 }}
                        >
                          {formatPinnedTime(message.pinnedAt)}
                        </Typography>
                      </Box>
                    }
                    secondary={
                      <Typography
                        component="span"
                        variant="body2"
                        color="text.primary"
                      >
                        {formatMessageContent(message)}
                      </Typography>
                    }
                  />
                  
                  {/* Show unpin button for admins, admin2, or the user who pinned the message */}
                  {(isAdmin || isAdmin2 || 
                    (message.pinnedBy && currentUser && 
                     message.pinnedBy._id === currentUser._id)) && (
                    <ListItemSecondaryAction>
                      <IconButton 
                        edge="end" 
                        onClick={() => handleUnpinMessage(message._id)}
                        size="small"
                      >
                        <PushPinOutlinedIcon fontSize="small" />
                      </IconButton>
                    </ListItemSecondaryAction>
                  )}
                </ListItem>
                <Divider variant="inset" component="li" />
              </React.Fragment>
            ))}
          </List>
        )}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Đóng
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PinnedMessagesDialog;
