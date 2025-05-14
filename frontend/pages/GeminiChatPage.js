import React from 'react';
import {
  Box,
  Container,
  Typography,
  Paper
} from '@mui/material';
import GeminiChatBox from '../components/GeminiChatBox';

const GeminiChatPage = () => {
  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
        <Typography variant="h5" component="h1" gutterBottom>
          Gemini AI Assistant
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Ask Gemini AI anything or request assistance with various tasks
        </Typography>
        
        <Box sx={{ height: 'calc(100vh - 250px)', minHeight: '500px' }}>
          <GeminiChatBox />
        </Box>
      </Paper>
    </Container>
  );
};

export default GeminiChatPage;
