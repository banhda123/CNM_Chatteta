import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Avatar,
  CircularProgress,
  IconButton,
  Divider
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import GeminiService from '../services/GeminiService';
import { useTheme } from '@mui/material/styles';
import { STORAGE_KEYS } from '../config/constants';

const GeminiChatBox = () => {
  const theme = useTheme();
  const messagesEndRef = useRef(null);
  const [messages, setMessages] = useState([{
    role: 'assistant',
    content: 'Xin chào! Tôi là Gemini AI, trợ lý AI của bạn. Tôi có thể giúp gì cho bạn?'
  }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Scroll to bottom whenever messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;
    
    // Add user message to chat
    const userMessage = {
      role: 'user',
      content: input
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    
    try {
      // Get response from Gemini API via backend
      const response = await GeminiService.fetchGeminiResponse(input);
      
      // Add Gemini response to chat
      const geminiMessage = {
        role: 'assistant',
        content: response
      };
      
      setMessages(prev => [...prev, geminiMessage]);
    } catch (error) {
      console.error('Error getting Gemini response:', error);
      
      // Add error message
      const errorMessage = {
        role: 'assistant',
        content: 'Xin lỗi, tôi đang gặp sự cố kỹ thuật. Vui lòng thử lại sau.'
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Paper 
      elevation={3} 
      sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        height: '100%', 
        maxHeight: '80vh',
        width: '100%',
        maxWidth: '800px',
        margin: '0 auto',
        overflow: 'hidden',
        bgcolor: theme.palette.background.paper,
        color: theme.palette.text.primary
      }}
    >
      {/* Header */}
      <Box sx={{ 
        p: 2, 
        bgcolor: theme.palette.primary.main, 
        color: theme.palette.primary.contrastText,
        display: 'flex',
        alignItems: 'center'
      }}>
        <Avatar 
          src="https://storage.googleapis.com/gweb-uniblog-publish-prod/images/gemini_1.width-1000.format-webp.webp" 
          sx={{ mr: 2 }}
        />
        <Box>
          <Typography variant="h6" sx={{ color: theme.palette.primary.contrastText }}>Gemini AI</Typography>
          <Typography variant="caption" sx={{ color: theme.palette.primary.contrastText }}>Trợ lý AI thông minh</Typography>
        </Box>
      </Box>
      
      <Divider />
      
      {/* Messages */}
      <Box sx={{ 
        flexGrow: 1, 
        overflowY: 'auto', 
        p: 2,
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        bgcolor: theme.palette.background.default
      }}>
        {messages.map((message, index) => (
          <Box 
            key={index}
            sx={{
              display: 'flex',
              justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
              mb: 2
            }}
          >
            {message.role === 'assistant' && (
              <Avatar 
                src="https://storage.googleapis.com/gweb-uniblog-publish-prod/images/gemini_1.width-1000.format-webp.webp" 
                sx={{ mr: 1, alignSelf: 'flex-start' }}
              />
            )}
            
            <Paper 
              elevation={1}
              sx={{
                p: 2,
                maxWidth: '70%',
                bgcolor: message.role === 'user' 
                  ? theme.palette.primary.main 
                  : theme.palette.background.paper,
                color: message.role === 'user' 
                  ? theme.palette.primary.contrastText 
                  : theme.palette.text.primary,
                borderRadius: 2,
                wordBreak: 'break-word'
              }}
            >
              <Typography sx={{ color: 'inherit' }}>{message.content}</Typography>
            </Paper>
            
            {message.role === 'user' && (
              <Avatar 
                sx={{ ml: 1, bgcolor: theme.palette.primary.main, color: theme.palette.primary.contrastText, alignSelf: 'flex-start' }}
              />
            )}
          </Box>
        ))}
        
        {loading && (
          <Box sx={{ display: 'flex', alignItems: 'center', ml: 2 }}>
            <Avatar 
              src="https://storage.googleapis.com/gweb-uniblog-publish-prod/images/gemini_1.width-1000.format-webp.webp" 
              sx={{ mr: 1 }}
            />
            <CircularProgress size={20} />
          </Box>
        )}
        
        {/* Invisible element to scroll to */}
        <div ref={messagesEndRef} />
      </Box>
      
      <Divider />
      
      {/* Input */}
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', bgcolor: theme.palette.background.paper }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Nhập tin nhắn cho Gemini..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          multiline
          maxRows={4}
          sx={{ mr: 1,
            '& .MuiInputBase-root': {
              bgcolor: theme.palette.background.default,
              color: theme.palette.text.primary
            },
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: theme.palette.divider
            }
          }}
        />
        <IconButton 
          color="primary" 
          onClick={handleSendMessage}
          disabled={!input.trim() || loading}
          sx={{ bgcolor: theme.palette.primary.main, color: theme.palette.primary.contrastText, '&:hover': { bgcolor: theme.palette.primary.dark } }}
        >
          <SendIcon />
        </IconButton>
      </Box>
    </Paper>
  );
};

export default GeminiChatBox;
