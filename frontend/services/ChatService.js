// Thêm một lớp ghi log đơn giản vào đầu file
const Logger = {
  // Các cấp độ log
  levels: {
    DEBUG: 0,  // Chi tiết nhất, hữu ích khi phát triển
    INFO: 1,   // Thông tin chung
    WARN: 2,   // Cảnh báo
    ERROR: 3,  // Lỗi
  },
  
  // Cấu hình cấp độ hiện tại
  currentLevel: 1, // Mặc định chỉ hiện INFO trở lên
  
  // Bật/tắt group logs cho dễ đọc
  useGroups: true,
  
  // Thiết lập cấp độ log
  setLevel(level) {
    this.currentLevel = level;
  },
  
  // Các phương thức log theo cấp độ
  debug(message, data) {
    if (this.currentLevel <= this.levels.DEBUG) {
      if (data && this.useGroups) {
        console.groupCollapsed(`🔍 ${message}`);
        console.log(data);
        console.groupEnd();
      } else {
        console.log(`🔍 ${message}`, data || '');
      }
    }
  },
  
  info(message, data) {
    if (this.currentLevel <= this.levels.INFO) {
      if (data && this.useGroups) {
        console.groupCollapsed(`ℹ️ ${message}`);
        console.log(data);
        console.groupEnd();
      } else {
        console.log(`ℹ️ ${message}`, data || '');
      }
    }
  },
  
  warn(message, data) {
    if (this.currentLevel <= this.levels.WARN) {
      if (data && this.useGroups) {
        console.groupCollapsed(`⚠️ ${message}`);
        console.log(data);
        console.groupEnd();
      } else {
        console.warn(`⚠️ ${message}`, data || '');
      }
    }
  },
  
  error(message, error) {
    if (this.currentLevel <= this.levels.ERROR) {
      if (error && this.useGroups) {
        console.groupCollapsed(`❌ ${message}`);
        console.error(error);
        console.groupEnd();
      } else {
        console.error(`❌ ${message}`, error || '');
      }
    }
  }
};

// Trong môi trường production, chỉ hiển thị lỗi
if (process.env.NODE_ENV === 'production') {
  Logger.setLevel(Logger.levels.ERROR);
}

import axios from "axios";
import AuthService from "./AuthService";
import SocketService from "./SocketService";
import GeminiService from "./GeminiService";
import { API_URL as BASE_API_URL, getApiUrl } from "../config/constants";

// Tạo hàm helper để lấy API URL hiện tại
const getBaseUrl = async () => {
  try {
    const baseUrl = await getApiUrl();
    return baseUrl;
  } catch (error) {
    console.error('Error getting API URL, using default', error);
    return BASE_API_URL;
  }
};

// Khởi tạo với giá trị mặc định
let API_URL = `${BASE_API_URL}/chat`;

// Hàm helper để tạo URL API đầy đủ
const getApiEndpoint = async (endpoint) => {
  const baseUrl = await getBaseUrl();
  return `${baseUrl}/chat${endpoint}`;
};

// Cập nhật API URL khi có thay đổi
const updateServiceApiUrl = async () => {
  try {
    const baseUrl = await getBaseUrl();
    API_URL = `${baseUrl}/chat`;
    Logger.info('API URL updated', { API_URL });
  } catch (error) {
    Logger.error('Failed to update API URL', error);
  }
};

// Gọi hàm này khi khởi động ứng dụng
updateServiceApiUrl();

