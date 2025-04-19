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

  // Get user data
  getUserData: () => {
    const data = localStorage.getItem("userData");
    return data ? JSON.parse(data) : null;
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    return !!localStorage.getItem("accessToken");
  },
};

export default AuthService;
