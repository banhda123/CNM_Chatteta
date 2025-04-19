import axios from "axios";
import { getToken } from "./AuthService";

const API_URL = "http://localhost:4000/chat"; // Update with your backend URL

class ChatService {
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
      throw error;
    }
  }
}

export default ChatService;
