import { API_URL } from './api';
import { getSocket, socketEvents } from './socket';
import axios from 'axios';

export const chatService = {
  // Friend management
  async getFriends() {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/friends/list`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error getting friends:', error);
      throw error;
    }
  },

  async getFriendRequests() {
    try {
      const token = localStorage.getItem('token');
      console.log('Fetching friend requests with token:', token ? 'present' : 'missing');
      
      const response = await axios.get(`${API_URL}/friends/requests`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('Friend request response from API:', response.data);
      
      // Ensure both received and sent are arrays
      const receivedRequests = Array.isArray(response.data.received) 
        ? response.data.received 
        : (response.data.received ? [response.data.received] : []);
        
      const sentRequests = Array.isArray(response.data.sent) 
        ? response.data.sent 
        : (response.data.sent ? [response.data.sent] : []);
      
      console.log('Processed received requests:', receivedRequests);
      console.log('Processed sent requests:', sentRequests);
      
      // Trả về đúng cấu trúc bao gồm trường success
      return {
        success: true,
        received: receivedRequests,
        sent: sentRequests
      };
    } catch (error) {
      console.error('Error getting friend requests:', error);
      
      if (error.response) {
        console.error('Error response:', error.response.data);
      }
      
      // Return error structure with success=false
      return {
        success: false,
        received: [],
        sent: [],
        error: error.message || 'Không thể lấy danh sách lời mời kết bạn'
      };
    }
  },

  async searchUsers(keyword) {
    try {
      if (!keyword || keyword.trim() === '') {
        return { success: true, data: [] };
      }

      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/users/search`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        params: {
          q: keyword.trim()
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error searching users:', error);
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error('Error response:', error.response.data);
        throw new Error(error.response.data.message || 'Error searching users');
      } else if (error.request) {
        // The request was made but no response was received
        console.error('No response received:', error.request);
        throw new Error('No response from server');
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error('Error setting up request:', error.message);
        throw new Error('Error setting up request');
      }
    }
  },

  async sendFriendRequest(receiverId) {
    try {
      const token = localStorage.getItem('token');
      console.log('Sending friend request to:', receiverId);
      
      const response = await axios.post(
        `${API_URL}/friends/request`,
        { receiverId },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );
      
      console.log('Friend request response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error sending friend request:', error);
      
      if (error.response) {
        console.log('Server response:', error.response.data);
        
        if (error.response.data) {
          return {
            ...error.response.data,
            success: false
          };
        }
      }
      
      return {
        success: false,
        message: 'Lỗi gửi lời mời kết bạn: ' + (error.message || 'Lỗi không xác định')
      };
    }
  },

  async acceptFriendRequest(requestId) {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `${API_URL}/friends/request/${requestId}/accept`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error accepting friend request:', error);
      throw error;
    }
  },

  async rejectFriendRequest(requestId) {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(
        `${API_URL}/friends/request/${requestId}/reject`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error rejecting friend request:', error);
      throw error;
    }
  },

  async removeFriend(friendId) {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.delete(`${API_URL}/friends/${friendId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error removing friend:', error);
      throw error;
    }
  },

  // Chat messages
  async getMessages(conversationId) {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/chat/messages/${conversationId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error getting messages:', error);
      throw error;
    }
  },

  async sendMessage(conversationId, content, type = 'text') {
    const socket = getSocket();
    if (!socket) throw new Error('Socket not connected');

    return new Promise((resolve, reject) => {
      socket.emit(socketEvents.SEND_MESSAGE, { conversationId, content, type }, (response) => {
        if (response.success) {
          resolve(response);
        } else {
          reject(new Error(response.message));
        }
      });
    });
  },

  async uploadFile(file) {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/upload`, formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw error;
    }
  },

  // Socket events
  joinConversation(conversationId) {
    const socket = getSocket();
    if (socket) {
      socket.emit(socketEvents.JOIN_CONVERSATION, conversationId);
    }
  },

  leaveConversation(conversationId) {
    const socket = getSocket();
    if (socket) {
      socket.emit(socketEvents.LEAVE_CONVERSATION, conversationId);
    }
  },

  updateStatus(status) {
    const socket = getSocket();
    if (socket) {
      socket.emit(socketEvents.UPDATE_STATUS, { status });
    }
  }
}; 