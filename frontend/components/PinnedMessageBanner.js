import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Avatar,
  Tooltip,
  Collapse,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  PushPin as PushPinIcon,
  Close as CloseIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
  KeyboardArrowUp as KeyboardArrowUpIcon,
  MoreVert as MoreVertIcon,
  List as ListIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import ChatService from '../services/ChatService';
import AuthService from '../services/AuthService';
import SocketService from '../services/SocketService';

const PinnedMessageBanner = ({ conversation, onViewAllPinned, onUnpinMessage }) => {
  const [pinnedMessages, setPinnedMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  
  const currentUser = AuthService.getUserData();
  const isAdmin = conversation?.admin && 
    (conversation.admin._id === currentUser?._id || conversation.admin === currentUser?._id);
  const isAdmin2 = conversation?.admin2 && 
    (conversation.admin2._id === currentUser?._id || conversation.admin2 === currentUser?._id);
  
  useEffect(() => {
    console.log('PinnedMessageBanner - conversation:', conversation?._id);
    console.log('PinnedMessageBanner - pinnedMessages from props:', conversation?.pinnedMessages?.length);
    
    if (conversation?._id) {
      if (conversation.pinnedMessages && conversation.pinnedMessages.length > 0) {
        console.log('Using pinnedMessages from conversation prop');
        setPinnedMessages(conversation.pinnedMessages);
      } else {
        console.log('Loading pinnedMessages from API');
        loadPinnedMessages();
      }
      setupSocketListeners();
    }
    
    return () => {
      SocketService.removeListener('message_pinned');
      SocketService.removeListener('message_unpinned');
    };
  }, [conversation]);
  
  const setupSocketListeners = () => {
    // Ensure socket is connected
    SocketService.connect();
    
    // Join the conversation room to receive updates
    if (conversation && conversation._id) {
      SocketService.joinConversation(conversation._id);
    }
    
    // Listen for message pinned event
    SocketService.onMessagePinned((data) => {
      if (data.conversation && data.conversation.toString() === conversation._id.toString()) {
        // Add the newly pinned message to the list
        setPinnedMessages(prevMessages => [data.message, ...prevMessages]);
        setCurrentIndex(0); // Reset to show the newest pinned message
      }
    });
    
    // Listen for message unpinned event
    SocketService.onMessageUnpinned((data) => {
      console.log('🔔 PinnedMessageBanner received message_unpinned event:', data);
      if (data.conversation && data.conversation.toString() === conversation._id.toString()) {
        // Remove the unpinned message from the list
        setPinnedMessages(prevMessages => {
          console.log('Filtering out unpinned message:', data.messageId);
          console.log('Current pinned messages:', prevMessages.map(m => m._id));
          
          const filtered = prevMessages.filter(msg => 
            msg._id.toString() !== data.messageId.toString()
          );
          
          console.log('Filtered pinned messages:', filtered.map(m => m._id));
          
          // Adjust current index if needed
          if (currentIndex >= filtered.length && filtered.length > 0) {
            setCurrentIndex(filtered.length - 1);
          }
          
          // If no more pinned messages, return empty array
          return filtered;
        });
      }
    });
  };
  
  const loadPinnedMessages = async () => {
    if (!conversation || !conversation._id) return;
    
    setLoading(true);
    try {
      const token = AuthService.getAccessToken();
      const response = await ChatService.getPinnedMessages(conversation._id, token);
      
      if (response.success) {
        console.log(`Loaded ${response.pinnedMessages?.length || 0} pinned messages from API`);
        setPinnedMessages(response.pinnedMessages || []);
      } else {
        console.error('Failed to load pinned messages:', response.message);
      }
    } catch (error) {
      console.error('Error loading pinned messages:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleNext = () => {
    setCurrentIndex(prevIndex => 
      prevIndex < pinnedMessages.length - 1 ? prevIndex + 1 : 0
    );
  };
  
  const handlePrevious = () => {
    setCurrentIndex(prevIndex => 
      prevIndex > 0 ? prevIndex - 1 : pinnedMessages.length - 1
    );
  };
  
  const handleUnpin = async (messageId) => {
    if (!messageId || !isAdmin && !isAdmin2) return;
    
    try {
      const token = AuthService.getAccessToken();
      const response = await ChatService.unpinMessage(messageId, token);
      
      if (response.success) {
        // The socket event will handle removing from the UI
        if (onUnpinMessage) {
          onUnpinMessage(messageId);
        }
      } else {
        console.error('Failed to unpin message:', response.message);
      }
    } catch (error) {
      console.error('Error unpinning message:', error);
    }
    
    handleMenuClose();
  };
  
  const formatPinnedTime = (date) => {
    if (!date) return '';
    try {
      return formatDistanceToNow(new Date(date), { addSuffix: true, locale: vi });
    } catch (error) {
      console.error('Error formatting date:', error);
      return '';
    }
  };
  
  const handleMenuOpen = (event) => {
    setMenuAnchorEl(event.currentTarget);
  };
  
  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };
  
  // Don't show anything if there are no pinned messages or not in a group chat
  if (pinnedMessages.length === 0) {
    console.log('No pinned messages to display');
    return null;
  }
  
  if (conversation?.type !== 'group') {
    console.log('Not a group chat, not showing pinned messages banner');
    return null;
  }
  
  console.log(`Displaying pinned message banner with ${pinnedMessages.length} messages`);
  const currentMessage = pinnedMessages[currentIndex];
  
  return (
    <Collapse in={expanded}>
      <Paper 
        elevation={0} 
        sx={{ 
          p: 0, 
          mb: 0, 
          borderRadius: 0,
          backgroundColor: '#f0f7ff',
          borderBottom: '1px solid #c2e0ff',
          width: '100%',
          overflow: 'hidden',
          transition: 'all 0.3s ease'
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            width: '100%',
            p: 1,
            position: 'relative',
            '&:hover': {
              backgroundColor: '#e3f2fd'
            }
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: 3,
              backgroundColor: '#1976d2'
            }}
          />
          
          <PushPinIcon color="primary" fontSize="small" sx={{ ml: 1, mr: 1.5, transform: 'rotate(45deg)' }} />
          
          <Box sx={{ flex: 1, overflow: 'hidden', display: 'flex', alignItems: 'center' }}>
            <Avatar 
              src={currentMessage?.originalSender?.avatar || 
                  (typeof currentMessage?.sender === 'object' ? currentMessage?.sender?.avatar : null)} 
              sx={{ width: 20, height: 20, mr: 1 }}
            />
            
            <Typography 
              variant="body2" 
              noWrap
              sx={{ fontWeight: 500 }}
            >
              {currentMessage?.content || 'Nội dung tin nhắn'}
            </Typography>
            
            {pinnedMessages.length > 1 && (
              <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                ({currentIndex + 1}/{pinnedMessages.length})
              </Typography>
            )}
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', ml: 1 }}>
            {pinnedMessages.length > 1 && (
              <Box sx={{ display: 'flex' }}>
                <IconButton size="small" onClick={handlePrevious}>
                  <KeyboardArrowDownIcon fontSize="small" />
                </IconButton>
                <IconButton size="small" onClick={handleNext}>
                  <KeyboardArrowUpIcon fontSize="small" />
                </IconButton>
              </Box>
            )}
            
            <IconButton size="small" onClick={handleMenuOpen}>
              <MoreVertIcon fontSize="small" />
            </IconButton>
            
            <IconButton size="small" onClick={() => setExpanded(false)}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>
      </Paper>
      
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem onClick={() => { onViewAllPinned(); handleMenuClose(); }}>
          <ListItemIcon>
            <ListIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Xem tất cả tin nhắn đã ghim</ListItemText>
        </MenuItem>
        
        {(isAdmin || isAdmin2) && (
          <MenuItem onClick={() => handleUnpin(currentMessage?._id)}>
            <ListItemIcon>
              <DeleteIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Bỏ ghim tin nhắn này</ListItemText>
          </MenuItem>
        )}
      </Menu>
    </Collapse>
  );
};

export default PinnedMessageBanner;
