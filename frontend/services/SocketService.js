import { io } from 'socket.io-client';
import AuthService from './AuthService';

class SocketService {
  static socket = null;
  static isConnected = false;
  static currentSocketId = null;

  static connect() {
    if (this.socket && this.socket.connected) {
      console.log('Socket already connected:', this.socket.id);
      this.isConnected = true;
      this.currentSocketId = this.socket.id;
      return this.socket;
    }

    if (this.socket) {
      // Socket exists but not connected, try reconnect
      this.socket.connect();
      return this.socket;
    }

    console.log('Creating new socket connection');
    this.socket = io('http://localhost:4000', {
      transports: ['websocket'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket.id);
      this.isConnected = true;
      this.currentSocketId = this.socket.id;
      
      // Join user room using current user ID
      const userData = AuthService.getUserData();
      if (userData && userData._id) {
        this.joinUserRoom(userData);
      }
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
      this.isConnected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      this.isConnected = false;
    });

    return this.socket;
  }

  static disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  static joinUserRoom(user) {
    if (this.socket && user && user._id) {
      this.socket.emit('join_room', user);
    }
  }

  static leaveUserRoom(user) {
    if (this.socket && user && user._id) {
      this.socket.emit('leave_room', user);
    }
  }

  static joinConversation(conversationId) {
    if (this.socket && conversationId) {
      this.socket.emit('join_conversation', conversationId);
    }
  }

  static joinAllConversations(conversationIds) {
    if (this.socket && Array.isArray(conversationIds)) {
      this.socket.emit('join_all_conversation', conversationIds);
    }
  }
  
  // Group chat methods
  static createGroupConversation(groupData) {
    if (this.socket) {
      this.socket.emit('create_group', groupData);
    }
  }
  
  static addMemberToGroup(groupId, memberId) {
    if (this.socket) {
      this.socket.emit('add_member_to_group', { groupId, memberId });
    }
  }
  
  static removeMemberFromGroup(groupId, memberId) {
    if (this.socket) {
      this.socket.emit('remove_member_from_group', { groupId, memberId });
    }
  }
  
  static leaveGroup(groupId, userId) {
    if (this.socket) {
      this.socket.emit('leave_group', { groupId, userId });
    }
  }
  
  static updateGroupInfo(groupId, groupData) {
    if (this.socket) {
      this.socket.emit('update_group_info', { groupId, ...groupData });
    }
  }

  static leaveConversation(conversationId) {
    if (this.socket && conversationId) {
      this.socket.emit('leave_conversation', conversationId);
    }
  }

  static sendMessage(messageData) {
    if (this.socket) {
      this.socket.emit('send_message', messageData);
    }
  }

  static markMessageAsSeen(conversationId) {
    if (this.socket && conversationId) {
      this.socket.emit('seen_message', conversationId);
    }
  }

  static createConversation(userFrom, userTo) {
    if (this.socket) {
      this.socket.emit('create_conversation', { userFrom, userTo });
    }
  }

  static revokeMessage(messageId, conversationId, userId) {
    if (this.socket && messageId && conversationId && userId) {
      this.socket.emit('revoke_message', { messageId, conversationId, userId });
    }
  }

  static deleteMessage(messageId, conversationId, userId) {
    if (this.socket && messageId && conversationId && userId) {
      this.socket.emit('delete_message', { messageId, conversationId, userId });
    }
  }

  static sendTypingStatus(conversationId, userId) {
    if (this.socket && conversationId && userId) {
      this.socket.emit('typing', { idConversation: conversationId, userId });
    }
  }

  static sendStopTypingStatus(conversationId, userId) {
    if (this.socket && conversationId && userId) {
      this.socket.emit('stop_typing', { idConversation: conversationId, userId });
    }
  }

  static onNewMessage(callback) {
    if (this.socket) {
      this.socket.off('new_message'); // Remove any existing listeners to prevent duplicates
      this.socket.on('new_message', (message) => {
        // Log specific details for image messages
        if (message && message.type === 'image') {
          console.log('📱 Received image message via socket:', {
            id: message._id,
            type: message.type,
            fileUrl: message.fileUrl,
            fileType: message.fileType
          });
        }
        
        // Call the provided callback with the message
        callback(message);
      });
    }
  }

