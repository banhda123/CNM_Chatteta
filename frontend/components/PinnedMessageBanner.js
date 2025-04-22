import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  IconButton,
  Avatar,
  Tooltip,
  Collapse
} from '@mui/material';
import {
  PushPin as PushPinIcon,
  Close as CloseIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
  KeyboardArrowUp as KeyboardArrowUpIcon
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
  
  const currentUser = AuthService.getUserData();
  const isAdmin = conversation?.admin && 
    (conversation.admin._id === currentUser?._id || conversation.admin === currentUser?._id);
  const isAdmin2 = conversation?.admin2 && 
    (conversation.admin2._id === currentUser?._id || conversation.admin2 === currentUser?._id);
  
  useEffect(() => {
    if (conversation?._id) {
      loadPinnedMessages();
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
      if (data.conversation && data.conversation.toString() === conversation._id.toString()) {
        // Remove the unpinned message from the list
        setPinnedMessages(prevMessages => {
          const filtered = prevMessages.filter(msg => msg._id.toString() !== data.messageId.toString());
          // Adjust current index if needed
          if (currentIndex >= filtered.length && filtered.length > 0) {
            setCurrentIndex(filtered.length - 1);
          }
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
  
  const handleUnpin = async (messageId) => {
    if (!messageId) return;
    
    // Tìm tin nhắn trong danh sách đã ghim
    const pinnedMessage = pinnedMessages.find(msg => msg._id.toString() === messageId.toString());
    
    // Kiểm tra nếu tin nhắn không tồn tại hoặc không có trạng thái isPinned
    if (!pinnedMessage || !pinnedMessage.isPinned) {
      console.log('Message is not pinned or not found, removing from UI only');
      
      // Chỉ xóa khỏi UI mà không gọi API
      setPinnedMessages(prevMessages => {
        const filtered = prevMessages.filter(msg => msg._id.toString() !== messageId.toString());
        // Adjust current index if needed
        if (currentIndex >= filtered.length && filtered.length > 0) {
          setCurrentIndex(filtered.length - 1);
        }
        return filtered;
      });
      
      // Notify parent component
      if (onUnpinMessage) {
        onUnpinMessage(messageId);
      }
      
      return;
    }
    
    try {
      const token = AuthService.getAccessToken();
      
      // Call the API to unpin the message
      const response = await ChatService.unpinMessage(messageId, token);
      
      if (response.success) {
        // Emit socket event for real-time updates
        SocketService.unpinMessage(messageId);
        
        // Remove from local state
        setPinnedMessages(prevMessages => {
          const filtered = prevMessages.filter(msg => msg._id.toString() !== messageId.toString());
          // Adjust current index if needed
          if (currentIndex >= filtered.length && filtered.length > 0) {
            setCurrentIndex(filtered.length - 1);
          }
          return filtered;
        });
        
        // Notify parent component
        if (onUnpinMessage) {
          onUnpinMessage(messageId);
        }
      } else {
        console.error('Failed to unpin message:', response.message);
      }
    } catch (error) {
      console.error('Error unpinning message:', error);
    }
  };
  
  const handleNextPinned = () => {
    if (pinnedMessages.length > 1) {
      setCurrentIndex((currentIndex + 1) % pinnedMessages.length);
    }
  };
  
  const handlePrevPinned = () => {
    if (pinnedMessages.length > 1) {
      setCurrentIndex((currentIndex - 1 + pinnedMessages.length) % pinnedMessages.length);
    }
  };
  
  const formatMessageContent = (message) => {
    if (!message) return '';
    
    switch (message.type) {
      case 'text':
        return message.content;
      case 'image':
        return '[Hu00ecnh u1ea3nh]';
      case 'file':
        return `[Tu1ec7p: ${message.fileName || 'File'}]`;
      case 'audio':
        return '[Ghi u00e2m]';
      case 'video':
        return '[Video]';
      case 'gif':
        return '[GIF]';
      case 'system':
        return message.content;
      default:
        return message.content || '';
    }
  };
  
  // Don't show anything if there are no pinned messages or not in a group chat
  if (pinnedMessages.length === 0 || conversation?.type !== 'group') {
    return null;
  }
  
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
            p: 1.5,
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
              width: 4,
              backgroundColor: '#1976d2'
            }}
          />
          
          <PushPinIcon color="primary" fontSize="small" sx={{ ml: 1.5, mr: 2, transform: 'rotate(45deg)' }} />
          
          <Box flexGrow={1} sx={{ display: 'flex', flexDirection: 'column' }}>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Typography variant="subtitle2" component="span" sx={{ fontWeight: 'bold', fontSize: '0.85rem', color: '#1976d2' }}>
                Tin nhắn đã ghim {pinnedMessages.length > 1 && `(${currentIndex + 1}/${pinnedMessages.length})`}
              </Typography>
              
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                {currentMessage?.pinnedAt && formatDistanceToNow(new Date(currentMessage.pinnedAt), { addSuffix: true, locale: vi })}
              </Typography>
            </Box>
            
            <Box display="flex" alignItems="center" sx={{ mt: 0.5 }}>
              <Avatar 
                src={currentMessage?.sender?.avatar} 
                alt={currentMessage?.sender?.name}
                sx={{ width: 24, height: 24, mr: 1, border: '1px solid #e0e0e0' }}
              />
              <Typography variant="body2" component="span" sx={{ fontWeight: 500, fontSize: '0.85rem', mr: 1 }}>
                {currentMessage?.sender?.name}
              </Typography>
              <Typography variant="body2" noWrap sx={{ fontSize: '0.85rem', color: 'text.secondary', maxWidth: { xs: '150px', sm: '250px', md: '350px' } }}>
                {formatMessageContent(currentMessage)}
              </Typography>
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', ml: 2 }}>
            {pinnedMessages.length > 1 && (
              <Box sx={{ display: 'flex', mr: 1, bgcolor: '#e3f2fd', borderRadius: 1 }}>
                <Tooltip title="Tin nhắn đã ghim trước">
                  <IconButton size="small" onClick={handlePrevPinned} sx={{ color: '#1976d2' }}>
                    <KeyboardArrowUpIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                
                <Tooltip title="Tin nhắn đã ghim tiếp theo">
                  <IconButton size="small" onClick={handleNextPinned} sx={{ color: '#1976d2' }}>
                    <KeyboardArrowDownIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            )}
            
            <Tooltip title="Xem tất cả tin nhắn đã ghim">
              <IconButton 
                size="small" 
                onClick={onViewAllPinned}
                sx={{ 
                  color: '#1976d2', 
                  bgcolor: '#e3f2fd',
                  mr: 1,
                  '&:hover': { bgcolor: '#bbdefb' }
                }}
              >
                <PushPinIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            
            {(isAdmin || isAdmin2 || 
              (currentMessage?.pinnedBy && currentUser && 
               currentMessage.pinnedBy._id === currentUser._id)) && (
              <Tooltip title="Bỏ ghim tin nhắn">
                <IconButton 
                  size="small" 
                  onClick={() => handleUnpin(currentMessage?._id)}
                  sx={{ 
                    color: '#f44336', 
                    bgcolor: 'rgba(244, 67, 54, 0.08)',
                    mr: 1,
                    '&:hover': { bgcolor: 'rgba(244, 67, 54, 0.12)' }
                  }}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            
            <Tooltip title="Ẩn tin nhắn đã ghim">
              <IconButton 
                size="small" 
                onClick={() => setExpanded(false)}
                sx={{ 
                  color: 'text.secondary',
                  '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.04)' }
                }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </Paper>
    </Collapse>
  );
};

export default PinnedMessageBanner;
