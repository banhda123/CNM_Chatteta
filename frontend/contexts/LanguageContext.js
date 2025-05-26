import React, { createContext, useState, useContext, useEffect } from 'react';

// Tạo context cho ngôn ngữ
const LanguageContext = createContext();

// Các chuỗi văn bản được dịch
const translations = {
  vi: {
    // Chung
    appName: 'Chattera',
    search: 'Tìm kiếm',
    send: 'Gửi',
    cancel: 'Hủy',
    save: 'Lưu',
    delete: 'Xóa',
    edit: 'Chỉnh sửa',
    close: 'Đóng',
    confirm: 'Xác nhận',
    loading: 'Đang tải...',
    error: 'Lỗi',
    success: 'Thành công',
    saving: 'Đang lưu...',
    logout: 'Đăng xuất',
    
    // Menu chính
    chat: 'Trò chuyện',
    profile: 'Hồ sơ',
    contacts: 'Danh bạ',
    geminiChat: 'Trò chuyện Gemini',
    
    // Đăng nhập/Đăng ký
    login: 'Đăng nhập',
    register: 'Đăng ký',
    email: 'Email',
    password: 'Mật khẩu',
    forgotPassword: 'Quên mật khẩu?',
    
    // Chat
    newMessage: 'Tin nhắn mới',
    typeMessage: 'Nhập tin nhắn...',
    sendMessage: 'Gửi tin nhắn',
    newChat: 'Cuộc trò chuyện mới',
    welcome: 'Chào mừng đến với Chattera',
    welcomeMessage: 'Chọn một cuộc trò chuyện từ danh sách bên trái để bắt đầu nhắn tin, hoặc tạo cuộc trò chuyện mới với bạn bè.',
    findFriends: 'Tìm bạn bè',
    createGroup: 'Tạo nhóm chat',
    
    // Cài đặt
    settings: 'Cài đặt',
    language: 'Ngôn ngữ',
    languageChangeInfo: 'Thay đổi ngôn ngữ sẽ được áp dụng ngay lập tức.',
    languageChanged: 'Đã thay đổi ngôn ngữ thành công!',
    vietnamese: 'Tiếng Việt',
    english: 'Tiếng Anh',
    serverConfig: 'Cấu hình máy chủ',
    serverUrl: 'Địa chỉ máy chủ',
    serverUrlHelp: 'Nhập địa chỉ IP của máy chạy backend, bao gồm cả port.',
    yourIpAddress: 'Địa chỉ IP của bạn',
    example: 'Ví dụ',
    testConnection: 'Kiểm tra kết nối',
    connectionSuccess: 'Kết nối thành công!',
    connectionFailed: 'Kết nối thất bại!',
    connectionFailedConfirm: 'Không thể kết nối đến server. Bạn vẫn muốn lưu URL này?',
    serverUrlFormatError: 'URL phải bắt đầu bằng http:// hoặc https://',
    serverConfigSaved: 'Đã lưu cấu hình server. Vui lòng khởi động lại ứng dụng để áp dụng thay đổi.',
    serverConfigError: 'Không thể lưu cấu hình server',
    
    // Nhóm
    groupMembers: 'Thành viên nhóm',
    addMember: 'Thêm thành viên',
    removeMember: 'Xóa thành viên',
    leaveGroup: 'Rời nhóm',
    deleteGroup: 'Xóa nhóm',
    
    // Tin nhắn
    forward: 'Chuyển tiếp',
    reply: 'Trả lời',
    revoke: 'Thu hồi',
    pin: 'Ghim',
    unpin: 'Bỏ ghim',
    
    // GIF
    gifGallery: 'Thư viện GIF',
    recentGifs: 'Gần đây',
    trendingGifs: 'Xu hướng',
    searchGifs: 'Tìm kiếm GIF',
    gifCaption: 'Nhập văn bản để thêm chú thích cho GIF',
    
    // Lỗi
    errorSendingGif: 'Không thể gửi GIF. Vui lòng thử lại.',
    errorSendingMessage: 'Không thể gửi tin nhắn. Vui lòng thử lại.',
    errorLoadingMessages: 'Không thể tải tin nhắn. Vui lòng thử lại.',
  },
  en: {
    // Common
    appName: 'Chattera',
    search: 'Search',
    send: 'Send',
    cancel: 'Cancel',
    save: 'Save',
    delete: 'Delete',
    edit: 'Edit',
    close: 'Close',
    confirm: 'Confirm',
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    saving: 'Saving...',
    logout: 'Logout',
    
    // Main Menu
    chat: 'Chat',
    profile: 'Profile',
    contacts: 'Contacts',
    geminiChat: 'Gemini Chat',
    
    // Login/Register
    login: 'Login',
    register: 'Register',
    email: 'Email',
    password: 'Password',
    forgotPassword: 'Forgot password?',
    
    // Chat
    newMessage: 'New message',
    typeMessage: 'Type a message...',
    sendMessage: 'Send message',
    newChat: 'New conversation',
    welcome: 'Welcome to Chattera',
    welcomeMessage: 'Select a conversation from the list on the left to start messaging, or create a new conversation with friends.',
    findFriends: 'Find friends',
    createGroup: 'Create group chat',
    
    // Settings
    settings: 'Settings',
    language: 'Language',
    languageChangeInfo: 'Language changes will be applied immediately.',
    languageChanged: 'Language changed successfully!',
    vietnamese: 'Vietnamese',
    english: 'English',
    serverConfig: 'Server configuration',
    serverUrl: 'Server URL',
    serverUrlHelp: 'Enter the IP address of the backend server, including the port.',
    yourIpAddress: 'Your IP address',
    example: 'Example',
    testConnection: 'Test connection',
    connectionSuccess: 'Connection successful!',
    connectionFailed: 'Connection failed!',
    connectionFailedConfirm: 'Cannot connect to the server. Do you still want to save this URL?',
    serverUrlFormatError: 'URL must start with http:// or https://',
    serverConfigSaved: 'Server configuration saved. Please restart the application to apply changes.',
    serverConfigError: 'Could not save server configuration',
    
    // Group
    groupMembers: 'Group members',
    addMember: 'Add member',
    removeMember: 'Remove member',
    leaveGroup: 'Leave group',
    deleteGroup: 'Delete group',
    
    // Messages
    forward: 'Forward',
    reply: 'Reply',
    revoke: 'Revoke',
    pin: 'Pin',
    unpin: 'Unpin',
    
    // GIF
    gifGallery: 'GIF Gallery',
    recentGifs: 'Recent',
    trendingGifs: 'Trending',
    searchGifs: 'Search GIFs',
    gifCaption: 'Enter text to add a caption to the GIF',
    
    // Errors
    errorSendingGif: 'Could not send GIF. Please try again.',
    errorSendingMessage: 'Could not send message. Please try again.',
    errorLoadingMessages: 'Could not load messages. Please try again.',
  }
};

export const LanguageProvider = ({ children }) => {
  // Lấy ngôn ngữ từ localStorage hoặc sử dụng tiếng Việt làm mặc định
  const [language, setLanguage] = useState(() => {
    const savedLanguage = localStorage.getItem('language');
    return savedLanguage || 'vi';
  });

  // Cập nhật ngôn ngữ trong localStorage khi thay đổi
  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  // Hàm thay đổi ngôn ngữ
  const changeLanguage = (lang) => {
    if (translations[lang]) {
      setLanguage(lang);
    }
  };

  // Hàm lấy chuỗi văn bản theo khóa
  const t = (key) => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

// Hook tùy chỉnh để sử dụng context
export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
