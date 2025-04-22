import React from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Divider,
  IconButton
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigation } from '@react-navigation/native';
import GeminiChatBox from '../components/GeminiChatBox';

const GeminiChatPage = () => {
  const navigation = useNavigation();

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Paper 
        elevation={2} 
        sx={{ 
          p: 2, 
          display: 'flex', 
          alignItems: 'center',
          borderRadius: 0
        }}
      >
        <IconButton onClick={() => navigation.navigate('Chat')} sx={{ mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h6">Gemini AI Assistant</Typography>
      </Paper>
      
      <Divider />
      
      {/* Main Content */}
      <Box sx={{ flexGrow: 1, overflow: 'hidden', p: 2, bgcolor: '#f5f5f5' }}>
        <Container maxWidth="md" sx={{ height: '100%' }}>
          <GeminiChatBox />
        </Container>
      </Box>
      
      {/* Footer */}
      <Paper 
        elevation={2} 
        sx={{ 
          p: 1, 
          textAlign: 'center',
          borderRadius: 0
        }}
      >
        <Typography variant="caption" color="text.secondary">
          Gemini AI được cung cấp bởi Google. Sử dụng Gemini AI tuân theo các điều khoản dịch vụ của Google.
        </Typography>
      </Paper>
    </Box>
  );
};

export default GeminiChatPage;
