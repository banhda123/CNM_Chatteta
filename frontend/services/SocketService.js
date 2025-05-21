// Tạo một lớp ghi log đơn giản như ChatService
const Logger = {
  // Các cấp độ log
  levels: {
    DEBUG: 0,  // Chi tiết nhất, hữu ích khi phát triển
    INFO: 1,   // Thông tin chung
    WARN: 2,   // Cảnh báo
    ERROR: 3,  // Lỗi
  },
  
  // Cấu hình cấp độ hiện tại
  currentLevel: 1, // Mặc định chỉ hiện INFO trở lên
  
  // Bật/tắt group logs cho dễ đọc
  useGroups: true,
  
  // Thiết lập cấp độ log
  setLevel(level) {
    this.currentLevel = level;
  },
  
  // Các phương thức log theo cấp độ
  debug(message, data) {
    if (this.currentLevel <= this.levels.DEBUG) {
      if (data && this.useGroups) {
        console.groupCollapsed(`🔌 ${message}`);
        console.log(data);
        console.groupEnd();
      } else {
        console.log(`🔌 ${message}`, data || '');
      }
    }
  },
  
  info(message, data) {
    if (this.currentLevel <= this.levels.INFO) {
      if (data && this.useGroups) {
        console.groupCollapsed(`🔌 ${message}`);
        console.log(data);
        console.groupEnd();
      } else {
        console.log(`🔌 ${message}`, data || '');
      }
    }
  },
  
  warn(message, data) {
    if (this.currentLevel <= this.levels.WARN) {
      if (data && this.useGroups) {
        console.groupCollapsed(`🔌⚠️ ${message}`);
        console.log(data);
        console.groupEnd();
      } else {
        console.warn(`🔌⚠️ ${message}`, data || '');
      }
    }
  },
  
  error(message, error) {
    if (this.currentLevel <= this.levels.ERROR) {
      if (error && this.useGroups) {
        console.groupCollapsed(`🔌❌ ${message}`);
        console.error(error);
        console.groupEnd();
      } else {
        console.error(`🔌❌ ${message}`, error || '');
      }
    }
  }
};

// Trong môi trường production, chỉ hiển thị lỗi
if (process.env.NODE_ENV === 'production') {
  Logger.setLevel(Logger.levels.ERROR);
}

import { io } from 'socket.io-client';
import AuthService from './AuthService';

class SocketService {
  static socket = null;
  static isConnected = false;
  static currentSocketId = null;

