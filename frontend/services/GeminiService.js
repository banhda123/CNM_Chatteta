import axios from "axios";

const GEMINI_API_KEY = "AIzaSyB1e4shZBBLtUxvFi-V5h9Y4OPt_WWlVyU";
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`;

const buildRequestBody = (message) => ({
  contents: [
    {
      parts: [
        {
          text: message,
        },
      ],
    },
  ],
});

const extractResponseContent = (data) => {
  const candidates = data?.candidates || [];
  if (candidates.length > 0) {
    const content = candidates[0]?.content;
    if (content?.parts?.length > 0) {
      return content.parts[0].text.trim();
    }
  }
  return "Không tìm thấy phản hồi.";
};

const handleError = (error) => {
  console.error("Error fetching Gemini response:", error?.response?.data || error);
  return "Có lỗi xảy ra, vui lòng thử lại.";
};

class GeminiService {
  /**
   * Fetches a response from Gemini AI based on the provided message
   * @param {string} message - The message to send to Gemini AI
   * @returns {Promise<string>} - The response from Gemini AI
   */
  static async fetchGeminiResponse(message) {
    try {
      const response = await axios.post(GEMINI_ENDPOINT, buildRequestBody(message), {
        headers: { "Content-Type": "application/json" },
      });

      return extractResponseContent(response.data);
    } catch (error) {
      return handleError(error);
    }
  }
}

export default GeminiService;
