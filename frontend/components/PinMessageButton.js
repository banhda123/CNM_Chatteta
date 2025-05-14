import React, { useState } from 'react';
import { IconButton, Tooltip, Menu, MenuItem, ListItemIcon, ListItemText } from '@mui/material';
import { PushPin as PushPinIcon, PushPinOutlined as PushPinOutlinedIcon } from '@mui/icons-material';
import ChatService from '../services/ChatService';
import AuthService from '../services/AuthService';
import SocketService from '../services/SocketService';

const PinMessageButton = ({ message, conversation, onPinStatusChange }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Check if the current user has permission to pin messages
  const currentUser = AuthService.getUserData();
  const isAdmin = conversation?.admin && 
    (conversation.admin._id === currentUser?._id || conversation.admin === currentUser?._id);
  const isAdmin2 = conversation?.admin2 && 
    (conversation.admin2._id === currentUser?._id || conversation.admin2 === currentUser?._id);
  const canPinMessages = isAdmin || isAdmin2 || conversation?.permissions?.pinMessages;
  
  // Only show pin button in group chats and if user has permission
  if (conversation?.type !== 'group' || !canPinMessages) {
    return null;
  }
  
  const handleClick = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };
  
  const handleClose = () => {
    setAnchorEl(null);
  };
  
  const handlePinMessage = async () => {
    if (!message || loading) return;
    
    setLoading(true);
    try {
      const token = AuthService.getAccessToken();
      if (!token) {
        console.error('No access token found');
        return;
      }
      
      // Call the API to pin the message
      const response = await ChatService.pinMessage(message._id, token);
      
      if (response.success) {
        // Không cần emit socket event vì API đã xử lý và emit event rồi
        // SocketService.pinMessage(message._id);
        
        // Update the local state
        if (onPinStatusChange) {
          onPinStatusChange(message._id, true);
        }
      } else {
        console.error('Failed to pin message:', response.message);
      }
    } catch (error) {
      console.error('Error pinning message:', error);
    } finally {
      setLoading(false);
      handleClose();
    }
  };
  
  const handleUnpinMessage = async () => {
    if (!message || loading) return;
    
    // Kiểm tra nếu tin nhắn chưa được ghim thì không cần gọi API
    if (!message.isPinned) {
      console.log('Message is not pinned, no need to unpin');
      if (onPinStatusChange) {
        onPinStatusChange(message._id, false);
      }
      handleClose();
      return;
    }
    
    setLoading(true);
    try {
      const token = AuthService.getAccessToken();
      if (!token) {
        console.error('No access token found');
        return;
      }
      
      // Cập nhật UI ngay lập tức (optimistic update)
      if (onPinStatusChange) {
        console.log('Optimistically updating UI for unpinned message:', message._id);
        onPinStatusChange(message._id, false);
      }
      
      // Call the API to unpin the message
      const response = await ChatService.unpinMessage(message._id, token);
      
      if (response.success) {
        console.log('Successfully unpinned message:', message._id);
        // Không cần emit socket event vì API đã xử lý và emit event rồi
        // SocketService.unpinMessage(message._id);
      } else {
        console.error('Failed to unpin message:', response.message);
        // Hoàn tác cập nhật UI nếu API thất bại
        if (onPinStatusChange) {
          onPinStatusChange(message._id, true);
        }
      }
    } catch (error) {
      console.error('Error unpinning message:', error);
      // Hoàn tác cập nhật UI nếu có lỗi
      if (onPinStatusChange) {
        onPinStatusChange(message._id, true);
      }
    } finally {
      setLoading(false);
      handleClose();
    }
  };
  
  return (
    <>
      <Tooltip title={message.isPinned ? "Đã ghim" : "Ghim tin nhắn"}>
        <IconButton 
          size="small" 
          onClick={handleClick}
          disabled={loading}
        >
          {message.isPinned ? 
            <PushPinIcon fontSize="small" color="primary" /> : 
            <PushPinOutlinedIcon fontSize="small" />}
        </IconButton>
      </Tooltip>
      
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
      >
        {message.isPinned ? (
          <MenuItem onClick={handleUnpinMessage} disabled={loading}>
            <ListItemIcon>
              <PushPinOutlinedIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Bỏ ghim tin nhắn</ListItemText>
          </MenuItem>
        ) : (
          <MenuItem onClick={handlePinMessage} disabled={loading}>
            <ListItemIcon>
              <PushPinIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Ghim tin nhắn</ListItemText>
          </MenuItem>
        )}
      </Menu>
    </>
  );
};

export default PinMessageButton;
