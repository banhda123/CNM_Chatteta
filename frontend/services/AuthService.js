import axios from "axios";

const API_URL = "http://localhost:4000/user";

// Thêm Logger để theo dõi quá trình xác thực
const Logger = {
  // Các cấp độ log
  levels: {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3,
  },
  
  // Cấu hình cấp độ hiện tại
  currentLevel: 1,
  
  // Bật/tắt group logs
  useGroups: true,
  
  // Thiết lập cấp độ log
  setLevel(level) {
    this.currentLevel = level;
  },
  
  // Các phương thức log
  debug(message, data) {
    if (this.currentLevel <= this.levels.DEBUG) {
      if (data && this.useGroups) {
        console.groupCollapsed(`🔑 ${message}`);
        console.log(data);
        console.groupEnd();
      } else {
        console.log(`🔑 ${message}`, data || '');
      }
    }
  },
  
  info(message, data) {
    if (this.currentLevel <= this.levels.INFO) {
      if (data && this.useGroups) {
        console.groupCollapsed(`🔑 ${message}`);
        console.log(data);
        console.groupEnd();
      } else {
        console.log(`🔑 ${message}`, data || '');
      }
    }
  },
  
  warn(message, data) {
    if (this.currentLevel <= this.levels.WARN) {
      if (data && this.useGroups) {
        console.groupCollapsed(`🔑⚠️ ${message}`);
        console.log(data);
        console.groupEnd();
      } else {
        console.warn(`🔑⚠️ ${message}`, data || '');
      }
    }
  },
  
  error(message, error) {
    if (this.currentLevel <= this.levels.ERROR) {
      if (error && this.useGroups) {
        console.groupCollapsed(`🔑❌ ${message}`);
        console.error(error);
        console.groupEnd();
      } else {
        console.error(`🔑❌ ${message}`, error || '');
      }
    }
  }
};

// Trong môi trường production, chỉ hiển thị lỗi
if (process.env.NODE_ENV === 'production') {
  Logger.setLevel(Logger.levels.ERROR);
}

// Biến để theo dõi quá trình refresh token
let isRefreshing = false;
let refreshSubscribers = [];

// Thêm biến để theo dõi token
let tokenExpiration = null;
let refreshTokenTimeout = null;

// Hàm để đăng ký callback khi refresh token thành công
const subscribeTokenRefresh = (callback) => {
  refreshSubscribers.push(callback);
};

// Hàm để thông báo cho tất cả subscribers khi refresh token thành công
const onRefreshed = (token) => {
  refreshSubscribers.forEach(callback => callback(token));
  refreshSubscribers = [];
};

