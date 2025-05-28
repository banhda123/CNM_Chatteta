// API URLs
// Sử dụng giá trị từ localStorage hoặc biến môi trường hoặc giá trị mặc định
const getDefaultApiUrl = () => {
  // Đầu tiên, thử lấy từ localStorage
  const savedUrl = localStorage.getItem('API_URL');
  if (savedUrl) return savedUrl;
  
  // Nếu không có trong localStorage, sử dụng biến môi trường
  if (process.env.REACT_APP_API_URL) return process.env.REACT_APP_API_URL;
  
  // Nếu không có biến môi trường, sử dụng giá trị mặc định
  return "https://cnmnhom10backend-production.up.railway.app";
};

// Khởi tạo API_URL với giá trị mặc định
export const API_URL = getDefaultApiUrl();

// Hàm để cập nhật API URL động
export const updateApiUrl = async (newUrl) => {
  try {
    // Lưu URL mới vào localStorage
    localStorage.setItem('API_URL', newUrl);
    console.log('API URL updated to:', newUrl);
    
    // Reload trang để áp dụng URL mới
    window.location.reload();
    return true;
  } catch (error) {
    console.error('Error updating API URL:', error);
    return false;
  }
};

// Hàm để lấy API URL từ localStorage
export const getApiUrl = async () => {
  try {
    const savedUrl = localStorage.getItem('API_URL');
    return savedUrl || API_URL;
  } catch (error) {
    console.error('Error getting API URL:', error);
    return API_URL;
  }
};

// Other constants
export const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
export const SUPPORTED_IMAGE_FORMATS = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
export const SUPPORTED_VIDEO_FORMATS = ['video/mp4', 'video/webm', 'video/quicktime'];
export const SUPPORTED_DOCUMENT_FORMATS = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

// Socket events
export const SOCKET_EVENTS = {
  NEW_MESSAGE: 'new_message',
  MESSAGE_SEEN: 'message_seen',
  USER_ONLINE: 'user_online',
  USER_OFFLINE: 'user_offline',
  USER_TYPING: 'user_typing',
  USER_STOP_TYPING: 'user_stop_typing'
};

// Local storage keys
export const STORAGE_KEYS = {
  TOKEN: 'token',
  USER: 'user',
  ACTIVE_CONVERSATION: 'activeConversationId'
}; 