  static onUserTyping(callback) {
    if (this.socket) {
      this.socket.on('user_typing', callback);
    }
  }

  static onUserStopTyping(callback) {
    if (this.socket) {
      this.socket.on('user_stop_typing', callback);
    }
  }

  static onMessageSeen(callback) {
    if (this.socket) {
      this.socket.on('seen_message', callback);
    }
  }

  static onMessageRevoked(callback) {
    if (this.socket) {
      this.socket.on('message_revoked', callback);
    }
  }

  static onMessageDeleted(callback) {
    if (this.socket) {
      this.socket.on('message_deleted', callback);
    }
  }

  static onRevokeMessageError(callback) {
    if (this.socket) {
      this.socket.on('revoke_message_error', callback);
    }
  }

  static onDeleteMessageError(callback) {
    if (this.socket) {
      this.socket.on('delete_message_error', callback);
    }
  }

  static onNewConversation(callback) {
    if (this.socket) {
      this.socket.on('new_conversation', callback);
    }
  }

  static onUpdateConversationList(callback) {
    if (this.socket) {
      this.socket.off('update_conversation_list'); // Remove any existing listeners
      this.socket.on('update_conversation_list', callback);
    }
  }
  
  // Group chat event listeners
  static onGroupCreated(callback) {
    if (this.socket) {
      this.socket.off('group_created'); // Remove any existing listeners
      this.socket.on('group_created', callback);
    }
  }
  
  static onGroupUpdated(callback) {
    if (this.socket) {
      this.socket.off('group_updated'); // Remove any existing listeners
      this.socket.on('group_updated', callback);
    }
  }
  
  static onMemberAdded(callback) {
    if (this.socket) {
      this.socket.off('member_added'); // Remove any existing listeners
      this.socket.on('member_added', callback);
    }
  }
  
  static onMemberRemoved(callback) {
    if (this.socket) {
      this.socket.off('member_removed'); // Remove any existing listeners
      this.socket.on('member_removed', callback);
    }
  }
  
  static onGroupLeft(callback) {
    if (this.socket) {
      this.socket.off('group_left'); // Remove any existing listeners
      this.socket.on('group_left', callback);
    }
  }
  
  static onGroupDeleted(callback) {
    if (this.socket) {
      this.socket.off('group_deleted'); // Remove any existing listeners
      this.socket.on('group_deleted', callback);
    }
  }

  static removeListener(event) {
    if (this.socket) {
      this.socket.off(event);
    }
  }

  static removeAllListeners() {
    if (this.socket) {
      this.socket.removeAllListeners();
    }
  }

  // Getter để lấy socketId hiện tại
  static getSocketId() {
    return this.currentSocketId;
  }

  static addReaction(messageId, conversationId, userId, emoji) {
    if (this.socket && messageId && conversationId && userId && emoji) {
      this.socket.emit('add_reaction', { messageId, conversationId, userId, emoji });
    }
  }

  static removeReaction(messageId, conversationId, userId, emoji) {
    if (this.socket && messageId && conversationId && userId && emoji) {
      this.socket.emit('remove_reaction', { messageId, conversationId, userId, emoji });
    }
  }

  static onMessageReaction(callback) {
    if (this.socket) {
      this.socket.on('message_reaction', callback);
    }
  }
  
  static forwardMessage(messageId, conversationId, userId) {
    if (this.socket && messageId && conversationId && userId) {
      this.socket.emit('forward_message', { messageId, conversationId, userId });
    }
  }
  
  static onForwardMessageSuccess(callback) {
    if (this.socket) {
      this.socket.on('forward_message_success', callback);
    }
  }
  
  static onForwardMessageError(callback) {
    if (this.socket) {
      this.socket.on('forward_message_error', callback);
    }
  }
}

export default SocketService; 