import React, { useState, useEffect } from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Avatar,
  Typography,
  Divider,
  IconButton,
  Badge,
  useTheme as useMuiTheme,
  Tooltip,
  Menu,
  MenuItem,
  CircularProgress,
  Button
} from '@mui/material';
import {
  Chat as ChatIcon,
  Person as PersonIcon,
  Contacts as ContactsIcon,
  SmartToy as SmartToyIcon,
  Logout as LogoutIcon,
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
  Menu as MenuIcon,
  Notifications as NotificationsIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Schedule as ScheduleIcon,
  Settings as SettingsIcon,
  Language as LanguageIcon
} from '@mui/icons-material';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import AuthService from '../services/AuthService';
import UserService from '../services/UserService';
import SocketService from '../services/SocketService';
import FriendRequestNotification from './FriendRequestNotification';
import SettingsDialog from './SettingsDialog';
import defaultAvatar from '../assets/default-avatar.png';

const Layout = ({ children }) => {
  const navigation = useNavigation();
  const route = useRoute();
  const muiTheme = useMuiTheme();
  const { isDarkMode, toggleTheme } = useTheme();
  const { t } = useLanguage();
  const [user, setUser] = useState({});
  const [mobileOpen, setMobileOpen] = useState(false);
  const [currentRoute, setCurrentRoute] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    const userData = AuthService.getUserData();
    if (userData) {
      setUser(userData);
    }
    
    setCurrentRoute(route.name);
  }, [route]);
  
  // Always refresh user data when component renders
  useEffect(() => {
    const userData = AuthService.getUserData();
    if (userData) {
      setUser(userData);
    }

    // Khi có sự kiện avatar update, luôn lấy lại user mới nhất từ AuthService
    const handleAvatarUpdated = () => {
      const updatedUser = AuthService.getUserData();
      setUser(updatedUser);
    };

    window.addEventListener('user-avatar-updated', handleAvatarUpdated);

    // Không cần lắng nghe socket avatar_updated ở đây cho user hiện tại
    return () => {
      window.removeEventListener('user-avatar-updated', handleAvatarUpdated);
    };
  }, []);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLogout = async () => {
    try {
      await AuthService.logout();
      localStorage.setItem("isLoggedOut", "true");
      window.location.reload();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleNavigate = (routeName) => {
    if (routeName === currentRoute) return;
    navigation.navigate(routeName);
    setMobileOpen(false);
  };

  const menuItems = [
    { 
      name: t('chat'), 
      icon: <ChatIcon color={currentRoute === 'Chat' ? 'primary' : 'inherit'} />, 
      route: 'Chat' 
    },
    { 
      name: t('profile'), 
      icon: <PersonIcon color={currentRoute === 'Profile' ? 'primary' : 'inherit'} />, 
      route: 'Profile' 
    },
    { 
      name: t('contacts'), 
      icon: <ContactsIcon color={currentRoute === 'Contacts' ? 'primary' : 'inherit'} />, 
      route: 'Contacts' 
    },
    { 
      name: t('geminiChat'), 
      icon: <SmartToyIcon color={currentRoute === 'GeminiChat' ? 'primary' : 'inherit'} />, 
      route: 'GeminiChat' 
    },
  ];

  const drawerWidth = 80;

  const drawer = (
    <Box sx={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center', // Center items horizontally
      overflow: 'hidden' // Prevent horizontal scrolling
    }}>
      {/* User Profile Section */}
      <Box sx={{ 
        p: 2, 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        bgcolor: 'background.paper',
        width: '100%' // Ensure full width
      }}>
        <Avatar 
          src={user?.avatar && typeof user.avatar === 'string' && user.avatar.trim() !== '' ? user.avatar : defaultAvatar}
          alt={user?.name || 'User'}
          sx={{ width: 50, height: 50, mb: 1, cursor: 'pointer' }}
          onClick={() => handleNavigate('Profile')}
        />
        <Typography 
          variant="caption" 
          sx={{ 
            textAlign: 'center', 
            maxWidth: '100%', 
            overflow: 'hidden', 
            textOverflow: 'ellipsis', 
            whiteSpace: 'nowrap',
            cursor: 'pointer'
          }}
          onClick={() => handleNavigate('Profile')}
        >
          {user?.name || 'User'}
        </Typography>
      </Box>
      
      <Divider sx={{ width: '100%' }} />
      
      {/* Navigation Menu */}
      <List sx={{ 
        flexGrow: 1, 
        width: '100%', 
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center', // Center items horizontally
        justifyContent: 'center', // Center items vertically
        padding: 0 // Remove default padding
      }}>
        {menuItems.map((item) => (
          <Tooltip title={item.name} placement="right" key={item.name}>
            <ListItem 
              button 
              onClick={() => handleNavigate(item.route)}
              selected={currentRoute === item.route}
              sx={{
                borderRadius: 1,
                mx: 'auto', // Center horizontally
                my: 0.5, // Consistent vertical spacing
                p: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '64px',
                width: '80%', // Consistent width
                '&.Mui-selected': {
                  bgcolor: 'action.selected',
                  '&:hover': {
                    bgcolor: 'action.hover',
                  },
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 'auto', justifyContent: 'center' }}>{item.icon}</ListItemIcon>
            </ListItem>
          </Tooltip>
        ))}
      </List>
      
      <Divider sx={{ width: '100%' }} />
      
      {/* Settings Section */}
      <List sx={{ 
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center', // Center items horizontally
        padding: 0 // Remove default padding
      }}>
        {/* Notification Bell */}
        <ListItem 
          sx={{
            p: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            mx: 'auto', // Center horizontally
            my: 0.5, // Consistent vertical spacing
            width: '80%', // Consistent width
          }}
        >
          <FriendRequestNotification />
        </ListItem>
        
        <Tooltip title={isDarkMode ? "Chế độ sáng" : "Chế độ tối"} placement="right">
          <ListItem 
            button 
            onClick={toggleTheme}
            sx={{
              p: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto', // Center horizontally
              my: 0.5, // Consistent vertical spacing
              width: '80%', // Consistent width
            }}
          >
            <ListItemIcon sx={{ minWidth: 'auto', justifyContent: 'center' }}>
              {isDarkMode ? <LightModeIcon /> : <DarkModeIcon />}
            </ListItemIcon>
          </ListItem>
        </Tooltip>
        <Tooltip title={t('settings')} placement="right">
          <ListItem 
            button 
            onClick={() => setSettingsOpen(true)}
            sx={{
              p: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto', // Center horizontally
              my: 0.5, // Consistent vertical spacing
              width: '80%', // Consistent width
            }}
          >
            <ListItemIcon sx={{ minWidth: 'auto', justifyContent: 'center' }}>
              <SettingsIcon />
            </ListItemIcon>
          </ListItem>
        </Tooltip>
        
        <Tooltip title={t('logout')} placement="right">
          <ListItem 
            button 
            onClick={handleLogout}
            sx={{
              p: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto', // Center horizontally
              my: 0.5, // Consistent vertical spacing
              width: '80%', // Consistent width
            }}
          >
            <ListItemIcon sx={{ minWidth: 'auto', justifyContent: 'center' }}>
              <LogoutIcon />
            </ListItemIcon>
          </ListItem>
        </Tooltip>
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      {/* Mobile menu toggle */}
      <IconButton
        color="inherit"
        aria-label="open drawer"
        edge="start"
        onClick={handleDrawerToggle}
        sx={{ 
          position: 'fixed', 
          top: 14, 
          left: 10, 
          zIndex: 1200, 
          display: { sm: 'none' },
          bgcolor: 'background.paper',
          boxShadow: 2,
          '&:hover': {
            bgcolor: 'action.hover',
          },
        }}
      >
        <MenuIcon />
      </IconButton>
      
      {/* Mobile drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile.
        }}
        sx={{
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': { 
            boxSizing: 'border-box', 
            width: drawerWidth,
            bgcolor: 'background.paper',
            overflow: 'hidden', // Prevent horizontal scrolling
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center', // Center content horizontally
          },
        }}
      >
        {drawer}
      </Drawer>
      
      {/* Permanent drawer for larger screens */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', sm: 'block' },
          '& .MuiDrawer-paper': { 
            boxSizing: 'border-box', 
            width: drawerWidth,
            bgcolor: 'background.paper',
            borderRight: '1px solid',
            borderColor: 'divider',
            overflow: 'hidden', // Prevent horizontal scrolling
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center', // Center content horizontally
          },
        }}
        open
      >
        {drawer}
      </Drawer>
      
      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          height: '100vh',
          overflow: 'auto',
          bgcolor: 'background.default',
        }}
      >
        {children}
      </Box>
      
      {/* Settings Dialog */}
      <SettingsDialog 
        visible={settingsOpen} 
        onClose={() => setSettingsOpen(false)} 
      />
    </Box>
  );
};

export default Layout; 