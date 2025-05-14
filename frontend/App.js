import React, { useState, useEffect } from 'react';
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ThemeProvider as MuiThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Login from "./pages/Login";
import Register from "./pages/Register";
import ChatUI from "./pages/ChatDetailScreen";
import ProfileScreen from "./pages/ProfileScreen";
import GeminiChatPage from "./pages/GeminiChatPage";
import Contacts from "./pages/Contacts";
import Layout from "./components/Layout";
import AuthService from './services/AuthService';
import { Box, CircularProgress } from '@mui/material';
import { ThemeProvider } from './contexts/ThemeContext';
import { useTheme } from './contexts/ThemeContext';
import LoadingAnimation from './components/LoadingAnimation';
import PageTransition from './components/PageTransition';
import SocketService from './services/SocketService';

const Stack = createNativeStackNavigator();

const AppContent = () => {
  const { isDarkMode } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState(null);

  const theme = createTheme({
    palette: {
      mode: isDarkMode ? 'dark' : 'light',
      primary: {
        main: '#1976d2',
      },
      secondary: {
        main: '#dc004e',
      },
      background: {
        default: isDarkMode ? '#121212' : '#fff',
        paper: isDarkMode ? '#1e1e1e' : '#fff',
      },
    },
  });

  useEffect(() => {
    // Không khởi tạo kết nối socket sớm nữa
    // if (!SocketService.socket) {
    //   console.log('Initializing socket connection early');
    //   SocketService.connect();
    // }

    // Kiểm tra xác thực khi tải ứng dụng
    const checkAuthentication = async () => {
      try {
        setIsLoading(true);
        
        // Kiểm tra nếu người dùng vừa đăng xuất
        const isLoggedOut = localStorage.getItem("isLoggedOut");
        if (isLoggedOut === "true") {
          // Xóa cờ
          localStorage.removeItem("isLoggedOut");
          setIsAuthenticated(false);
          setUserId(null);
          setIsLoading(false);
          return;
        }
        
        const isAuth = AuthService.isAuthenticated();
        if (isAuth) {
          const userData = AuthService.getUserData();
          if (userData && userData._id) {
            setUserId(userData._id);
            setIsAuthenticated(true);
            
            // Trì hoãn kết nối socket sau khi UI đã tải xong
            // Socket sẽ được kết nối trong ChatDetailScreen khi cần thiết
            // if (!SocketService.isConnected) {
            //   SocketService.connect();
            // }
            // console.log('Joining user room for:', userData._id);
            // SocketService.joinUserRoom(userData);
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
    
    // Cleanup khi component unmount
    return () => {
      // Disconnect socket khi logout hoặc component unmount
      if (SocketService.isConnected) {
        console.log('Disconnecting socket');
        SocketService.disconnect();
      }
    };
  }, []);

  if (isLoading) {
    return (
      <Box sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        bgcolor: 'background.default'
      }}>
        <LoadingAnimation />
      </Box>
    );
  }

  return (
    <MuiThemeProvider theme={theme}>
      <CssBaseline />
      <NavigationContainer>
        <Stack.Navigator initialRouteName={isAuthenticated ? "Chat" : "Login"}>
          {isAuthenticated ? (
            // Authenticated routes with Layout
            <>
              <Stack.Screen 
                name="Chat" 
                options={{ headerShown: false }}
              >
                {(props) => (
                  <Layout>
                    <ChatUI {...props} initialParams={{ userId: userId }} />
                  </Layout>
                )}
              </Stack.Screen>
              <Stack.Screen 
                name="Profile" 
                options={{ headerShown: false }}
              >
                {(props) => (
                  <Layout>
                    <ProfileScreen {...props} />
                  </Layout>
                )}
              </Stack.Screen>
              <Stack.Screen 
                name="GeminiChat" 
                options={{ headerShown: false }}
              >
                {(props) => (
                  <Layout>
                    <GeminiChatPage {...props} />
                  </Layout>
                )}
              </Stack.Screen>
              <Stack.Screen 
                name="Contacts" 
                options={{ headerShown: false }}
              >
                {(props) => (
                  <Layout>
                    <Contacts {...props} />
                  </Layout>
                )}
              </Stack.Screen>
            </>
          ) : (
            // Unauthenticated routes
            <>
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
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </MuiThemeProvider>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <PageTransition>
        <AppContent />
      </PageTransition>
    </ThemeProvider>
  );
}
