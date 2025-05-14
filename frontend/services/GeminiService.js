import axios from "axios";
import { API_URL } from "../config/constants";

class GeminiService {
  /**
   * Fetches a response from Gemini AI through the backend API
   * @param {string} message - The message to send to Gemini AI
   * @param {boolean} requireAuth - Whether authentication is required (default: false)
   * @returns {Promise<string>} - The response from Gemini AI
   */
  static async fetchGeminiResponse(message, requireAuth = false) {
    try {
      // Prepare request configuration
      const config = {
        headers: { "Content-Type": "application/json" }
      };
      
      // Get the active conversation ID (this might need to be passed as a parameter)
      // For now, we'll use a temporary conversation ID if needed
      const conversationId = localStorage.getItem('activeConversationId') || 'temp-conversation';
      
      // Add authentication if required
      if (requireAuth) {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Authentication required');
        }
        config.headers["Authorization"] = `Bearer ${token}`;
      }
      
      // Send the message to the backend API
      const response = await axios.post(
        `${API_URL}/chat/gemini/message`, 
        {
          content: message,
          conversationId
        },
        config
      );
      
      if (response.data && response.data.data && response.data.data.content) {
        return response.data.data.content;
      }
      
      return "Không tìm thấy phản hồi từ Gemini.";
    } catch (error) {
      console.error("Error fetching Gemini response:", error?.response?.data || error);
      return "Có lỗi xảy ra, vui lòng thử lại.";
    }
  }
}

export default GeminiService;