class ChatService {
  // Get conversation by ID
  static async getConversationById(conversationId) {
    try {
      Logger.info('Fetching conversation by ID', { conversationId });
      
      const token = AuthService.getAccessToken();
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      };
      
      const response = await axios.get(`${API_URL}/conversation/${conversationId}`, config);
      return response.data;
    } catch (error) {
      Logger.error("Error fetching conversation by ID", error);
      throw error;
    }
  }

  // Create a new group conversation
  static async createGroupConversation(groupData, token) {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      };
      
      Logger.info('Creating new group conversation', { groupName: groupData.name });
      
      const response = await axios.post(
        `${API_URL}/group`, 
        groupData,
        config
      );
      
      // Ensure the response includes the admin role
      if (response.data && response.data.conversation) {
        const userData = AuthService.getUserData();
        if (userData) {
          response.data.conversation.admin = {
            _id: userData._id,
            name: userData.name,
            avatar: userData.avatar
          };
        }
      }
      
      return response.data;
    } catch (error) {
      Logger.error("Error creating group conversation", error);
      throw error;
    }
  }

  // Add members to a group
  static async addMembersToGroup(conversationId, memberIds, token) {
    try {
      if (!token) {
        throw new Error('No token provided');
      }

      // Remove 'Bearer ' if it's already included in the token
      const cleanToken = token.replace('Bearer ', '');
      
      Logger.debug('Clean token:', cleanToken);
      
      const config = {
        headers: {
          'Authorization': `Bearer ${cleanToken}`,
          'Content-Type': 'application/json'
        }
      };
      
      Logger.info('Adding members to group', { conversationId, memberCount: memberIds.length });
      
      const response = await axios.post(
        `${API_URL}/group/members`, 
        { conversationId, memberIds },
        config
      );
      
      return response.data;
    } catch (error) {
      Logger.error("Error adding members to group", error);
      if (error.response) {
        Logger.error("Response details:", {
          data: error.response.data,
          status: error.response.status,
          headers: error.response.headers
        });
      }
      throw error;
    }
  }

  // Remove a member from a group
  static async removeMemberFromGroup(conversationId, memberId, token) {
    try {
      const cleanToken = token.replace('Bearer ', '');
      console.log('Clean token:', cleanToken); // Debug log
      
      const config = {
        headers: {
          'Authorization': `Bearer ${cleanToken}`,
          'Content-Type': 'application/json'
        }
      };

      console.log('Request config:', config); // Debug log
      console.log('Removing member from conversation:', conversationId); // Debug log
      console.log('Member to remove:', memberId); // Debug log
      
      // Get current user data to determine role
      const userData = AuthService.getUserData();
      
      // Nếu người dùng không có dữ liệu thì không thể xác định vai trò
      if (!userData) {
        throw new Error('User data not available');
      }
      
      // Kiểm tra quyền admin cho cuộc trò chuyện cụ thể
      const adminId = localStorage.getItem(`adminId_${conversationId}`) || localStorage.getItem('adminId');
      const admin2Id = localStorage.getItem(`admin2Id_${conversationId}`) || localStorage.getItem('admin2Id');
      
      // Chuyển đổi ID sang string để so sánh chính xác
      const currentUserId = userData._id.toString();
      const adminIdStr = adminId ? adminId.toString() : null;
      const admin2IdStr = admin2Id ? admin2Id.toString() : null;
      
      const isAdmin = adminIdStr && currentUserId === adminIdStr;
      const isAdmin2 = admin2IdStr && currentUserId === admin2IdStr;
      
      console.log('Current user role check:', { 
        currentUserId, 
        adminId: adminIdStr, 
        admin2Id: admin2IdStr,
        isAdmin, 
        isAdmin2 
      });
      
      // Trước khi xóa, lấy thông tin về thành viên bị xóa để gửi qua socket
      let memberName = '';
      try {
        // Lấy thông tin cuộc trò chuyện để tìm tên thành viên
        const conversationResponse = await axios.get(
          `${API_URL}/conversation/${conversationId}`,
          config
        );
        
        if (conversationResponse.data && conversationResponse.data.members) {
          const memberToRemove = conversationResponse.data.members.find(
            member => member.idUser && (
              (member.idUser._id && member.idUser._id.toString() === memberId.toString()) ||
              (typeof member.idUser === 'string' && member.idUser.toString() === memberId.toString())
            )
          );
          
          if (memberToRemove && memberToRemove.idUser) {
            memberName = typeof memberToRemove.idUser === 'object' 
              ? memberToRemove.idUser.name || 'Thành viên'
              : 'Thành viên';
          }
        }
      } catch (error) {
        console.warn('Could not fetch member name before removal:', error);
      }
      
      let response;
      
      // Use different endpoints based on user role
      if (isAdmin2 && !isAdmin) {
        // For admin2, use a POST request to a different endpoint
        console.log('Using admin2 endpoint for member removal');
        response = await axios.post(
          `${API_URL}/group/${conversationId}/admin2/remove/${memberId}`,
          {},
          config
        );
      } else {
        // For admin, use the standard DELETE endpoint
        console.log('Using standard admin endpoint for member removal');
        response = await axios.delete(
          `${API_URL}/group/${conversationId}/members/${memberId}`,
          config
        );
      }
      
      console.log('Response data:', response.data); // Debug log
      
      // Gửi thông tin chi tiết qua socket để cập nhật real-time
      SocketService.emitMemberRemovedFromGroup({
        conversationId,
        memberId,
        removedBy: userData._id,
        removedByName: userData.name,
        memberName: memberName,
        timestamp: new Date().toISOString()
      });
      
      return response.data;
    } catch (error) {
      console.error('Error removing member from group:', error);
      if (error.response) {
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
        console.error('Response headers:', error.response.headers);
      }
      throw error;
    }
  }

  // Leave a group
  static async leaveGroup(conversationId, token) {
    try {
      if (!token) {
        throw new Error('No token provided');
      }

      // Remove 'Bearer ' if it's already included in the token
      const cleanToken = token.replace('Bearer ', '');
      
      console.log('Clean token for leave group:', cleanToken); // Debug log
      
      const config = {
        headers: {
          'Authorization': `Bearer ${cleanToken}`,
          'Content-Type': 'application/json'
        }
      };
      
      console.log('Leave group request config:', config); // Debug log
      
      // Using POST method to match the backend route
      const response = await axios.post(
        `${API_URL}/group/leave/${conversationId}`,
        {}, // Empty body for POST request
        config
      );
      
      return response.data;
    } catch (error) {
      console.error("Error leaving group:", error);
      if (error.response) {
        console.error("Response data:", error.response.data);
        console.error("Response status:", error.response.status);
        console.error("Response headers:", error.response.headers);
      }
      throw error;
    }
  }

  // Update group information
  static async updateGroupInfo(groupData, token) {
    try {
      if (!token) {
        throw new Error('No token provided');
      }

      // Remove 'Bearer ' if it's already included in the token
      const cleanToken = token.replace('Bearer ', '');
      
      console.log('Clean token:', cleanToken); // Debug log
      
      const config = {
        headers: {
          'Authorization': `Bearer ${cleanToken}`,
          'Content-Type': 'application/json'
        }
      };
      
      console.log('Request config:', config); // Debug log
      console.log('Group data:', groupData); // Debug log
      
      const response = await axios.put(
        `${API_URL}/group`, 
        groupData,
        config
      );
      
      return response.data;
    } catch (error) {
      console.error("Error updating group info:", error);
      if (error.response) {
        console.error("Response data:", error.response.data);
        console.error("Response status:", error.response.status);
        console.error("Response headers:", error.response.headers);
      }
      throw error;
    }
  }

  // Delete a group
  static async deleteGroup(conversationId, token) {
    try {
      if (!token) {
        throw new Error('No token provided');
      }

      // Remove 'Bearer ' if it's already included in the token
      const cleanToken = token.replace('Bearer ', '');
      
      console.log('Clean token:', cleanToken); // Debug log
      
      const config = {
        headers: {
          'Authorization': `Bearer ${cleanToken}`,
          'Content-Type': 'application/json'
        }
      };
      
      console.log('Request config:', config); // Debug log
      
      const response = await axios.delete(
        `${API_URL}/group/${conversationId}`,
        config
      );
      
      return response.data;
    } catch (error) {
      console.error("Error deleting group:", error);
      if (error.response) {
        console.error("Response data:", error.response.data);
        console.error("Response status:", error.response.status);
        console.error("Response headers:", error.response.headers);
      }
      throw error;
    }
  }

  // Lấy danh sách cuộc trò chuyện của người dùng với metadata tối thiểu
  static async getUserConversations(userId) {
    try {
      Logger.info('Fetching conversations for user', { userId });
      
      // Thêm tham số chỉ lấy metadata, không tải lịch sử tin nhắn đầy đủ
      // Explicity request fully populated user data with the 'populate_users=true' parameter
      const response = await axios.get(`${API_URL}/conversations/${userId}?metadata_only=true&populate_users=true`);
      
      // Validate conversation member data
      if (response.data && Array.isArray(response.data)) {
        // Check if any conversations have unpopulated member data
        const hasUnpopulatedMembers = response.data.some(conv => {
          if (!conv.members || !Array.isArray(conv.members)) return false;
          
          return conv.members.some(member => {
            return member.idUser && typeof member.idUser === 'string';
          });
        });
        
        if (hasUnpopulatedMembers) {
          Logger.warn('Some conversations have unpopulated member data', {
            conversationCount: response.data.length
          });
        }
        
        // Xử lý dữ liệu cuộc trò chuyện và lưu thông tin admin vào localStorage
        response.data.forEach(conversation => {
          if (conversation.type === 'group') {
            // Lưu thông tin admin
            if (conversation.admin) {
              const adminId = conversation.admin._id || conversation.admin;
              localStorage.setItem(`adminId_${conversation._id}`, adminId);
            }
            
            // Lưu thông tin admin2
            if (conversation.admin2) {
              const admin2Id = conversation.admin2._id || conversation.admin2;
              localStorage.setItem(`admin2Id_${conversation._id}`, admin2Id);
            }
          }
        });
      }
      
      Logger.info(`Fetched ${response.data.length} conversations`);
      return response.data;
    } catch (error) {
      Logger.error("Error fetching conversations", error);
      throw error;
    }
  }

  // Lấy tin nhắn với lazy loading
  static async getConversationMessages(conversationId, options = {}) {
    try {
      Logger.info('Fetching messages for conversation', { conversationId, options });
      
      // Giảm giới hạn mặc định xuống 15 tin nhắn mỗi lần tải để cải thiện hiệu suất
      const limit = options.limit || 15;
      
      // Xây dựng URL parameters
      let url = `${API_URL}/allmessage/${conversationId}?limit=${limit}`;
      
      // Thêm tham số before nếu có
      if (options.before) {
        url += `&before=${options.before}`;
      }
      
      Logger.debug('Request URL:', url);
      const response = await axios.get(url);
      
      // Chuẩn hóa dữ liệu tin nhắn để đảm bảo tính nhất quán
      const normalizeMessages = (messages) => {
        if (!Array.isArray(messages)) return [];
        
        return messages.map(msg => {
          // Đảm bảo ID người gửi luôn ở dạng chuỗi để so sánh nhất quán
          if (msg.sender && typeof msg.sender === 'object' && msg.sender._id) {
            msg.originalSender = { ...msg.sender }; // Lưu thông tin người gửi gốc
            msg.sender = msg.sender._id; // Chỉ lưu ID
          }
          
          // Đảm bảo ID nhất quán
          if (msg._id) {
            msg.id = msg._id;
          }
          
          return msg;
        });
      };
      
      // Tin nhắn sẽ trả về dạng { messages: [], hasMore: boolean, nextCursor: string }
      const messageCount = response.data.messages?.length || (Array.isArray(response.data) ? response.data.length : 0);
      Logger.info(`Fetched ${messageCount} messages`);
      
      // Nếu API trả về theo định dạng mới, xử lý
      if (response.data && response.data.messages) {
        const result = {
          messages: normalizeMessages(response.data.messages),
          hasMore: response.data.hasMore || false,
          nextCursor: response.data.nextCursor || null
        };
        Logger.debug('Normalized response with pagination', { hasMore: result.hasMore, messageCount: result.messages.length });
        return result;
      } 
      // Nếu API trả về theo định dạng cũ (mảng tin nhắn), chuyển đổi
      else if (Array.isArray(response.data)) {
        const result = {
          messages: normalizeMessages(response.data),
          hasMore: false, // Giả định không có thêm tin nhắn cũ hơn
          nextCursor: null
        };
        Logger.debug('Converted legacy response format', { messageCount: result.messages.length });
        return result;
      } 
      // Nếu không khớp với format nào
      else {
        Logger.warn('Unexpected response format', response.data);
        return { messages: [], hasMore: false, nextCursor: null };
      }
    } catch (error) {
      Logger.error("Error fetching messages", error);
      throw error;
    }
  }

  // Tải thêm tin nhắn cũ hơn (lazy loading)
  static async loadMoreMessages(conversationId, beforeTimestamp, limit = 20) {
    try {
      Logger.info(`Loading more messages`, { conversationId, before: beforeTimestamp, limit });
      return this.getConversationMessages(conversationId, {
        before: beforeTimestamp,
        limit: limit
      });
    } catch (error) {
      Logger.error("Error loading more messages", error);
      throw error;
    }
  }

  // Get friends list (from conversations)
  static async getUserFriends(userId) {
    try {
      const response = await axios.get(`${API_URL}/friend/${userId}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching user friends:", error);
      throw error;
    }
  }

  // Send a new message
  static async sendMessage(messageData, token) {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      };
      
      Logger.info('Sending message', { 
        conversationId: messageData.idConversation, 
        type: messageData.type || 'text'
      });
      
      const response = await axios.post(
        `${API_URL}/message`, 
        messageData,
        config
      );
      
      return response.data;
    } catch (error) {
      Logger.error("Error sending message via HTTP", error);
      throw error;
    }
  }

  // Mark messages as seen
  static async markMessagesAsSeen(conversationId, token) {
    try {
      const config = {
        headers: {
          authorization: `Bearer ${token}`,
        },
      };
      const response = await axios.post(
        `${API_URL}/seen/${conversationId}`,
        {},
        config
      );
      return response.data;
    } catch (error) {
      console.error("Error marking messages as seen:", error);
      throw error;
    }
  }

  // Create a new conversation
  static async createConversation(userFrom, userTo) {
    try {
      const response = await axios.post(`${API_URL}/create`, {
        userFrom,
        userTo,
      });
      return response.data;
    } catch (error) {
      console.error("Error creating conversation:", error);
      throw error;
    }
  }

  // Join an existing conversation
  static async joinConversation(conversationId) {
    try {
      const response = await axios.get(`${API_URL}/join/${conversationId}`);
      return response.data;
    } catch (error) {
      console.error("Error joining conversation:", error);
      throw error;
    }
  }

  // Upload file message
  static async uploadFile(formData, token) {
    try {
      // Chỉ log thông tin cơ bản của file, không log toàn bộ formData
      const fileInfo = {
        fileName: formData.get('file')?.name,
        fileSize: formData.get('file')?.size,
        fileType: formData.get('file')?.type,
        conversationId: formData.get('idConversation'),
        messageType: formData.get('type')
      };
      
      Logger.info("Uploading file", fileInfo);
      
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      };
      
      const response = await axios.post(
        `${API_URL}/upload`, 
        formData,
        config
      );
      
      Logger.info("File upload successful", { fileUrl: response.data.fileUrl });
      return response.data;
    } catch (error) {
      Logger.error("Error uploading file", error);
      // Xem chi tiết lỗi từ response nếu có
      if (error.response && error.response.data) {
        Logger.error("Server error details", error.response.data);
      }
      throw error;
    }
  }
  
  // Kiểm tra xem URL có hoạt động không
  static async checkFileUrl(url) {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      return response.ok;
    } catch (error) {
      console.error("Error checking file URL:", error);
      return false;
    }
  }
  
  // Tải xuống file từ URL
  static async downloadFile(url, fileName) {
    try {
      // Tạo một thẻ a tạm thời để tải xuống
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName || 'download');
      link.setAttribute('target', '_blank');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return true;
    } catch (error) {
      console.error("Error downloading file:", error);
      return false;
    }
  }

  // Thêm cảm xúc vào tin nhắn
  static async addReaction(messageId, userId, emoji, token) {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      };
      
      const response = await axios.post(
        `${API_URL}/message/reaction`, 
        { messageId, userId, emoji },
        config
      );
      
      return response.data;
    } catch (error) {
      console.error("Error adding reaction:", error);
      throw error;
    }
  }
  
  // Xóa cảm xúc khỏi tin nhắn
  static async removeReaction(messageId, userId, emoji, token) {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      };
      
      const response = await axios.post(
        `${API_URL}/message/reaction/remove`, 
        { messageId, userId, emoji },
        config
      );
      
      return response.data;
    } catch (error) {
      console.error("Error removing reaction:", error);
      throw error;
    }
  }
  
  // Chuyển tiếp tin nhắn
  static async forwardMessage(messageId, conversationId, token) {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      };
      
      const response = await axios.post(
        `${API_URL}/message/forward`, 
        { messageId, conversationId },
        config
      );
      
      return response.data;
    } catch (error) {
      console.error('Error forwarding message:', error);
      return { success: false, message: error.response?.data?.message || 'Failed to forward message' };
    }
  }
  
  // Pin a message in a group chat
  static async pinMessage(messageId, token) {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      };
      
      const response = await axios.post(
        `${API_URL}/message/${messageId}/pin`,
        {},
        config
      );
      
      return response.data;
    } catch (error) {
      console.error('Error pinning message:', error);
      return { success: false, message: error.response?.data?.message || 'Failed to pin message' };
    }
  }
  
  // Unpin a message in a group chat
  static async unpinMessage(messageId, token) {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      };
      
      const response = await axios.delete(
        `${API_URL}/message/${messageId}/pin`,
        { headers: config.headers }
      );
      
      return response.data;
    } catch (error) {
      console.error('Error unpinning message:', error);
      return { success: false, message: error.response?.data?.message || 'Failed to unpin message' };
    }
  }
  
  // Get all pinned messages in a conversation
  static async getPinnedMessages(conversationId, token) {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      };
      
      const response = await axios.get(
        `${API_URL}/conversation/${conversationId}/pinned-messages`,
        { headers: config.headers }
      );
      
      return response.data;
    } catch (error) {
      console.error('Error getting pinned messages:', error);
      return { success: false, message: error.response?.data?.message || 'Failed to get pinned messages' };
    }
  }
  
  // Unpin a message in a group chat
  static async unpinMessage(messageId, token) {
    try {
      const response = await axios.delete(
        `${API_URL}/message/${messageId}/pin`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error unpinning message:', error);
      return { success: false, message: error.response?.data?.message || 'Failed to unpin message' };
    }
  }
  
  // Get all pinned messages in a conversation
  static async getPinnedMessages(conversationId, token) {
    try {
      const response = await axios.get(
        `${API_URL}/conversation/${conversationId}/pinned-messages`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error getting pinned messages:', error);
      return { success: false, message: error.response?.data?.message || 'Failed to get pinned messages' };
    }
  }

  // Set admin2
  static async setAdmin2(conversationId, memberId, token) {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      };
      
      const response = await axios.post(
        `${API_URL}/group/admin2`,
        { conversationId, memberId },
        config
      );
      
      // Lưu ID của admin2 mới vào localStorage
      if (response.data && response.data.admin2) {
        const admin2Id = response.data.admin2._id || response.data.admin2;
        localStorage.setItem(`admin2Id_${conversationId}`, admin2Id);
      }
      
      return response.data;
    } catch (error) {
      console.error("Error setting admin2:", error);
      throw error;
    }
  }

  // Remove admin2
  static async removeAdmin2(conversationId, token) {
    try {
      if (!token) {
        throw new Error('No token provided');
      }

      // Remove 'Bearer ' if it's already included in the token
      const cleanToken = token.replace('Bearer ', '');
      
      console.log('Clean token:', cleanToken); // Debug log
      
      const config = {
        headers: {
          'Authorization': `Bearer ${cleanToken}`,
          'Content-Type': 'application/json'
        }
      };
      
      console.log('Request config:', config); // Debug log
      console.log('Removing admin2 from conversation:', conversationId); // Debug log
      
      // Make sure we're using the correct URL format
      const response = await axios({
        method: 'delete',
        url: `${API_URL}/group/admin2/${conversationId}`,
        headers: config.headers
      });
      
      // Xóa ID của admin2 khỏi localStorage khi admin2 bị xóa
      localStorage.removeItem(`admin2Id_${conversationId}`);
      
      return response.data;
    } catch (error) {
      console.error("Error removing admin2:", error);
      if (error.response) {
        console.error("Response data:", error.response.data);
        console.error("Response status:", error.response.status);
        console.error("Response headers:", error.response.headers);
      }
      throw error;
    }
  }

  // Update group permissions
  static async updateGroupPermissions(conversationId, permissions, token) {
    try {
      console.log('Making request with token:', token); // Debug log
      
      const config = {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      };
      
      const response = await axios.put(
        `${API_URL}/group/permissions`,
        { conversationId, permissions },
        config
      );
      
      return response.data;
    } catch (error) {
      console.error("Error updating group permissions:", error);
      throw error;
    }
  }

  // Gửi tin nhắn GIF từ Giphy API
  static async sendGifMessage(conversationId, senderId, gifData, token, caption = '') {
    try {
      if (!conversationId || !senderId || !gifData) {
        throw new Error("Missing required data for sending GIF");
      }
      
      // Lấy URL của GIF từ dữ liệu Giphy
      const gifUrl = gifData.original || gifData.url;
      
      // Create message data for GIF
      const messageData = {
        idConversation: conversationId,
        sender: senderId,
        fileUrl: gifUrl, 
        type: 'gif',
        content: caption
      };
      
      // Lưu tin nhắn vào cơ sở dữ liệu trước
      const config = {
        headers: {
          Authorization: `Bearer ${token || AuthService.getAccessToken()}`,
          'Content-Type': 'application/json'
        }
      };
      
      // Gửi HTTP request để lưu tin nhắn
      const response = await axios.post(
        `${API_URL}/message`, 
        messageData,
        config
      );
      
      // Lấy tin nhắn đã được lưu vào database với ID chính xác
      const savedMessage = response.data;
      
      // Chỉ gửi qua socket nếu lưu vào database thành công
      // Và gửi với ID chính xác từ database để tránh duplicate
      if (savedMessage && savedMessage._id) {
        SocketService.sendMessage({
          ...messageData,
          _id: savedMessage._id,
          id: savedMessage._id
        });
      }
      
      return savedMessage || messageData;
    } catch (error) {
      console.error("Error sending GIF message:", error);
      // Không gửi qua socket nếu HTTP request lỗi để tránh duplicate
      // Nếu cần hiển thị tin nhắn tạm thời, hãy xử lý ở phía UI thay vì gửi qua socket
      throw error;
    }
  }

  // Get images and videos shared in a conversation
  static async getConversationMedia(conversationId) {
    try {
      Logger.info('Fetching media for conversation', { conversationId });
      
      const token = AuthService.getAccessToken();
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      };
      
      const response = await axios.get(`${API_URL}/conversation/${conversationId}/media`, config);
      console.log('Raw media API response:', response.data);
      
      // Handle different possible response formats
      if (response.data && response.data.media) {
        return response.data.media;
      } else if (response.data && response.data.success && response.data.media) {
        return response.data.media;
      } else if (Array.isArray(response.data)) {
        return response.data;
      }
      
      return [];
    } catch (error) {
      Logger.error("Error fetching conversation media", error);
      return [];
    }
  }

  // Get documents/files shared in a conversation
  static async getConversationFiles(conversationId) {
    try {
      Logger.info('Fetching files for conversation', { conversationId });
      
      const token = AuthService.getAccessToken();
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      };
      
      const response = await axios.get(`${API_URL}/conversation/${conversationId}/files`, config);
      console.log('Raw files API response:', response.data);
      
      // Handle different possible response formats
      if (response.data && response.data.files) {
        return response.data.files;
      } else if (response.data && response.data.success && response.data.files) {
        return response.data.files;
      } else if (Array.isArray(response.data)) {
        return response.data;
      }
      
      return [];
    } catch (error) {
      Logger.error("Error fetching conversation files", error);
      return [];
    }
  }

  // Get links shared in a conversation
  static async getConversationLinks(conversationId) {
    try {
      Logger.info('Fetching links for conversation', { conversationId });
      
      const token = AuthService.getAccessToken();
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      };
      
      const response = await axios.get(`${API_URL}/conversation/${conversationId}/links`, config);
      console.log('Raw links API response:', response.data);
      
      // Handle different possible response formats
      if (response.data && response.data.links) {
        return response.data.links;
      } else if (response.data && response.data.success && response.data.links) {
        return response.data.links;
      } else if (Array.isArray(response.data)) {
        return response.data;
      }
      
      return [];
    } catch (error) {
      Logger.error("Error fetching conversation links", error);
      return [];
    }
  }
  
  // Process @AIGemini commands in messages
  static async processAIGeminiMessage(message, conversationId, senderId) {
    try {
      Logger.info('Processing @AIGemini message', { conversationId });
      
      // Extract the query from the message (remove @AIGemini prefix)
      // Hỗ trợ cả hai cách viết @AIGemini và @AiGemini
      const aiPrefixes = ['@AIGemini', '@AiGemini'];
      let matchedPrefix = null;
      
      for (const prefix of aiPrefixes) {
        if (message.trim().startsWith(prefix)) {
          matchedPrefix = prefix;
          break;
        }
      }
      
      if (!matchedPrefix) {
        return null; // Not an AI message
      }
      
      const query = message.substring(matchedPrefix.length).trim();
      if (!query) {
        return {
          error: true,
          message: 'Vui lòng nhập nội dung câu hỏi sau @AIGemini'
        };
      }
      
      // Tạo tin nhắn tạm thời của người dùng để hiển thị ngay lập tức
      const tempUserMessage = {
        id: `temp-user-${Date.now()}`,
        _id: `temp-user-${Date.now()}`,
        idConversation: conversationId,
        sender: senderId,
        content: message,
        type: 'text',
        createdAt: new Date().toISOString(),
        status: 'sending'
      };
      
      // Tạo tin nhắn tạm thời của AI để hiển thị trạng thái đang xử lý
      const tempAIMessage = {
        id: `temp-ai-${Date.now()}`,
        _id: `temp-ai-${Date.now()}`,
        idConversation: conversationId,
        sender: 'ai-gemini', // ID của Gemini AI
        content: 'Đang xử lý yêu cầu của bạn...',
        type: 'text',
        createdAt: new Date().toISOString(),
        status: 'sending',
        isAI: true
      };
      
      // Trả về cả hai tin nhắn tạm thời để hiển thị trước
      const tempMessages = [tempUserMessage, tempAIMessage];
      
      // Gọi API để gửi tin nhắn của người dùng
      const token = AuthService.getAccessToken();
      const userMessageData = {
        idConversation: conversationId,
        sender: senderId,
        content: message,
        type: 'text'
      };
      
      // Gửi tin nhắn của người dùng
      const userMessageResponse = await this.sendMessage(userMessageData, token);
      
      // Gọi API Gemini trực tiếp qua backend
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      };
      
      // Gọi API endpoint /chat/gemini/message
      const geminiResponse = await axios.post(
        `${API_URL.replace('/chat', '')}/chat/gemini/message`,
        {
          content: message, // Gửi tin nhắn gốc bao gồm cả @AIGemini
          conversationId: conversationId,
          sender: senderId // Thêm thông tin người gửi
        },
        config
      );
      
      Logger.info('Gemini response received', geminiResponse.data);
      
      // Cập nhật tin nhắn AI với nội dung thực tế
      const aiMessageContent = geminiResponse.data?.data?.content || 'Không nhận được phản hồi từ Gemini.';
      const aiMessage = {
        id: `ai-${Date.now()}`,
        _id: geminiResponse.data?.data?._id || `ai-${Date.now()}`,
        idConversation: conversationId,
        sender: 'ai-gemini', // ID của Gemini AI
        content: aiMessageContent,
        type: 'text',
        createdAt: new Date().toISOString(),
        status: 'sent',
        isAI: true
      };
      
      return {
        success: true,
        tempMessages: tempMessages,
        userMessage: userMessageResponse,
        aiMessage: aiMessage,
        aiResponse: aiMessageContent
      };
    } catch (error) {
      Logger.error("Error processing @AIGemini message", error);
      console.error("Error details:", error?.response?.data || error);
      return {
        error: true,
        message: 'Không thể xử lý yêu cầu AI. Vui lòng thử lại sau.'
      };
    }
  }
  
  // Generate an image using AI from text prompt
  static async generateImage(data) {
    try {
      Logger.info('Generating AI image from text', { prompt: data.prompt });
      
      const token = AuthService.getAccessToken();
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      };
      
      const baseUrl = await getBaseUrl();
      const response = await axios.post(`${baseUrl}/image-ai/generate`, data, config);
      return response;
    } catch (error) {
      Logger.error("Error generating AI image", error);
      throw error;
    }
  }

  // Transform an existing image using AI
  static async transformImage(data) {
    try {
      Logger.info('Transforming image with AI', { imageUrl: data.imageUrl });
      
      const token = AuthService.getAccessToken();
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      };
      
      const baseUrl = await getBaseUrl();
      const response = await axios.post(`${baseUrl}/image-ai/transform`, data, config);
      return response;
    } catch (error) {
      Logger.error("Error transforming image with AI", error);
      throw error;
    }
  }

  // Process @Image commands in messages
  static async processImageAIMessage(message, conversationId, senderId, socketId) {
    try {
      Logger.info('Processing @Image message', { conversationId });
      
      // Extract the query from the message (remove @Image prefix)
      if (!message.trim().startsWith('@Image')) {
        return null; // Not an AI image message
      }
      
      const prompt = message.substring('@Image'.length).trim();
      if (!prompt) {
        return {
          error: true,
          message: 'Vui lòng nhập mô tả hình ảnh sau @Image'
        };
      }
      
      // Tạo tin nhắn tạm thời của người dùng để hiển thị ngay lập tức
      const tempUserMessage = {
        id: `temp-user-${Date.now()}`,
        _id: `temp-user-${Date.now()}`,
        idConversation: conversationId,
        sender: senderId,
        content: message,
        type: 'text',
        createdAt: new Date().toISOString(),
        status: 'sending'
      };
      
      // Tạo tin nhắn tạm thời để hiển thị trạng thái đang xử lý
      const tempProcessingMessage = {
        id: `temp-ai-image-${Date.now()}`,
        _id: `temp-ai-image-${Date.now()}`,
        idConversation: conversationId,
        sender: senderId,
        content: 'Đang tạo hình ảnh... Quá trình này có thể mất vài giây.',
        type: 'text',
        createdAt: new Date().toISOString(),
        status: 'sending'
      };
      
      // Trả về tin nhắn tạm thời để hiển thị trước
      const tempMessages = [tempUserMessage, tempProcessingMessage];
      
      // Gọi API để gửi tin nhắn của người dùng
      const token = AuthService.getAccessToken();
      const userMessageData = {
        idConversation: conversationId,
        sender: senderId,
        content: message,
        type: 'text'
      };
      
      // Gửi tin nhắn của người dùng
      const userMessageResponse = await this.sendMessage(userMessageData, token);
      
      // Gọi API để tạo hình ảnh
      const imageResponse = await this.generateImage({
        prompt: prompt,
        conversationId: conversationId,
        sender: senderId,
        socketId: socketId
      });
      
      Logger.info('AI image generated', imageResponse.data);
      
      return {
        success: true,
        tempMessages: tempMessages,
        userMessage: userMessageResponse,
        imageMessage: imageResponse.data.data
      };
    } catch (error) {
      Logger.error("Error processing @Image message", error);
      console.error("Error details:", error?.response?.data || error);
      return {
        error: true,
        message: 'Không thể tạo hình ảnh. Vui lòng thử lại sau.'
      };
    }
  }

  // Xóa lịch sử trò chuyện chỉ cho bản thân user
  static async clearChatHistoryForUser(conversationId, token) {
    try {
      if (!token) {
        throw new Error('No token provided');
      }
      const cleanToken = token.replace('Bearer ', '');
      const config = {
        headers: {
          'Authorization': `Bearer ${cleanToken}`,
          'Content-Type': 'application/json'
        }
      };
      const response = await axios.delete(
        `${API_URL}/conversation/${conversationId}/history`,
        config
      );
      return response.data;
    } catch (error) {
      Logger.error('Error clearing chat history for user', error);
      throw error;
    }
  }
}

export default ChatService;
