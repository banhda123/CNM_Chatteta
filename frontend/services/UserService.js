import axios from "axios";
import * as SecureStore from "expo-secure-store";
const API_URL = "http://localhost:4000/user"; // Replace with your actual API base URL

const UserService = {
  // Basic User Operations
  getAllUsers: async () => {
    try {
      const response = await axios.get(`${API_URL}/`);
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
      const response = await axios.post(`${API_URL}/login`, {
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
      const response = await axios.post(
        `${API_URL}/acceptFriend`,
        { userFrom, userTo },
        {
          headers: {
            Authorization: `Bearer ${token}`,
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
      const response = await axios.post(
        `${API_URL}/dontAcceptFriend`,
        { userFrom, userTo },
        {
          headers: {
            Authorization: `Bearer ${token}`,
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
      const response = await axios.get(
        `${API_URL}/getAllFriendByUser/${userId}`
      );
      return response.data;
    } catch (error) {
      console.error("Error getting all friends:", error);
      throw error;
    }
  },

  getAllFriendRequests: async (userId) => {
    try {
      const response = await axios.get(
        `${API_URL}/getAllPeopleRequestByUser/${userId}`
      );
      return response.data;
    } catch (error) {
      console.error("Error getting friend requests:", error);
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
