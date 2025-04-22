import React from 'react';
import {
  Box,
  Container,
  AppBar,
  Toolbar,
  IconButton,
  Typography
} from '@mui/material';
import { ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { useNavigation } from '@react-navigation/native';
import GeminiChatBox from '../components/GeminiChatBox';

const GeminiChatPage = () => {
  const navigation = useNavigation();

  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header with Back Button */}
      <AppBar position="static" color="primary">
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={handleBack}
            aria-label="quay lại"
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Trò chuyện với Gemini AI
          </Typography>
        </Toolbar>
      </AppBar>
      
      {/* Main Content */}
      <Box sx={{ flexGrow: 1, overflow: 'hidden', p: 2, bgcolor: '#f5f5f5' }}>
        <Container maxWidth="md" sx={{ height: '100%' }}>
          <GeminiChatBox />
        </Container>
      </Box>
    </Box>
  );
};

export default GeminiChatPage;
