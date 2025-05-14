import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider,
  CircularProgress,
  Snackbar,
  Alert,
  IconButton
} from '@mui/material';
import {
  Sync as SyncIcon,
  PersonAdd as PersonAddIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import ContactService from '../services/ContactService';
import UserService from '../services/UserService';
import AuthService from '../services/AuthService';
import SocketService from '../services/SocketService';

const ContactSync = () => {
  const [open, setOpen] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState('');
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });

  useEffect(() => {
    // Đồng bộ danh bạ khi component được mở
    if (open && !contacts.length && !loading) {
      syncContacts();
    }
  }, [open]);

  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const syncContacts = async () => {
    try {
      setSyncing(true);
      setLoading(true);
      setError('');
      setContacts([]);
      
      // Lấy danh sách bạn bè tiềm năng từ danh bạ
      const potentialFriends = await ContactService.findFriendsFromContacts();
      
      // Cập nhật state
      setContacts(potentialFriends || []);
      
      // Hiển thị thông báo
      if (potentialFriends.length > 0) {
        setSnackbar({
          open: true,
          message: `Tìm thấy ${potentialFriends.length} người dùng từ danh bạ của bạn`,
          severity: 'success'
        });
      } else {
        setSnackbar({
          open: true,
          message: 'Không tìm thấy người dùng nào từ danh bạ của bạn',
          severity: 'info'
        });
      }
    } catch (error) {
      console.error('Error syncing contacts:', error);
      setError(error.message || 'Lỗi khi đồng bộ danh bạ');
      setSnackbar({
        open: true,
        message: 'Lỗi khi đồng bộ danh bạ',
        severity: 'error'
      });
    } finally {
      setSyncing(false);
      setLoading(false);
    }
  };

  const handleAddFriend = async (user) => {
    try {
      setLoading(true);
      
      // Lấy thông tin người dùng hiện tại
      const userData = AuthService.getUserData();
      const token = AuthService.getAccessToken();
      
      if (!userData || !token) {
        throw new Error('Không có thông tin người dùng hoặc token');
      }
      
      // Kiểm tra trạng thái kết bạn
      const status = await ContactService.checkFriendshipStatus(user._id);
      
      if (status === 'friend') {
        setSnackbar({
          open: true,
          message: `Bạn đã là bạn bè với ${user.name}`,
          severity: 'info'
        });
        return;
      }
      
      if (status === 'pending_sent') {
        setSnackbar({
          open: true,
          message: `Bạn đã gửi lời mời kết bạn cho ${user.name}`,
          severity: 'info'
        });
        return;
      }
      
      if (status === 'pending_received') {
        setSnackbar({
          open: true,
          message: `${user.name} đã gửi lời mời kết bạn cho bạn`,
          severity: 'info'
        });
        return;
      }
      
      // Gửi lời mời kết bạn
      await UserService.addFriend(user, token);
      
      // Cập nhật UI: đánh dấu đã gửi lời mời
      setContacts(prev => 
        prev.map(contact => 
          contact._id === user._id 
            ? { ...contact, requestSent: true } 
            : contact
        )
      );
      
      // Gửi thông báo realtime qua socket
      SocketService.emitSendFriendRequest({
        userFrom: userData._id,
        userTo: user._id
      });
      
      // Hiển thị thông báo thành công
      setSnackbar({
        open: true,
        message: `Đã gửi lời mời kết bạn đến ${user.name}`,
        severity: 'success'
      });
    } catch (error) {
      console.error('Error adding friend:', error);
      setSnackbar({
        open: true,
        message: 'Lỗi khi gửi lời mời kết bạn',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <>
      <Button
        variant="outlined"
        color="primary"
        startIcon={<SyncIcon />}
        onClick={handleOpen}
      >
        Đồng bộ danh bạ
      </Button>
      
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Bạn bè từ danh bạ</Typography>
            <IconButton onClick={handleClose} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        
        <DialogContent dividers>
          {syncing ? (
            <Box display="flex" flexDirection="column" alignItems="center" p={3} gap={2}>
              <CircularProgress />
              <Typography>Đang đồng bộ danh bạ...</Typography>
            </Box>
          ) : loading ? (
            <Box display="flex" justifyContent="center" p={3}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Box p={3} textAlign="center">
              <Typography color="error">{error}</Typography>
              <Button
                variant="outlined"
                color="primary"
                onClick={syncContacts}
                sx={{ mt: 2 }}
              >
                Thử lại
              </Button>
            </Box>
          ) : contacts.length > 0 ? (
            <List>
              {contacts.map((contact) => (
                <ListItem
                  key={contact._id}
                  divider
                  secondaryAction={
                    contact.requestSent ? (
                      <Button
                        variant="outlined"
                        size="small"
                        disabled
                      >
                        Đã gửi
                      </Button>
                    ) : (
                      <Button
                        variant="contained"
                        color="primary"
                        size="small"
                        startIcon={<PersonAddIcon />}
                        onClick={() => handleAddFriend(contact)}
                        disabled={loading}
                      >
                        Kết bạn
                      </Button>
                    )
                  }
                >
                  <ListItemAvatar>
                    <Avatar src={contact.avatar} alt={contact.name}>
                      {!contact.avatar && contact.name ? contact.name.charAt(0).toUpperCase() : ''}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={contact.name}
                    secondary={
                      contact.contactName !== contact.name
                        ? `${contact.contactName} • ${contact.phone}`
                        : contact.phone
                    }
                    primaryTypographyProps={{ fontWeight: 'medium' }}
                  />
                </ListItem>
              ))}
            </List>
          ) : (
            <Box p={3} textAlign="center">
              <Typography>Không tìm thấy người dùng nào từ danh bạ của bạn</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Mời người thân, bạn bè cài đặt ứng dụng để kết nối
              </Typography>
            </Box>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button
            onClick={syncContacts}
            startIcon={<SyncIcon />}
            disabled={syncing || loading}
          >
            Đồng bộ lại
          </Button>
          <Button
            onClick={handleClose}
            variant="contained"
          >
            Đóng
          </Button>
        </DialogActions>
      </Dialog>
      
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default ContactSync; 