import { io } from 'socket.io-client';
import { API_URL } from './api';

let socket = null;

export const connectSocket = (token) => {
  if (socket) {
    socket.disconnect();
  }

  socket = io(API_URL, {
    auth: {
      token: `Bearer ${token}`
    },
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    timeout: 10000,
    transports: ['websocket', 'polling']
  });

  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error);
    if (error.message.includes('invalid signature')) {
      // Token không hợp lệ, xóa token và chuyển hướng đến trang đăng nhập
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const getSocket = () => socket;

export const socketEvents = {
  // User events
  UPDATE_STATUS: 'update-status',
  STATUS_CHANGED: 'status-changed',
  
  // Friend events
  FRIEND_REQUEST: 'friend-request',
  FRIEND_REQUEST_ACCEPTED: 'friend-request-accepted',
  FRIEND_REQUEST_REJECTED: 'friend-request-rejected',
  FRIEND_REMOVED: 'friend-removed',
  
  // Chat events
  JOIN_CONVERSATION: 'join-conversation',
  LEAVE_CONVERSATION: 'leave-conversation',
  SEND_MESSAGE: 'send-message',
  NEW_MESSAGE: 'new-message',
  MESSAGE_DELIVERED: 'message-delivered',
  MESSAGE_READ: 'message-read',
  
  // File events
  FILE_UPLOADED: 'file-uploaded',
  FILE_DOWNLOADED: 'file-downloaded'
}; 