import axios from "axios";
import AuthService from "./AuthService";
import SocketService from "./SocketService";

const API_URL = "http://localhost:4000/chat"; // Update with your backend URL

class ChatService {
  // Create a new group conversation
  static async createGroupConversation(groupData, token) {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      };
      
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
      console.error("Error creating group conversation:", error);
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
      
      console.log('Clean token:', cleanToken); // Debug log
      
      const config = {
        headers: {
          'Authorization': `Bearer ${cleanToken}`,
          'Content-Type': 'application/json'
        }
      };
      
      console.log('Request config:', config); // Debug log
      console.log('Request payload:', { conversationId, memberIds }); // Debug log
      
      const response = await axios.post(
        `${API_URL}/group/members`, 
        { conversationId, memberIds },
        config
      );
      
      return response.data;
    } catch (error) {
      console.error("Error adding members to group:", error);
      if (error.response) {
        console.error("Response data:", error.response.data);
        console.error("Response status:", error.response.status);
        console.error("Response headers:", error.response.headers);
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
      const isAdmin = userData && userData._id === localStorage.getItem('adminId');
      const isAdmin2 = userData && userData._id === localStorage.getItem('admin2Id');
      
      console.log('Current user role:', isAdmin ? 'admin' : isAdmin2 ? 'admin2' : 'member');
      
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
      console.log('Response status:', response.status); // Debug log
      console.log('Response headers:', response.headers); // Debug log
      
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

  // Get all conversations
  static async getAllConversations() {
    try {
      const response = await axios.get(`${API_URL}/`);
      return response.data;
    } catch (error) {
      console.error("Error fetching all conversations:", error);
      throw error;
    }
  }

  // Get all conversations for a specific user
  static async getUserConversations(userId) {
    try {
      const response = await axios.get(`${API_URL}/${userId}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching user conversations:", error);
      throw error;
    }
  }

  // Get all messages in a conversation
  static async getConversationMessages(conversationId) {
    try {
      const response = await axios.get(
        `${API_URL}/allmessage/${conversationId}`
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching conversation messages:", error);
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
      
      const response = await axios.post(
        `${API_URL}/message`, 
        messageData,
        config
      );
      
      return response.data;
    } catch (error) {
      console.error("Error sending message via HTTP:", error);
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
      console.log("Uploading file with formData:", Object.fromEntries(formData.entries()));
      
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
      
      return response.data;
    } catch (error) {
      console.error("Error uploading file:", error);
      // Xem chi tiết lỗi từ response nếu có
      if (error.response && error.response.data) {
        console.error("Server error details:", error.response.data);
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
      console.error("Error forwarding message:", error);
      throw error;
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

  // Send GIF message using Cloudinary URL
  static async sendGifMessage(conversationId, senderId, gifUrl, token, caption = '') {
    try {
      if (!conversationId || !senderId || !gifUrl) {
        throw new Error("Missing required data for sending GIF");
      }
      
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
      
      // Gửi qua socket để tất cả người dùng nhận được ngay lập tức
      SocketService.sendMessage(messageData);
      
      return response.data || messageData;
    } catch (error) {
      console.error("Error sending GIF message:", error);
      // Vẫn gửi qua socket ngay cả khi HTTP request lỗi
      try {
        SocketService.sendMessage({
          idConversation: conversationId,
          sender: senderId,
          fileUrl: gifUrl,
          type: 'gif',
          content: caption
        });
      } catch (socketError) {
        console.error("Failed to send GIF via socket after HTTP error:", socketError);
      }
      throw error;
    }
  }
}

export default ChatService;
