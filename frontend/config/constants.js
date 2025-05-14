// API URLs
export const API_URL = "http://localhost:4000";

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