  static connect() {
    if (this.socket && this.socket.connected) {
      Logger.debug('Socket already connected', { id: this.socket.id });
      this.isConnected = true;
      this.currentSocketId = this.socket.id;
      return this.socket;
    }

    if (this.socket) {
      // Socket exists but not connected, try reconnect
      Logger.info('Attempting to reconnect existing socket');
      this.socket.connect();
      return this.socket;
    }

    Logger.info('Creating new socket connection');
    this.socket = io('http://localhost:4000', {
      transports: ['websocket'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      Logger.info('Socket connected', { id: this.socket.id });
      this.isConnected = true;
      this.currentSocketId = this.socket.id;
      
      // Join user room using current user ID
      const userData = AuthService.getUserData();
      if (userData && userData._id) {
        this.joinUserRoom(userData);
      }
    });

    this.socket.on('disconnect', () => {
      Logger.info('Socket disconnected');
      this.isConnected = false;
    });

    this.socket.on('connect_error', (error) => {
      Logger.error('Socket connection error', error);
      this.isConnected = false;
    });

    return this.socket;
  }

  static disconnect() {
    if (this.socket) {
      Logger.info('Manually disconnecting socket');
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  static joinUserRoom(user) {
    if (this.socket && user && user._id) {
      Logger.debug('Joining user room', { userId: user._id });
      this.socket.emit('join_room', user);
    }
  }

  static leaveUserRoom(user) {
    if (this.socket && user && user._id) {
      Logger.debug('Leaving user room', { userId: user._id });
      this.socket.emit('leave_room', user);
    }
  }

  static joinConversation(conversationId) {
    if (this.socket && conversationId) {
      Logger.debug('Joining conversation', { conversationId });
      this.socket.emit('join_conversation', conversationId);
    }
  }

  static joinAllConversations(conversationIds) {
    if (this.socket && Array.isArray(conversationIds)) {
      Logger.debug('Joining multiple conversations', { count: conversationIds.length });
      this.socket.emit('join_all_conversation', conversationIds);
    }
  }
  
  // Group chat methods
  static createGroupConversation(groupData) {
    console.log('createGroupConversation via socket is deprecated - groups are created via HTTP API');
  }
  
  static addMemberToGroup(groupId, memberId) {
    if (this.socket) {
      Logger.info('Adding member to group', { groupId, memberId });
      this.socket.emit('add_member_to_group', { groupId, memberId });
    }
  }
  
  static removeMemberFromGroup(groupId, memberId) {
    if (this.socket) {
      Logger.info('Removing member from group', { groupId, memberId });
      this.socket.emit('remove_member_from_group', { groupId, memberId });
    }
  }
  
  // Thêm phương thức mới để emit sự kiện khi xóa thành viên khỏi nhóm
  static emitMemberRemovedFromGroup(data) {
    if (this.socket) {
      Logger.info('Emitting member removed from group', { 
        conversation: data.conversationId,
        member: data.memberId,
        removedBy: data.removedBy,
        memberName: data.memberName,
        removedByName: data.removedByName
      });
      
      // Log chi tiết để debug
      console.log('🔔 Gửi sự kiện member_removed_from_group:', {
        conversationId: data.conversationId,
        memberId: data.memberId,
        removedBy: data.removedBy,
        memberName: data.memberName,
        removedByName: data.removedByName,
        timestamp: data.timestamp
      });
      
      this.socket.emit('member_removed_from_group', data);
    }
  }
  
  static leaveGroup(groupId, userId) {
    if (this.socket) {
      Logger.info('User leaving group', { groupId, userId });
      this.socket.emit('leave_group', { groupId, userId });
    }
  }
  
  static updateGroupInfo(groupId, groupData) {
    if (this.socket) {
      Logger.info('Updating group info', { groupId });
      this.socket.emit('update_group_info', { groupId, ...groupData });
    }
  }

  static leaveConversation(conversationId) {
    if (this.socket && conversationId) {
      Logger.debug('Leaving conversation', { conversationId });
      this.socket.emit('leave_conversation', conversationId);
    }
  }

  static sendMessage(messageData) {
    if (this.socket) {
      const logData = {
        conversationId: messageData.idConversation,
        type: messageData.type || 'text'
      };
      
      Logger.info('Sending message via socket', logData);
      this.socket.emit('send_message', messageData);
    }
  }

  static markMessageAsSeen(conversationId) {
    if (this.socket && conversationId) {
      Logger.debug('Marking messages as seen', { conversationId });
      this.socket.emit('seen_message', conversationId);
    }
  }

  static createConversation(userFrom, userTo) {
    if (this.socket) {
      Logger.info('Creating new conversation', { from: userFrom, to: userTo });
      this.socket.emit('create_conversation', { userFrom, userTo });
    }
  }

  static revokeMessage(messageId, conversationId, userId) {
    if (this.socket && messageId && conversationId && userId) {
      Logger.info('Revoking message', { messageId, conversationId });
      this.socket.emit('revoke_message', { messageId, conversationId, userId });
    }
  }

  static deleteMessage(messageId, conversationId, userId) {
    if (this.socket && messageId && conversationId && userId) {
      Logger.info('Deleting message', { messageId, conversationId });
      this.socket.emit('delete_message', { messageId, conversationId, userId });
    }
  }

  static sendTypingStatus(conversationId, userId) {
    if (this.socket && conversationId && userId) {
      Logger.debug('Sending typing status', { conversationId, userId });
      this.socket.emit('typing', { idConversation: conversationId, userId });
    }
  }

  static sendStopTypingStatus(conversationId, userId) {
    if (this.socket && conversationId && userId) {
      Logger.debug('Sending stop typing status', { conversationId, userId });
      this.socket.emit('stop_typing', { idConversation: conversationId, userId });
    }
  }

  // Phương thức chung để đăng ký event listener an toàn
  static registerEventListener(eventName, callback) {
    if (!this.socket) return false;
    
    // Trước tiên gỡ bỏ listener hiện tại (nếu có) để tránh trùng lặp
    this.removeListener(eventName);
    
    // Giữ tham chiếu đến handler thực tế (closure) để có thể gỡ bỏ đúng handler
    const wrappedCallback = (...args) => {
      try {
        // Cấu trúc để tránh lặp vô hạn - chỉ log ở DEBUG hoặc xử lý nhanh
        Logger.debug(`Received ${eventName} event`);
        
        // Đối với các sự kiện nhạy cảm như user_online/user_offline, thêm bảo vệ chống trùng lặp
        if (eventName === 'user_online' || eventName === 'user_offline') {
          // Nếu là ID người dùng trùng lặp, kiểm tra xem đã xử lý gần đây chưa
          if (typeof args[0] === 'string' && this._recentEvents) {
            const userId = args[0];
            const key = `${eventName}_${userId}`;
            const now = Date.now();
            
            // Kiểm tra nếu cùng event này đã được xử lý trong 5 giây gần đây
            if (this._recentEvents[key] && (now - this._recentEvents[key] < 5000)) {
              // Bỏ qua sự kiện trùng lặp này
              Logger.debug(`Skipping duplicate ${eventName} event for ${userId}`);
              return;
            }
            
            // Ghi nhận thời gian xử lý event này
            if (!this._recentEvents) this._recentEvents = {};
            this._recentEvents[key] = now;
          }
        }
        
        // Thực thi callback
        callback(...args);
      } catch (error) {
        Logger.error(`Error in ${eventName} handler:`, error);
      }
    };
    
    // Lưu tham chiếu tới handler trong đối tượng WeakMap
    if (!this._eventHandlers) {
      this._eventHandlers = new WeakMap();
    }
    
    // Lưu handler mới
    const handlers = this._eventHandlers.get(this.socket) || {};
    handlers[eventName] = wrappedCallback;
    this._eventHandlers.set(this.socket, handlers);
    
    // Đăng ký handler mới
    this.socket.on(eventName, wrappedCallback);
    return true;
  }

  static onNewMessage(callback) {
    return this.registerEventListener('new_message', (message) => {
      // Log ngắn gọn thông tin cơ bản của tin nhắn
      if (message) {
        Logger.debug('New message received', {
          id: message._id,
          conversation: message.idConversation,
          type: message.type
        });
      }
      
      // Chuẩn hóa dữ liệu tin nhắn
      const normalizedMessage = this.normalizeMessage(message);
      // Gọi callback với dữ liệu đã chuẩn hóa
      callback(normalizedMessage);
    });
  }

  static onUserTyping(callback) {
    return this.registerEventListener('user_typing', (typingUserId) => {
      Logger.debug('User typing', { userId: typingUserId });
      callback(typingUserId);
    });
  }

  static onUserStopTyping(callback) {
    return this.registerEventListener('user_stop_typing', (typingUserId) => {
      Logger.debug('User stopped typing', { userId: typingUserId });
      callback(typingUserId);
    });
  }

  static onMessageSeen(callback) {
    return this.registerEventListener('seen_message', (data) => {
      Logger.debug('Message seen event', data);
      callback(data);
    });
  }

  static onMessageRevoked(callback) {
    return this.registerEventListener('message_revoked', (data) => {
      Logger.info('Message revoked', { messageId: data.messageId });
      callback(data);
    });
  }

  static onMessageDeleted(callback) {
    return this.registerEventListener('message_deleted', (data) => {
      Logger.info('Message deleted', { messageId: data.messageId });
      callback(data);
    });
  }

  static onRevokeMessageError(callback) {
    return this.registerEventListener('revoke_message_error', (error) => {
      Logger.error('Error revoking message', error);
      callback(error);
    });
  }

  static onDeleteMessageError(callback) {
    return this.registerEventListener('delete_message_error', (error) => {
      Logger.error('Error deleting message', error);
      callback(error);
    });
  }

  static onNewConversation(callback) {
    return this.registerEventListener('new_conversation', (conversation) => {
      Logger.info('New conversation created', { id: conversation._id });
      callback(conversation);
    });
  }

  static onUpdateConversationList(callback) {
    return this.registerEventListener('update_conversation_list', (data) => {
      Logger.debug('Conversation list updated', {
        id: data.conversation?._id,
        hasNewMessage: !!data.newMessage
      });
      callback(data);
    });
  }
  
  // Group chat event listeners
  static onGroupCreated(callback) {
    return this.registerEventListener('group_created', (newGroup) => {
      Logger.info('Group created', { 
        id: newGroup._id || newGroup.groupId, 
        name: newGroup.name || newGroup.groupName 
      });
      callback(newGroup);
    });
  }
  
  static onGroupUpdated(callback) {
    return this.registerEventListener('group_updated', (data) => {
      Logger.info('Group updated', { 
        id: data._id || data.conversationId,
        name: data.name,
        admin: data.admin?._id || data.admin,
        admin2: data.admin2?._id || data.admin2
      });
      console.log('group_updated received:', data);
      
      // Đảm bảo dữ liệu nhận được là một cuộc trò chuyện đầy đủ
      if (data && (data._id || data.conversationId)) {
        callback(data);
      } else {
        Logger.warn('Received invalid group update data', data);
      }
    });
  }
  
  static onMemberAdded(callback) {
    return this.registerEventListener('member_added', (data) => {
      Logger.info('Member added to group', { 
        conversation: data.conversation?._id,
        member: data.member?._id || data.member?.idUser?._id
      });
      
      // Log chi tiết để debug
      console.log('🔔 MEMBER_ADDED event received:', {
        conversationId: data.conversation?._id,
        conversationName: data.conversation?.name,
        memberInfo: data.member?.idUser?.name || 'Unknown member',
        timestamp: new Date().toISOString()
      });
      
      // Đảm bảo dữ liệu hợp lệ trước khi gọi callback
      if (data && data.conversation && data.conversation._id) {
        callback(data);
        
        // Thông báo cập nhật danh sách cuộc trò chuyện
        this.socket.emit('update_conversation_list', {
          conversation: data.conversation,
          timestamp: new Date().toISOString()
        });
      } else {
        Logger.warn('Invalid data received for member_added event', data);
      }
    });
  }
  
  static onMemberRemoved(callback) {
    return this.registerEventListener('member_removed', (data) => {
      Logger.info('Member removed from group', { 
        conversation: data.conversation,
        memberId: data.memberId
      });
      callback(data);
    });
  }
  
  // Add new method for handling member removed from group
  static onMemberRemovedFromGroup(callback) {
    return this.registerEventListener('member_removed_from_group', (data) => {
      Logger.info('Member removed from group event received', { 
        conversation: data.conversationId,
        member: data.memberId,
        removedBy: data.removedBy,
        timestamp: data.timestamp,
        memberName: data.memberName,
        removedByName: data.removedByName
      });
      
      // Log chi tiết để debug
      console.log('🔴 REMOVED FROM GROUP:', {
        conversationId: data.conversationId,
        memberId: data.memberId,
        removedBy: data.removedBy,
        groupName: data.groupName,
        timestamp: data.timestamp,
        memberName: data.memberName,
        removedByName: data.removedByName
      });
      
      // Thực hiện callback với đầy đủ dữ liệu
      callback(data);
      
      // Đảm bảo conversation bị xóa khỏi danh sách của người dùng bị xóa
      if (this.socket) {
        this.socket.emit('conversation_deleted', {
          conversationId: data.conversationId,
          userId: data.memberId
        });
      }
    });
  }
  
  // Add new method for handling when current user is removed from group
  static onRemovedFromGroup(callback) {
    return this.registerEventListener('removed_from_group', (data) => {
      Logger.info('User removed from group', { 
        conversationId: data.conversationId,
        groupName: data.groupName,
        removedBy: data.removedBy
      });
      
      // Log chi tiết để debug
      console.log('🚫 USER REMOVED FROM GROUP:', {
        conversationId: data.conversationId,
        groupName: data.groupName,
        removedBy: data.removedBy,
        message: data.message
      });
      
      // Thực hiện callback với đầy đủ dữ liệu
      callback(data);
    });
  }
  
  static onGroupLeft(callback) {
    return this.registerEventListener('group_left', (data) => {
      Logger.info('User left group', { 
        conversation: data.conversationId, 
        userId: data.userId 
      });
      callback(data);
    });
  }
  
  static onMemberLeftGroup(callback) {
    return this.registerEventListener('member_left_group', (data) => {
      Logger.info('Member left group', data);
      callback(data);
    });
  }
  
  static onGroupDeleted(callback) {
    return this.registerEventListener('group_deleted', (data) => {
      Logger.info('Group deleted', { 
        id: data.conversationId,
        groupName: data.groupName,
        deletedBy: data.deletedBy
      });
      
      // Log chi tiết để debug
      console.log('🔴 NHÓM ĐÃ BỊ XÓA:', {
        conversationId: data.conversationId,
        groupName: data.groupName,
        deletedBy: data.deletedBy,
        message: data.message
      });
      
      // Thực hiện callback với đầy đủ dữ liệu
      callback(data);
    });
  }

  static onAdmin2Assigned(callback) {
    return this.registerEventListener('admin2_assigned', (data) => {
      Logger.info('Admin2 assigned', { 
        conversation: data.conversation._id,
        member: data.memberId
      });
      callback(data);
    });
  }
  
  static onAdmin2Removed(callback) {
    return this.registerEventListener('admin2_removed', (data) => {
      Logger.info('Admin2 removed', { 
        conversation: data.conversation._id,
        member: data.memberId
      });
      callback(data);
    });
  }
  
  static pinMessage(messageId) {
    if (this.socket && messageId) {
      Logger.info('Pinning message', { messageId });
      this.socket.emit('pin_message', { messageId });
    }
  }
  
  static unpinMessage(messageId) {
    if (this.socket && messageId) {
      Logger.info('Unpinning message', { messageId });
      this.socket.emit('unpin_message', { messageId });
    }
  }
  
  static onMessagePinned(callback) {
    return this.registerEventListener('message_pinned', (data) => {
      Logger.info('Message pinned', { 
        messageId: data.message?._id,
        conversation: data.conversation
      });
      callback(data);
    });
  }
  
  static onMessageUnpinned(callback) {
    return this.registerEventListener('message_unpinned', (data) => {
      Logger.info('Message unpinned', { 
        messageId: data.messageId,
        conversation: data.conversation
      });
      console.log('🔔 SocketService received message_unpinned event:', JSON.stringify(data));
      callback(data);
    });
  }
  
  static addReaction(messageId, conversationId, userId, emoji) {
    if (this.socket && messageId && conversationId && userId && emoji) {
      Logger.debug('Adding reaction', { messageId, emoji });
      this.socket.emit('add_reaction', { messageId, conversationId, userId, emoji });
    }
  }

  static removeReaction(messageId, conversationId, userId, emoji) {
    if (this.socket && messageId && conversationId && userId && emoji) {
      Logger.debug('Removing reaction', { messageId, emoji });
      this.socket.emit('remove_reaction', { messageId, conversationId, userId, emoji });
    }
  }

  static onMessageReaction(callback) {
    return this.registerEventListener('message_reaction', (data) => {
      Logger.debug('Message reaction event', { 
        messageId: data.messageId, 
        emoji: data.emoji,
        action: data.action 
      });
      callback(data);
    });
  }
  
  static forwardMessage(messageId, conversationId, userId) {
    if (this.socket && messageId && conversationId && userId) {
      Logger.info('Forwarding message', { 
        messageId, 
        toConversation: conversationId 
      });
      this.socket.emit('forward_message', { messageId, conversationId, userId });
    }
  }
  
  static onForwardMessageSuccess(callback) {
    return this.registerEventListener('forward_message_success', (data) => {
      Logger.info('Message forwarded successfully', { 
        messageId: data._id,
        conversation: data.idConversation
      });
      callback(data);
    });
  }
  
  static onForwardMessageError(callback) {
    return this.registerEventListener('forward_message_error', (error) => {
      Logger.error('Error forwarding message', error);
      callback(error);
    });
  }

  static removeListener(eventName) {
    if (!this.socket) return;
    
    // Gỡ tất cả listeners cùng tên 
    this.socket.removeAllListeners(eventName);
    
    // Xóa khỏi danh sách internal nếu có
    if (this._eventHandlers && this._eventHandlers.has(this.socket)) {
      const handlers = this._eventHandlers.get(this.socket);
      if (handlers[eventName]) {
        delete handlers[eventName];
      }
    }
  }

  static removeAllListeners() {
    if (this.socket) {
      Logger.info('Removing all socket listeners');
      this.socket.removeAllListeners();
    }
  }

  // Getter để lấy socketId hiện tại
  static getSocketId() {
    return this.currentSocketId;
  }

  // Thông báo trạng thái trực tuyến/ngoại tuyến
  static setUserStatus(status) {
    if (this.socket) {
      Logger.info('Setting user status', { status });
      this.socket.emit('user_status', { status });
    }
  }

  static onUserOnline(callback) {
    return this.registerEventListener('user_online', (userId) => {
      Logger.info('User is online', { userId });
      callback(userId);
    });
  }

  static onUserOffline(callback) {
    return this.registerEventListener('user_offline', (userId) => {
      Logger.info('User is offline', { userId });
      callback(userId);
    });
  }

  // Xác nhận tin nhắn đã được gửi đến thiết bị
  static markMessageAsDelivered(messageId, conversationId) {
    if (this.socket && messageId && conversationId) {
      Logger.debug('Marking message as delivered', { messageId, conversationId });
      this.socket.emit('message_delivered', { messageId, conversationId });
    }
  }

  static onMessageDelivered(callback) {
    return this.registerEventListener('message_delivered', (data) => {
      Logger.info('Message delivered', { messageId: data.messageId });
      callback(data);
    });
  }

  // Thông báo tin nhắn đã được đọc bởi tất cả
  static onMessageReadByAll(callback) {
    return this.registerEventListener('message_read_by_all', (data) => {
      Logger.info('Message read by all members', { messageId: data.messageId, conversationId: data.conversationId });
      callback(data);
    });
  }

  // Đồng bộ hóa đa thiết bị
  static registerDevice(deviceInfo) {
    if (this.socket) {
      Logger.info('Registering device', deviceInfo);
      this.socket.emit('register_device', deviceInfo);
    }
  }

  static syncMessageStatus(messageIds, status) {
    if (this.socket && Array.isArray(messageIds)) {
      Logger.info('Syncing message status across devices', { count: messageIds.length, status });
      this.socket.emit('sync_message_status', { messageIds, status });
    }
  }

  static onDeviceSync(callback) {
    return this.registerEventListener('device_sync', (data) => {
      Logger.info('Received device sync', { type: data.type });
      callback(data);
    });
  }

  // Thông báo hoạt động nhóm chi tiết
  static onGroupActivity(callback) {
    return this.registerEventListener('group_activity', (data) => {
      Logger.info('Group activity', { groupId: data.conversationId, type: data.activityType });
      callback(data);
    });
  }

  // Thông báo ai đang xem tin nhắn
  static viewingMessages(conversationId) {
    if (this.socket && conversationId) {
      Logger.debug('User is viewing messages', { conversationId });
      this.socket.emit('viewing_messages', { conversationId });
    }
  }

  static stopViewingMessages(conversationId) {
    if (this.socket && conversationId) {
      Logger.debug('User stopped viewing messages', { conversationId });
      this.socket.emit('stop_viewing_messages', { conversationId });
    }
  }

  static onUserViewingMessages(callback) {
    return this.registerEventListener('user_viewing_messages', (data) => {
      Logger.info('User is viewing messages', { userId: data.userId, conversationId: data.conversationId });
      callback(data);
    });
  }

  // Thông báo lỗi realtime
  static onMessageError(callback) {
    return this.registerEventListener('message_error', (data) => {
      Logger.error('Message error', data);
      callback(data);
    });
  }

  // Đồng bộ lịch sử tin nhắn sau khi mất kết nối
  static syncMessages(lastMessageTimestamp, conversationId) {
    if (this.socket && conversationId) {
      Logger.info('Syncing messages after reconnect', { conversationId, lastMessageTimestamp });
      this.socket.emit('sync_messages', { conversationId, lastMessageTimestamp });
    }
  }

  static onSyncMessages(callback) {
    return this.registerEventListener('sync_messages_result', (data) => {
      Logger.info('Received synced messages', { count: data.messages?.length || 0 });
      callback(data);
    });
  }

  // Thông báo chỉ định người nhập trong nhóm
  static onSpecificUserTyping(callback) {
    return this.registerEventListener('specific_user_typing', (data) => {
      Logger.info('Specific user typing in group', { 
        userId: data.userId,
        userName: data.userName,
        conversationId: data.conversationId
      });
      callback(data);
    });
  }

  static normalizeMessage(message) {
    if (!message) return message;
    
    // Tạo bản sao để không ảnh hưởng đến dữ liệu gốc
    const normalizedMessage = {...message};
    
    // Chuẩn hóa ID người gửi
    if (normalizedMessage.sender && typeof normalizedMessage.sender === 'object' && normalizedMessage.sender._id) {
      // Lưu thông tin người gửi gốc để hiển thị UI
      normalizedMessage.originalSender = { ...normalizedMessage.sender };
      // Chỉ lưu ID để so sánh
      normalizedMessage.sender = normalizedMessage.sender._id;
    }
    
    // Đảm bảo ID tin nhắn nhất quán
    if (normalizedMessage._id) {
      normalizedMessage.id = normalizedMessage._id;
    }
    
    return normalizedMessage;
  }

  // Friend request event listeners
  static onNewFriendRequest(callback) {
    console.log('Registering new_friend_request listener');
    return this.registerEventListener('new_friend_request', (data) => {
      console.log('=== SOCKET EVENT: New friend request received ===', data);
      callback(data);
    });
  }

  static onFriendRequestAccepted(callback) {
    return this.registerEventListener('friend_request_accepted', (data) => {
      console.log('Friend request accepted', data);
      callback(data);
    });
  }

  static onFriendRequestRejected(callback) {
    return this.registerEventListener('friend_request_rejected', (data) => {
      console.log('Friend request rejected', data);
      callback(data);
    });
  }

  static onFriendRequestDeferred(callback) {
    return this.registerEventListener('friend_request_deferred', (data) => {
      console.log('Friend request deferred', data);
      callback(data);
    });
  }

  static onFriendRequestCanceled(callback) {
    return this.registerEventListener('friend_request_canceled', (data) => {
      console.log('Friend request canceled', data);
      callback(data);
    });
  }

  // Emit methods for friend request actions
  static emitSendFriendRequest(requestData) {
    if (!this.socket || !this.socket.connected) {
      console.error('Socket not connected when trying to send friend request');
      return false;
    }
    
    console.log('=== EMITTING SOCKET EVENT: send_friend_request ===', requestData);
    this.socket.emit('send_friend_request', requestData);
    return true;
  }

  static emitAcceptFriendRequest(requestData) {
    if (!this.socket || !this.socket.connected) {
      console.error('Socket not connected when trying to accept friend request');
      return false;
    }
    
    this.socket.emit('accept_friend_request', requestData);
    return true;
  }

  static emitRejectFriendRequest(requestData) {
    if (!this.socket || !this.socket.connected) {
      console.error('Socket not connected when trying to reject friend request');
      return false;
    }
    
    this.socket.emit('reject_friend_request', requestData);
    return true;
  }

  static emitDeferFriendRequest(requestData) {
    if (!this.socket || !this.socket.connected) {
      console.error('Socket not connected when trying to defer friend request');
      return false;
    }
    
    this.socket.emit('defer_friend_request', requestData);
    return true;
  }

  static emitCancelFriendRequest(requestData) {
    if (!this.socket || !this.socket.connected) {
      console.error('Socket not connected when trying to cancel friend request');
      return false;
    }
    
    this.socket.emit('cancel_friend_request', requestData);
    return true;
  }

  // Push Notification Support
  static onPushNotification(callback) {
    return this.registerEventListener('push_notification', (notification) => {
      console.log('Push notification received', notification);
      callback(notification);
    });
  }

  static emitRegisterPushToken(tokenData) {
    if (!this.socket || !this.socket.connected) {
      console.error('Socket not connected when trying to register push token');
      return false;
    }
    
    this.socket.emit('register_push_token', tokenData);
    return true;
  }

  // Queue notifications for multiple friend requests
  static onNotificationQueueUpdated(callback) {
    return this.registerEventListener('notification_queue_updated', (data) => {
      Logger.info('Notification queue updated', { count: data.count });
      callback(data);
    });
  }

  // Avatar update methods
  static emitAvatarUpdated(userId, avatarUrl) {
    if (this.socket) {
      Logger.info('Broadcasting avatar update', { userId, avatarUrl });
      this.socket.emit('avatar_updated', { userId, avatarUrl });
    }
  }

  static onAvatarUpdated(callback) {
    return this.registerEventListener('avatar_updated', (data) => {
      Logger.info('Received avatar update', { userId: data.userId });
      callback(data);
    });
  }
}

export default SocketService;