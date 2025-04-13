import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth APIs
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
};

// User APIs
export const userAPI = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (profileData) => api.put('/users/profile', profileData),
  uploadAvatar: (formData) => api.post('/users/avatar', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
  searchUsers: (query) => api.get(`/users/search?q=${encodeURIComponent(query)}`),
};

// Friend APIs
export const friendAPI = {
  getFriends: async () => {
    try {
      const response = await api.get('/friends');
      
      // Handle the case where 'friends' is a single object, not an array
      if (response.data && response.data.success) {
        if (response.data.friends && !Array.isArray(response.data.friends) && typeof response.data.friends === 'object') {
          console.log('Converting single friend object to array');
          return {
            data: {
              ...response.data,
              friends: [response.data.friends]
            }
          };
        }
        return response;
      } else {
        console.log('Unexpected response structure:', response.data);
        return {
          data: {
            success: true,
            friends: []
          }
        };
      }
    } catch (error) {
      console.error('Error getting friends:', error);
      return {
        data: {
          success: true,
          friends: []
        }
      };
    }
  },
  getFriendRequests: async () => {
    try {
      // First try to get requests with the default endpoint
      const response = await api.get('/friends/requests', {
        timeout: 15000 // Tăng timeout lên 15 giây
      });
      
      // Check if response data has a specific structure we need to handle
      if (response.data && response.data.received) {
        if (!Array.isArray(response.data.received) && typeof response.data.received === 'object') {
          // If received is a single object (not in an array), wrap it in an array
          console.log('Converting single received object to array');
          return {
            data: {
              ...response.data,
              received: [response.data.received]
            }
          };
        }
        return response;
      } else {
        console.log('Unexpected response structure:', response.data);
        return {
          data: {
            success: true,
            received: [],
            sent: []
          }
        };
      }
    } catch (error) {
      // Enhanced error logging
      console.error('Server error getting friend requests:', error);
      
      if (error.response) {
        // The server responded with a status code outside of 2xx range
        console.error('Server response data:', error.response.data);
        console.error('Server response status:', error.response.status);
        console.error('Server response headers:', error.response.headers);
        
        try {
          // Return a valid response structure with empty arrays to prevent UI errors
          // But also include the error message from server if available
          return {
            data: {
              success: false,
              received: [],
              sent: [],
              error: error.response.data?.message || 'Server error'
            }
          };
        } catch (alternativeError) {
          console.error('Alternative approach also failed:', alternativeError);
        }
      } else if (error.request) {
        // The request was made but no response was received
        console.error('No response received:', error.request);
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error('Error message:', error.message);
      }
      
      // Return a fake successful response with empty arrays to avoid breaking the UI
      return {
        data: {
          success: true,
          received: [],
          sent: []
        }
      };
    }
  },
  sendFriendRequest: (userId) => {
    // Ensure userId is a valid integer
    const receiverId = parseInt(userId, 10);
    if (isNaN(receiverId)) {
      return Promise.reject(new Error('Invalid user ID. Must be a number.'));
    }
    return api.post('/friends/request', { receiverId });
  },
  acceptFriendRequest: (requestId) => api.put(`/friends/request/${requestId}/accept`),
  rejectFriendRequest: (requestId) => api.put(`/friends/request/${requestId}/reject`),
  cancelFriendRequest: (requestId) => api.delete(`/friends/request/${requestId}`),
};

// Chat APIs
export const chatAPI = {
  getMessages: (userId) => api.get(`/chat/messages/${userId}`),
  sendMessage: (messageData) => api.post('/chat/messages', messageData),
  uploadFile: (formData) => api.post('/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
};

export default api; 