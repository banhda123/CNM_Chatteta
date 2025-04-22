import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  Avatar,
  IconButton,
  CircularProgress
} from '@mui/material';
import { Close as CloseIcon, PhotoCamera as PhotoCameraIcon } from '@mui/icons-material';
import ChatService from '../services/ChatService';
import AuthService from '../services/AuthService';

const EditGroupDialog = ({ open, onClose, conversation, onGroupUpdated }) => {
  const [groupName, setGroupName] = useState('');
  const [groupAvatar, setGroupAvatar] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open && conversation) {
      setGroupName(conversation.name || '');
      setGroupAvatar(conversation.avatar || '');
      setAvatarPreview(conversation.avatar || '');
    }
  }, [open, conversation]);

  const handleAvatarChange = (event) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setAvatarFile(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!groupName.trim()) {
      setError('Tên nhóm không được để trống');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const token = AuthService.getAccessToken();
      if (!token) {
        setError('You are not authenticated. Please log in again.');
        return;
      }
      
      console.log('Token being used:', token); // Debug log
      
      // If there's a new avatar file, upload it first
      let avatarUrl = groupAvatar;
      if (avatarFile) {
        // Here you would upload the avatar file to your server/cloud storage
        // and get back a URL. For now, we'll simulate this with the preview URL.
        avatarUrl = avatarPreview; // In a real app, replace with actual upload logic
      }
      
      const groupData = {
        conversationId: conversation._id,
        name: groupName.trim(),
        avatar: avatarUrl
      };

      console.log('Sending group data:', groupData); // Debug log

      const response = await ChatService.updateGroupInfo(groupData, token);
      
      if (response.success) {
        onGroupUpdated(response.conversation);
        handleClose();
      } else {
        setError(response.message || 'Không thể cập nhật nhóm');
      }
    } catch (error) {
      console.error('Error updating group:', error);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      }
      if (error.message === 'No token provided') {
        setError('You are not authenticated. Please log in again.');
      } else {
      setError('Không thể cập nhật nhóm. Vui lòng thử lại.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setError('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Chỉnh sửa nhóm
        <IconButton
          aria-label="close"
          onClick={handleClose}
          sx={{ position: 'absolute', right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent dividers>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
          <Box sx={{ position: 'relative', mb: 2 }}>
            <Avatar
              src={avatarPreview}
              alt={groupName}
              sx={{ width: 100, height: 100 }}
            />
            <input
              accept="image/*"
              style={{ display: 'none' }}
              id="avatar-upload"
              type="file"
              onChange={handleAvatarChange}
            />
            <label htmlFor="avatar-upload">
              <IconButton
                color="primary"
                aria-label="upload picture"
                component="span"
                sx={{
                  position: 'absolute',
                  right: -10,
                  bottom: -10,
                  bgcolor: 'background.paper',
                  boxShadow: 1,
                  '&:hover': { bgcolor: 'background.default' }
                }}
              >
                <PhotoCameraIcon />
              </IconButton>
            </label>
          </Box>
          
          <Typography variant="caption" color="text.secondary">
            Nhấp vào biểu tượng máy ảnh để thay đổi ảnh đại diện nhóm
          </Typography>
        </Box>
        
        <TextField
          autoFocus
          margin="dense"
          label="Tên nhóm"
          type="text"
          fullWidth
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
          error={!!error && !groupName.trim()}
          helperText={!groupName.trim() && error ? 'Tên nhóm không được để trống' : ''}
        />
        
        {error && !error.includes('Group name') && (
          <Typography color="error" variant="body2" sx={{ mt: 2 }}>
            {error}
          </Typography>
        )}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={handleClose}>Hủy</Button>
        <Button 
          onClick={handleSave} 
          color="primary" 
          variant="contained"
          disabled={loading || !groupName.trim()}
        >
          {loading ? <CircularProgress size={24} /> : 'Lưu thay đổi'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditGroupDialog;
