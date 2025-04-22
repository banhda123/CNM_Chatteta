import React, { useState, useEffect } from 'react';
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Login from "./pages/Login";
import Register from "./pages/Register";
import ChatUI from "./pages/ChatDetailScreen";
import ProfileScreen from "./pages/ProfileScreen";
import GeminiChatPage from "./pages/GeminiChatPage";
import AuthService from './services/AuthService';
import { CircularProgress, Box } from '@mui/material';

const Stack = createNativeStackNavigator();

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    // Kiểm tra xác thực khi tải ứng dụng
    const checkAuthentication = async () => {
      try {
        setIsLoading(true);
        const isAuth = AuthService.isAuthenticated();
        if (isAuth) {
          const userData = AuthService.getUserData();
          if (userData && userData._id) {
            setUserId(userData._id);
            setIsAuthenticated(true);
          } else {
            setIsAuthenticated(false);
          }
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error("Authentication check failed:", error);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthentication();
  }, []);

  if (isLoading) {
    return (
      <Box sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh'
      }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <NavigationContainer>
        <Stack.Navigator initialRouteName={isAuthenticated ? "Chat" : "Login"}>
          <Stack.Screen 
            name="Login" 
            component={Login} 
            options={{ headerShown: false }} 
          />
          <Stack.Screen 
            name="Register" 
            component={Register} 
            options={{ headerShown: false }} 
          />
          <Stack.Screen 
            name="Chat" 
            component={ChatUI} 
            initialParams={{ userId: userId }}
          />
          <Stack.Screen 
            name="Profile" 
            component={ProfileScreen} 
          />
          <Stack.Screen 
            name="GeminiChat" 
            component={GeminiChatPage} 
            options={{ title: 'Gemini AI Assistant' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </ThemeProvider>
  );
}
