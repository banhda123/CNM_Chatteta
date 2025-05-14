import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Avatar,
  Typography,
  Button,
  Box,
  Divider,
  IconButton,
} from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import MessageIcon from '@mui/icons-material/Message';

const ProfileDialog = ({ open, onClose, user, currentUser }) => {
  const isFriend = false; // TODO: Implement friend check logic
  const isCurrentUser = user?._id === currentUser?._id;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar
            src={user?.avatar}
            sx={{ width: 60, height: 60 }}
          />
          <Box>
            <Typography variant="h6">{user?.name}</Typography>
            <Typography variant="body2" color="text.secondary">
              {user?.email}
            </Typography>
          </Box>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <Typography variant="body1" sx={{ mb: 2 }}>
            {user?.bio || 'Chưa có thông tin giới thiệu'}
          </Typography>
          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
            Thông tin liên hệ
          </Typography>
          <Typography variant="body2">
            Email: {user?.email}
          </Typography>
          <Typography variant="body2">
            Số điện thoại: {user?.phone || 'Chưa cung cấp'}
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        {!isCurrentUser && (
          <>
            <Button
              variant="outlined"
              startIcon={<PersonAddIcon />}
              onClick={() => {
                // TODO: Implement add friend logic
                onClose();
              }}
            >
              {isFriend ? 'Hủy kết bạn' : 'Kết bạn'}
            </Button>
            <Button
              variant="contained"
              startIcon={<MessageIcon />}
              onClick={() => {
                // TODO: Implement start chat logic
                onClose();
              }}
            >
              Nhắn tin
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default ProfileDialog; 