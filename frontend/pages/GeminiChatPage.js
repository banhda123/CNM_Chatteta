import React from 'react';
import {
  Box,
  Container,
  Typography,
  Paper
} from '@mui/material';
import GeminiChatBox from '../components/GeminiChatBox';
import { useTheme } from '@mui/material/styles';

const GeminiChatPage = () => {
  const theme = useTheme();
  return (
    <Container maxWidth="md" sx={{ py: 4, bgcolor: theme.palette.background.default, color: theme.palette.text.primary }}>
      <Paper elevation={3} sx={{ p: 3, borderRadius: 2, bgcolor: theme.palette.background.paper, color: theme.palette.text.primary }}>
        <Typography variant="h5" component="h1" gutterBottom sx={{ color: theme.palette.text.primary }}>
          Gemini AI Assistant
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3, color: theme.palette.text.secondary }}>
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
