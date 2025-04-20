import axios from "axios";
import { getToken } from "./AuthService";

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
      
      return response.data;
    } catch (error) {
      console.error("Error creating group conversation:", error);
      throw error;
    }
  }

  // Add members to a group
  static async addMembersToGroup(conversationId, memberIds, token) {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      };
      
      const response = await axios.post(
        `${API_URL}/group/members/add`, 
        { conversationId, memberIds },
        config
      );
      
      return response.data;
    } catch (error) {
      console.error("Error adding members to group:", error);
      throw error;
    }
  }

  // Remove a member from a group
  static async removeMemberFromGroup(conversationId, memberId, token) {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      };
      
      const response = await axios.post(
        `${API_URL}/group/members/remove`, 
        { conversationId, memberId },
        config
      );
      
      return response.data;
    } catch (error) {
      console.error("Error removing member from group:", error);
      throw error;
    }
  }

  // Leave a group
  static async leaveGroup(conversationId, token) {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${token}`
        }
      };
      
      const response = await axios.delete(
        `${API_URL}/group/leave/${conversationId}`,
        config
      );
      
      return response.data;
    } catch (error) {
      console.error("Error leaving group:", error);
      throw error;
    }
  }

  // Update group information
  static async updateGroupInfo(groupData, token) {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      };
      
      const response = await axios.put(
        `${API_URL}/group`, 
        groupData,
        config
      );
      
      return response.data;
    } catch (error) {
      console.error("Error updating group info:", error);
      throw error;
    }
  }

  // Delete a group
  static async deleteGroup(conversationId, token) {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${token}`
        }
      };
      
      const response = await axios.delete(
        `${API_URL}/group/${conversationId}`,
        config
      );
      
      return response.data;
    } catch (error) {
      console.error("Error deleting group:", error);
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
}

export default ChatService;