const AuthService = {
  // Login method
  login: async (phone, password) => {
    try {
      Logger.info('Attempting login', { phone });
      
      const response = await axios.post(`${API_URL}/login`, {
        phone,
        password,
      });
      
      if (response.data.token && response.data.refeshToken) {
        Logger.info('Login successful');
        
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
        
        // Thiết lập hẹn giờ refresh token
        AuthService.setupTokenRefresh(response.data.token);
        
        return { success: true, user: response.data };
      }
      throw new Error(response.data.message || "Login failed");
    } catch (error) {
      Logger.error('Login failed', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  },

  // Register method
  register: async (name, phone, password) => {
    try {
      Logger.info('Attempting registration', { phone });
      
      const response = await axios.post(`${API_URL}/register`, {
        name,
        phone,
        password,
      });
      
      if (response.data && response.data.token) {
        Logger.info('Registration successful');
        
        // Store tokens in localStorage
        localStorage.setItem("accessToken", response.data.token);
        localStorage.setItem("refreshToken", response.data.refreshToken);
        localStorage.setItem(
          "userData",
          JSON.stringify({
            _id: response.data._id,
            name: response.data.name,
            phone: response.data.phone,
          })
        );
        
        // Thiết lập hẹn giờ refresh token
        AuthService.setupTokenRefresh(response.data.token);
      }
      
      return { success: true, data: response.data };
    } catch (error) {
      Logger.error('Registration failed', error);
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
  logout: async () => {
    try {
      Logger.info('Logging out user');
      
      // Xóa hẹn giờ refresh token
      if (refreshTokenTimeout) {
        clearTimeout(refreshTokenTimeout);
        refreshTokenTimeout = null;
      }
      
      // Xóa token và thông tin người dùng khỏi localStorage
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("userData");
      
      // Cập nhật biến theo dõi
      tokenExpiration = null;
      isRefreshing = false;
      refreshSubscribers = [];
      
      return true;
    } catch (error) {
      Logger.error('Error during logout', error);
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

  // Get current user with complete data
  getCurrentUser: async () => {
    try {
      // First try to get from localStorage
      const userData = AuthService.getUserData();
      
      if (!userData || !userData._id) {
        Logger.warn('No user data found in localStorage');
        return null;
      }
      
      // Get token
      const token = AuthService.getAccessToken();
      if (!token) {
        Logger.warn('No access token available');
        return userData; // Return basic user data if no token
      }
      
      // Get full user data from server if needed
      // For now just return the stored user data
      return userData;
    } catch (error) {
      Logger.error('Error getting current user', error);
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

  // Cấu hình interceptor cho axios
  setupAxiosInterceptors: () => {
    // Request interceptor
    axios.interceptors.request.use(
      async (config) => {
        // Không thêm token cho các request liên quan đến refresh token
        if (config.url.includes('/refresh-token')) {
          return config;
        }
        
        const token = AuthService.getAccessToken();
        
        // Thêm token vào header nếu có
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        
        return config;
      },
      (error) => Promise.reject(error)
    );
    
    // Response interceptor
    axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        
        // Kiểm tra lỗi token hết hạn (401) và chưa thử lại
        if (error.response && error.response.status === 401 && !originalRequest._retry) {
          // Nếu chưa đang refresh token
          if (!isRefreshing) {
            originalRequest._retry = true;
            isRefreshing = true;
            
            try {
              // Thử refresh token
              const newToken = await AuthService.refreshToken();
              
              // Nếu refresh thành công
              if (newToken) {
                // Cập nhật token trong original request
                originalRequest.headers.Authorization = `Bearer ${newToken}`;
                
                // Thông báo cho tất cả subscribers
                onRefreshed(newToken);
                
                // Tiếp tục thực hiện original request
                return axios(originalRequest);
              }
            } catch (refreshError) {
              Logger.error('Token refresh failed', refreshError);
              
              // Nếu refresh token thất bại, đăng xuất người dùng
              await AuthService.logout();
              
              // Chuyển đến trang đăng nhập
              window.location.href = '/login';
              
              return Promise.reject(refreshError);
            } finally {
              isRefreshing = false;
            }
          } else {
            // Đang trong quá trình refresh token, đăng ký callback
            return new Promise((resolve) => {
              subscribeTokenRefresh((token) => {
                originalRequest.headers.Authorization = `Bearer ${token}`;
                resolve(axios(originalRequest));
              });
            });
          }
        }
        
        return Promise.reject(error);
      }
    );
  },

  // Lấy token mới từ refresh token
  refreshToken: async () => {
    try {
      Logger.info('Refreshing token');
      
      const refreshToken = localStorage.getItem('refreshToken');
      
      if (!refreshToken) {
        Logger.warn('No refresh token available');
        return null;
      }
      
      const response = await axios.post(`${API_URL}/refresh-token`, {
        refreshToken
      });
      
      if (response.data && response.data.token) {
        Logger.info('Token refreshed successfully');
        
        // Cập nhật token trong localStorage
        localStorage.setItem('accessToken', response.data.token);
        
        // Cập nhật refresh token nếu được cung cấp
        if (response.data.refreshToken) {
          localStorage.setItem('refreshToken', response.data.refreshToken);
        }
        
        // Thiết lập hẹn giờ refresh token
        AuthService.setupTokenRefresh(response.data.token);
        
        return response.data.token;
      }
      
      return null;
    } catch (error) {
      Logger.error('Token refresh error', error);
      throw error;
    }
  },

  // Phân tích JWT token để lấy thời gian hết hạn
  parseJwt: (token) => {
    try {
      // Phân tích JWT token
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split("")
          .map(function (c) {
            return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
          })
          .join("")
      );
      
      return JSON.parse(jsonPayload);
    } catch (error) {
      Logger.error('Error parsing JWT token', error);
      return null;
    }
  },

  // Thiết lập hẹn giờ refresh token
  setupTokenRefresh: (token) => {
    // Xóa timeout cũ nếu có
    if (refreshTokenTimeout) {
      clearTimeout(refreshTokenTimeout);
      refreshTokenTimeout = null;
    }
    
    try {
      // Phân tích token để lấy thời gian hết hạn
      const decodedToken = AuthService.parseJwt(token);
      
      if (!decodedToken || !decodedToken.exp) {
        Logger.warn('Token does not contain expiration time');
        return;
      }
      
      // Tính thời gian còn lại trước khi token hết hạn (milliseconds)
      const expiresIn = decodedToken.exp * 1000 - Date.now();
      
      // Lưu thời gian hết hạn
      tokenExpiration = new Date(decodedToken.exp * 1000);
      
      Logger.info('Token expiration time', { 
        expiresAt: tokenExpiration, 
        timeRemaining: `${Math.floor(expiresIn / 1000)} seconds` 
      });
      
      // Nếu token đã hết hạn
      if (expiresIn <= 0) {
        Logger.warn('Token already expired');
        AuthService.refreshToken();
        return;
      }
      
      // Refresh token trước khi hết hạn 1 phút
      const refreshDelay = Math.max(expiresIn - 60000, 0);
      
      Logger.debug('Setting up token refresh', { 
        refreshIn: `${Math.floor(refreshDelay / 1000)} seconds` 
      });
      
      // Thiết lập timeout để refresh token
      refreshTokenTimeout = setTimeout(() => {
        Logger.info('Auto-refreshing token');
        AuthService.refreshToken();
      }, refreshDelay);
    } catch (error) {
      Logger.error('Error setting up token refresh', error);
    }
  },

  // Kiểm tra token hiện tại đã hết hạn chưa
  isTokenExpired: () => {
    const token = AuthService.getAccessToken();
    
    if (!token) {
      return true;
    }
    
    try {
      // Phân tích token
      const decodedToken = AuthService.parseJwt(token);
      
      if (!decodedToken || !decodedToken.exp) {
        return true;
      }
      
      // So sánh với thời gian hiện tại
      return decodedToken.exp * 1000 < Date.now();
    } catch (error) {
      Logger.error('Error checking token expiration', error);
      return true;
    }
  },

  // Huỷ kết bạn với người dùng khác
  removeFriend: async (friendId) => {
    try {
      Logger.info('Removing friend relationship', { friendId });
      
      // Lấy token xác thực
      const token = AuthService.getAccessToken();
      if (!token) {
        throw new Error('Không có token xác thực');
      }
      
      // Lấy ID người dùng hiện tại
      const userData = AuthService.getUserData();
      if (!userData || !userData._id) {
        throw new Error('Không có thông tin người dùng');
      }
      
      // Gọi API để huỷ kết bạn
      const response = await axios.post(`${API_URL}/unFriend`, {
        userFrom: userData._id,
        userTo: friendId
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.data && response.data.success) {
        Logger.info('Friend removed successfully');
        
        // Cập nhật thông tin người dùng nếu API trả về thông tin mới
        if (response.data.user) {
          AuthService.setUserData(response.data.user);
        }
        
        return { success: true, message: 'Đã huỷ kết bạn thành công' };
      }
      
      return { success: false, message: 'Không thể huỷ kết bạn' };
    } catch (error) {
      Logger.error('Error removing friend', error);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  },
};

// Thiết lập interceptors khi service được import
AuthService.setupAxiosInterceptors();

export default AuthService;
