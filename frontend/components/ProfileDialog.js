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
            {user?.bio || 'No bio available'}
          </Typography>
          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
            Contact Information
          </Typography>
          <Typography variant="body2">
            Email: {user?.email}
          </Typography>
          <Typography variant="body2">
            Phone: {user?.phone || 'Not provided'}
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
              {isFriend ? 'Remove Friend' : 'Add Friend'}
            </Button>
            <Button
              variant="contained"
              startIcon={<MessageIcon />}
              onClick={() => {
                // TODO: Implement start chat logic
                onClose();
              }}
            >
              Message
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default ProfileDialog; 