import axios from "axios";
import * as SecureStore from "expo-secure-store";
import { API_URL as BASE_API_URL, getApiUrl } from "../config/constants";

// Khởi tạo với giá trị mặc định
let API_URL = `${BASE_API_URL}/user`;

// Hàm helper để lấy API URL hiện tại
const getBaseUrl = async () => {
  try {
    const baseUrl = await getApiUrl();
    return baseUrl;
  } catch (error) {
    console.error('Error getting API URL, using default', error);
    return BASE_API_URL;
  }
};

// Hàm helper để tạo URL API đầy đủ
const getApiEndpoint = async (endpoint) => {
  const baseUrl = await getBaseUrl();
  return `${baseUrl}/user${endpoint}`;
};

// Cập nhật API URL khi có thay đổi
const updateServiceApiUrl = async () => {
  try {
    const baseUrl = await getBaseUrl();
    API_URL = `${baseUrl}/user`;
    console.log('User API URL updated:', API_URL);
  } catch (error) {
    console.error('Failed to update User API URL', error);
  }
};

// Gọi hàm này khi khởi động ứng dụng
updateServiceApiUrl();

const UserService = {
  // Basic User Operations
  getAllUsers: async () => {
    try {
      // Đảm bảo lấy URL mới nhất trước khi gọi API
      await updateServiceApiUrl();
      
      const apiUrl = `${API_URL}/`;
      console.log('Get All Users URL:', apiUrl);
      
      const response = await axios.get(apiUrl);
      return response.data;
    } catch (error) {
      console.error("Error fetching all users:", error);
      throw error;
    }
  },

  getUserById: async (id) => {
    try {
      const response = await axios.get(`${API_URL}/${id}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching user by ID:", error);
      throw error;
    }
  },

  searchUser: async (searchCriteria) => {
    try {
      const response = await axios.post(`${API_URL}/search`, {
        phone: searchCriteria,
      });
      return response.data;
    } catch (error) {
      console.error("Error searching user:", error);
      throw error;
    }
  },

  // Authentication
  login: async (phone, password) => {
    try {
      // Đảm bảo lấy URL mới nhất trước khi gọi API
      await updateServiceApiUrl();
      
      const apiUrl = `${API_URL}/login`;
      console.log('Login URL (UserService):', apiUrl);
      
      const response = await axios.post(apiUrl, {
        phone,
        password,
      });
      if (response.data.token && response.data.refeshToken) {
        // Note the typo "refeshToken" matches your backend
        // Store tokens securely
        await SecureStore.setItemAsync("accessToken", response.data.token);
        await SecureStore.setItemAsync(
          "refreshToken",
          response.data.refeshToken
        );

        // Store user data if needed
        await SecureStore.setItemAsync(
          "userData",
          JSON.stringify({
            _id: response.data._id,
            name: response.data.name,
            phone: response.data.phone,
          })
        );

        return { success: true, user: response.data };
      }

      throw new Error("No tokens received");
    } catch (error) {
      console.error("Login error:", error);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  },

  register: async (name, phone, password) => {
    try {
      const response = await axios.post(`${API_URL}/register`, {
        name,
        phone,
        password,
      });
      return response.data;
    } catch (error) {
      console.error("Registration error:", error);
      throw error;
    }
  },

  getNewToken: async (refreshToken) => {
    try {
      const response = await axios.post(`${API_URL}/getnewtoken`, {
        refreshToken,
      });
      return response.data;
    } catch (error) {
      console.error("Error getting new token:", error);
      throw error;
    }
  },

  // Password Recovery
  sendOtp: async (email) => {
    try {
      const response = await axios.post(`${API_URL}/sendmail`, { email });
      return response.data;
    } catch (error) {
      console.error("Error sending OTP:", error);
      throw error;
    }
  },

  verifyOtp: async (email, otp) => {
    try {
      const response = await axios.post(`${API_URL}/checkotp`, { email, otp });
      return response.data;
    } catch (error) {
      console.error("Error verifying OTP:", error);
      throw error;
    }
  },

  updatePassword: async (email, password) => {
    try {
      const response = await axios.post(`${API_URL}/updatepassword`, {
        email,
        password,
      });
      return response.data;
    } catch (error) {
      console.error("Error updating password:", error);
      throw error;
    }
  },

  // Profile Management
  changeAvatar: async (userId, imageFile, token) => {
    try {
      const formData = new FormData();
      formData.append("image", imageFile);
      formData.append("_id", userId);

      const response = await axios.post(`${API_URL}/avatar`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error("Error changing avatar:", error);
      throw error;
    }
  },

  updateUserInfo: async (userInfo, token) => {
    try {
      const response = await axios.post(`${API_URL}/update-profile`, userInfo, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error("Error updating user info:", error);
      throw error;
    }
  },

  changeUserPassword: async (passwordData, token) => {
    try {
      const response = await axios.post(`${API_URL}/change-password`, passwordData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch (error) {
      console.error("Error changing password:", error);
      throw error;
    }
  },

  // Friend Operations
  addFriend: async (userTo, token) => {
    try {
      const response = await axios.post(
        `${API_URL}/addFriend`,
        {
          id: userTo._id, // Keep the ID
          name: userTo.name, // Add name
          avatar: userTo.avatar, // Add avatar },
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error adding friend:", error);
      throw error;
    }
  },

  acceptFriend: async (userFrom, userTo, token) => {
    try {
      // The backend expects userTo._id
      const userToId = typeof userTo === 'object' && userTo._id ? userTo._id : userTo;
      
      console.log('Accepting friend request with data:', {
        userFrom,
        userTo: { _id: userToId }
      });
      
      const response = await axios.post(
        `${API_URL}/acceptFriend`,
        {
          userFrom,
          userTo: { _id: userToId }
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error accepting friend request:", error);
      throw error;
    }
  },

  rejectFriend: async (userFrom, userTo, token) => {
    try {
      // Use cancelFriendRequest which is properly implemented in the backend
      const userToId = typeof userTo === 'object' && userTo._id ? userTo._id : userTo;
      
      console.log('Rejecting friend request with data:', {
        userFrom,
        userTo: userToId
      });
      
      const response = await axios.post(
        `${API_URL}/cancelFriendRequest`,
        {
          userFrom,
          userTo: userToId
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error rejecting friend request:", error);
      throw error;
    }
  },

  removeFriend: async (userFrom, userTo, idConversation, token) => {
    try {
      const response = await axios.post(
        `${API_URL}/unFriend`,
        { userFrom, userTo, idConversation },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error removing friend:", error);
      throw error;
    }
  },

  getAllFriends: async (userId) => {
    try {
      if (!userId) {
        console.warn("Missing userId in getAllFriends call");
        return [];
      }

      console.log(`Fetching friends for user: ${userId}`);
      
      const response = await axios.get(
        `${API_URL}/getAllFriendByUser/${userId}`
      );
      
      // Validate response data
      if (!response || !response.data) {
        console.warn("Invalid response from getAllFriendByUser endpoint");
        return [];
      }
      
      // Ensure we're returning an array even if the backend returns something else
      if (!Array.isArray(response.data)) {
        console.warn("Friends data is not an array, returning empty array");
        return [];
      }
      
      return response.data;
    } catch (error) {
      console.error("Error getting all friends:", error);
      // Return empty array instead of throwing error to prevent UI crashes
      return [];
    }
  },

  getAllFriendRequests: async (userId) => {
    try {
      if (!userId) {
        console.warn("Missing userId in getAllFriendRequests call");
        return [];
      }

      console.log(`🔍 FETCH: Getting friend requests for user: ${userId}`);
      
      const response = await axios.get(
        `${API_URL}/getAllPeopleRequestByUser/${userId}`
      );
      
      // Validate response data
      if (!response || !response.data) {
        console.warn("Invalid response from getAllPeopleRequestByUser endpoint");
        return [];
      }
      
      // Ensure we're returning an array even if the backend returns something else
      if (!Array.isArray(response.data)) {
        console.warn("Friend requests data is not an array, returning empty array");
        return [];
      }
      
      console.log(`✅ RECEIVED: ${response.data.length} friend requests`);
      return response.data;
    } catch (error) {
      console.error("Error getting friend requests:", error);
      
      // Return empty array instead of throwing error to prevent UI crashes
      return [];
    }
  },

  getAllSentFriendRequests: async (userId) => {
    try {
      if (!userId) {
        console.warn("Missing userId in getAllSentFriendRequests call");
        return [];
      }

      console.log(`🔍 FETCH: Getting sent friend requests for user: ${userId}`);
      
      const response = await axios.get(
        `${API_URL}/getAllSentRequestsByUser/${userId}`
      );
      
      // Validate response data
      if (!response || !response.data) {
        console.warn("Invalid response from getAllSentRequestsByUser endpoint");
        return [];
      }
      
      // Ensure we're returning an array even if the backend returns something else
      if (!Array.isArray(response.data)) {
        console.warn("Sent requests data is not an array, returning empty array");
        return [];
      }
      
      console.log(`✅ RECEIVED: ${response.data.length} sent friend requests`);
      return response.data;
    } catch (error) {
      console.error("Error getting sent friend requests:", error);
      // Return empty array instead of throwing error to prevent UI crashes
      return [];
    }
  },

  // Hàm kiểm tra trạng thái kết bạn
  checkFriendshipStatus: async (userFrom, userTo, token) => {
    try {
      const response = await axios.get(
        `${API_URL}/checkFriendshipStatus/${userFrom}/${userTo}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error checking friendship status:", error);
      throw error;
    }
  },

  // Tạm hoãn quyết định lời mời kết bạn
  deferFriendRequest: async (userFrom, userTo, token) => {
    try {
      const response = await axios.post(
        `${API_URL}/deferFriendRequest`,
        { userFrom, userTo },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error deferring friend request:", error);
      throw error;
    }
  },

  // Lấy danh sách lời mời đã tạm hoãn
  getDeferredFriendRequests: async (userId, token) => {
    try {
      if (!userId) {
        console.warn("Missing userId in getDeferredFriendRequests call");
        return [];
      }

      if (!token) {
        console.warn("Missing token in getDeferredFriendRequests call");
        return [];
      }

      console.log(`Fetching deferred friend requests for user: ${userId}`);
      
      const response = await axios.get(
        `${API_URL}/getDeferredRequests/${userId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      // Validate response data
      if (!response || !response.data) {
        console.warn("Invalid response from getDeferredRequests endpoint");
        return [];
      }
      
      // Ensure we're returning an array even if the backend returns something else
      if (!Array.isArray(response.data)) {
        console.warn("Deferred requests data is not an array, returning empty array");
        return [];
      }
      
      return response.data;
    } catch (error) {
      console.error("Error getting deferred friend requests:", error);
      // Return empty array instead of throwing error to prevent UI crashes
      return [];
    }
  },

  // Hủy lời mời kết bạn đã gửi
  cancelFriendRequest: async (userFrom, userTo, token) => {
    try {
      const response = await axios.post(
        `${API_URL}/cancelFriendRequest`,
        { userFrom, userTo },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error canceling friend request:", error);
      throw error;
    }
  },

  // Demo endpoint
  demo: async () => {
    try {
      const response = await axios.get(`${API_URL}/demo`);
      return response.data;
    } catch (error) {
      console.error("Error calling demo endpoint:", error);
      throw error;
    }
  },
};

export default UserService;
