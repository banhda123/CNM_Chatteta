import axios from "axios";

const API_URL = "http://localhost:4000/user";

const AuthService = {
  // Login method
  login: async (phone, password) => {
    try {
      const response = await axios.post(`${API_URL}/login`, {
        phone,
        password,
      });

      if (response.data.token && response.data.refeshToken) {
        // Store tokens in localStorage
        localStorage.setItem("accessToken", response.data.token);
        localStorage.setItem("refreshToken", response.data.refeshToken);
        localStorage.setItem(
          "userData",
          JSON.stringify({
            _id: response.data._id,
            name: response.data.name,
            phone: response.data.phone,
          })
        );

        return { success: true, user: response.data };
      }
      throw new Error(response.data.message || "Login failed");
    } catch (error) {
      console.error("Login error:", error);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  },

  // Register method
  register: async (name, phone, password) => {
    try {
      const response = await axios.post(`${API_URL}/register`, {
        name,
        phone,
        password,
      });

      return { success: true, data: response.data };
    } catch (error) {
      console.error("Register error:", error);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  },

  // Send OTP method
  sendOTP: async (phone) => {
    try {
      const response = await axios.post(`${API_URL}/sendmail`, {
        email: phone, // API is using email field for OTP
      });

      return { success: true, data: response.data };
    } catch (error) {
      console.error("Send OTP error:", error);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  },

  // Verify OTP method
  verifyOTP: async (phone, otp) => {
    try {
      const response = await axios.post(`${API_URL}/checkotp`, {
        email: phone, // API is using email field
        otp,
      });

      return { success: true, data: response.data };
    } catch (error) {
      console.error("Verify OTP error:", error);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  },

  // Logout method
  logout: () => {
    try {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("userData");
      return true;
    } catch (error) {
      console.error("Logout error:", error);
      return false;
    }
  },

  // Get access token
  getAccessToken: () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        console.warn("No access token found in localStorage");
        return null;
      }
      return token;
    } catch (error) {
      console.error("Error retrieving token:", error);
      return null;
    }
  },

  // Get refresh token
  getRefreshToken: () => {
    return localStorage.getItem("refreshToken");
  },

  // Set user data
  setUserData: (userData) => {
    try {
      localStorage.setItem(
        "userData",
        JSON.stringify(userData)
      );
      return true;
    } catch (error) {
      console.error("Error saving user data:", error);
      return false;
    }
  },

  // Get user data
  getUserData: () => {
    try {
      const data = localStorage.getItem("userData");
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error("Error retrieving user data:", error);
      return null;
    }
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    try {
      const token = localStorage.getItem("accessToken");
      return !!token;
    } catch (error) {
      console.error("Error checking authentication:", error);
      return false;
    }
  },
};

export default AuthService;
