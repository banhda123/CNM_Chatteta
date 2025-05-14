import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Button,
  Avatar,
  Badge,
  IconButton,
  Menu,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Close as CloseIcon,
  Check as CheckIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';
import UserService from '../services/UserService';
import AuthService from '../services/AuthService';
import SocketService from '../services/SocketService';

const FriendRequestNotification = () => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [friendRequests, setFriendRequests] = useState([]);
  const [deferredRequests, setDeferredRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState('');
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });
  const [viewAll, setViewAll] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const pollingIntervalRef = useRef(null); // Ref để lưu trữ interval ID
  const isMenuOpenRef = useRef(false); // Theo dõi trạng thái menu

  // Lấy danh sách lời mời kết bạn
  useEffect(() => {
    // Tải lời mời kết bạn ban đầu
    loadFriendRequests();
    
    // Lắng nghe sự kiện realtime
    const newRequestListener = SocketService.onNewFriendRequest((data) => {
      console.log('New friend request received in component:', data);
      
      // Kiểm tra xem người dùng hiện tại có phải là người nhận không
      const userData = AuthService.getUserData();
      if (userData && userData._id === data.to) {
        // Cập nhật danh sách lời mời khi có mới (refresh ngay lập tức)
        loadFriendRequests();
        
        // Hiển thị thông báo
        setSnackbar({
          open: true,
          message: `${data.fromName || 'Người dùng'} đã gửi lời mời kết bạn`,
          severity: 'info'
        });
        
        // Tăng số lượng thông báo chưa đọc
        setUnreadCount(prev => prev + 1);
      }
    });
    
    const requestAcceptedListener = SocketService.onFriendRequestAccepted((data) => {
      // Cập nhật lại danh sách lời mời
      loadFriendRequests();
    });

    const requestRejectedListener = SocketService.onFriendRequestRejected((data) => {
      // Cập nhật lại danh sách lời mời
      loadFriendRequests();
    });

    const requestCanceledListener = SocketService.onFriendRequestCanceled((data) => {
      // Cập nhật lại danh sách lời mời khi có yêu cầu bị hủy
      loadFriendRequests();
    });
    
    // Thiết lập kiểm tra định kỳ nhưng chỉ khi socket không kết nối
    const startBackupPolling = () => {
      if (!SocketService.isConnected) {
        console.log('Socket not connected, starting backup polling');
        startPolling();
      }
    };
    
    // Kiểm tra ban đầu và sau đó mỗi 30 giây
    startBackupPolling();
    const checkInterval = setInterval(startBackupPolling, 30000);
    
    return () => {
      // Hủy đăng ký lắng nghe khi component unmount
      SocketService.removeListener('new_friend_request');
      SocketService.removeListener('friend_request_accepted');
      SocketService.removeListener('friend_request_rejected');
      SocketService.removeListener('friend_request_canceled');
      
      // Xóa tất cả interval khi unmount
      clearInterval(checkInterval);
      stopPolling();
    };
  }, []);

  // Bắt đầu polling với tần suất cao hơn (3 giây)
  const startPolling = () => {
    // Dừng polling hiện tại nếu có
    stopPolling();
    
    // Bắt đầu polling mới
    console.log('Starting friend request polling (every 3s)');
    pollingIntervalRef.current = setInterval(() => {
      if (isMenuOpenRef.current) {
        console.log('Polling friend requests while menu open');
        loadFriendRequests();
      } else if (!SocketService.isConnected) {
        console.log('Backup polling for friend requests (socket disconnected)');
        loadFriendRequests();
      }
    }, 3000);
  };
  
  // Dừng polling
  const stopPolling = () => {
    if (pollingIntervalRef.current) {
      console.log('Stopping friend request polling');
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  };

  // Tải danh sách lời mời kết bạn
  const loadFriendRequests = async () => {
    try {
      setLoading(true);
      
      const userData = AuthService.getUserData();
      if (!userData || !userData._id) {
        console.log('Cannot load friend requests: Missing user data');
        return;
      }
      
      console.log('Loading friend requests for user:', userData._id);
      
      // Lấy danh sách lời mời chưa trả lời
      const requests = await UserService.getAllFriendRequests(userData._id);
      console.log('Received friend requests:', requests);
      
      // Filter out any requests that have been rejected in this session
      const filteredRequests = requests.filter(request => {
        return !localStorage.getItem(`rejected_request_${request._id}`);
      });
      
      console.log('Filtered friend requests:', filteredRequests);
      setFriendRequests(filteredRequests);
      
      // Lấy danh sách lời mời đã tạm hoãn nếu có
      const token = AuthService.getAccessToken();
      if (token) {
        const deferred = await UserService.getDeferredFriendRequests(userData._id, token);
        console.log('Deferred friend requests:', deferred);
        setDeferredRequests(deferred || []);
      }
      
      // Nếu đang mở menu thông báo, reset số lượng chưa đọc
      if (anchorEl) {
        setUnreadCount(0);
      } else {
        // Cập nhật số lượng chưa đọc
        setUnreadCount(filteredRequests.length);
        console.log('Updated unread count:', filteredRequests.length);
      }
    } catch (error) {
      console.error('Error loading friend requests:', error);
      setFriendRequests([]);
      setDeferredRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationClick = (event) => {
    setAnchorEl(event.currentTarget);
    setUnreadCount(0); // Reset số lượng chưa đọc khi người dùng mở menu
    isMenuOpenRef.current = true; // Đánh dấu menu đang mở
    
    // Refresh ngay lập tức khi mở menu
    loadFriendRequests();
    
    // Bắt đầu polling với tần suất cao khi menu mở
    startPolling();
  };

  const handleNotificationClose = () => {
    setAnchorEl(null);
    setViewAll(false); // Reset trạng thái xem tất cả khi đóng
    isMenuOpenRef.current = false; // Đánh dấu menu đã đóng
    
    // Dừng polling khi menu đóng nếu socket đang hoạt động
    if (SocketService.isConnected) {
      stopPolling();
    }
  };

  const handleAccept = async (request) => {
    try {
      if (!request) return;
      
      setLoading(true);
      const userData = AuthService.getUserData();
      const token = AuthService.getAccessToken();
      
      await UserService.acceptFriend(userData._id, request.idUser._id, token);
      
      // Cập nhật giao diện
      setFriendRequests(prev => prev.filter(r => r.idUser._id !== request.idUser._id));
      
      // Phát thông báo socket để thông báo cho người gửi
      SocketService.emitAcceptFriendRequest({
        userFrom: userData._id,
        userTo: request.idUser._id
      });
      
      // Hiển thị thông báo thành công
      setSnackbar({
        open: true,
        message: `Đã chấp nhận lời mời kết bạn từ ${request.idUser.name}`,
        severity: 'success'
      });
    } catch (error) {
      console.error('Error accepting friend request:', error);
      setSnackbar({
        open: true,
        message: 'Lỗi khi chấp nhận lời mời kết bạn',
        severity: 'error'
      });
    } finally {
      setLoading(false);
      setConfirmOpen(false);
    }
  };

  const handleReject = async (request) => {
    try {
      if (!request) return;
      
      setLoading(true);
      const userData = AuthService.getUserData();
      const token = AuthService.getAccessToken();
      
      // Store the rejected request ID to filter it out when reloading
      const rejectedRequestId = request._id;
      localStorage.setItem(`rejected_request_${rejectedRequestId}`, 'true');
      
      // Cập nhật giao diện trước
      setFriendRequests(prev => prev.filter(r => r.idUser._id !== request.idUser._id));
      
      await UserService.rejectFriend(userData._id, request.idUser._id, token);
      
      // Phát thông báo socket để thông báo cho người gửi
      SocketService.emitRejectFriendRequest({
        userFrom: userData._id,
        userTo: request.idUser._id
      });
      
      // Hiển thị thông báo
      setSnackbar({
        open: true,
        message: `Đã từ chối lời mời kết bạn từ ${request.idUser.name}`,
        severity: 'info'
      });
    } catch (error) {
      console.error('Error rejecting friend request:', error);
      setSnackbar({
        open: true,
        message: 'Lỗi khi từ chối lời mời kết bạn',
        severity: 'error'
      });
    } finally {
      setLoading(false);
      setConfirmOpen(false);
    }
  };

  const handleDefer = async (request) => {
    try {
      if (!request) return;
      
      setLoading(true);
      const userData = AuthService.getUserData();
      const token = AuthService.getAccessToken();
      
      await UserService.deferFriendRequest(userData._id, request.idUser._id, token);
      
      // Cập nhật giao diện
      setFriendRequests(prev => prev.filter(r => r.idUser._id !== request.idUser._id));
      setDeferredRequests(prev => [...prev, request]);
      
      // Hiển thị thông báo
      setSnackbar({
        open: true,
        message: `Đã tạm hoãn lời mời kết bạn từ ${request.idUser.name}`,
        severity: 'info'
      });
    } catch (error) {
      console.error('Error deferring friend request:', error);
      setSnackbar({
        open: true,
        message: 'Lỗi khi tạm hoãn lời mời kết bạn',
        severity: 'error'
      });
    } finally {
      setLoading(false);
      setConfirmOpen(false);
    }
  };

  const openConfirmDialog = (request, action) => {
    setSelectedRequest(request);
    setConfirmAction(action);
    setConfirmOpen(true);
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const toggleViewAll = () => {
    setViewAll(!viewAll);
  };

  return (
    <>
      <IconButton
        color="inherit"
        onClick={handleNotificationClick}
        aria-label="Lời mời kết bạn"
      >
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>
      
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleNotificationClose}
        PaperProps={{
          style: {
            width: '350px',
            maxHeight: '80vh'
          }
        }}
      >
        <Box sx={{ p: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Lời mời kết bạn</Typography>
          <Button 
            size="small" 
            onClick={toggleViewAll}
            disabled={friendRequests.length === 0 && deferredRequests.length === 0}
          >
            {viewAll ? 'Thu gọn' : 'Xem tất cả'}
          </Button>
        </Box>
        
        <Divider />
        
        {loading ? (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography>Đang tải...</Typography>
          </Box>
        ) : (
          <>
            {/* Hiển thị lời mời mới */}
            {friendRequests.length > 0 ? (
              <List>
                {friendRequests.slice(0, viewAll ? friendRequests.length : 3).map((request, index) => (
                  <ListItem 
                    key={request.idUser._id}
                    divider={index < friendRequests.length - 1}
                    sx={{ py: 1 }}
                  >
                    <ListItemAvatar>
                      <Avatar src={request.idUser.avatar} alt={request.idUser.name}>
                        {!request.idUser.avatar && request.idUser.name ? request.idUser.name.charAt(0).toUpperCase() : ''}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={request.idUser.name}
                      secondary="Muốn kết bạn với bạn"
                      primaryTypographyProps={{ fontWeight: 'medium' }}
                    />
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <IconButton 
                        size="small" 
                        color="success" 
                        onClick={() => openConfirmDialog(request, 'accept')}
                        title="Chấp nhận"
                      >
                        <CheckIcon fontSize="small" />
                      </IconButton>
                      <IconButton 
                        size="small" 
                        color="error" 
                        onClick={() => openConfirmDialog(request, 'reject')}
                        title="Từ chối"
                      >
                        <CloseIcon fontSize="small" />
                      </IconButton>
                      <IconButton 
                        size="small" 
                        color="default" 
                        onClick={() => openConfirmDialog(request, 'defer')}
                        title="Để sau"
                      >
                        <ScheduleIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </ListItem>
                ))}
              </List>
            ) : (
              <Box sx={{ p: 2, textAlign: 'center' }}>
                <Typography color="text.secondary">Không có lời mời kết bạn mới</Typography>
              </Box>
            )}
            
            {/* Hiển thị lời mời đã tạm hoãn */}
            {viewAll && deferredRequests.length > 0 && (
              <>
                <Divider />
                <Box sx={{ p: 1 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Lời mời đã tạm hoãn
                  </Typography>
                </Box>
                <List>
                  {deferredRequests.map((request, index) => (
                    <ListItem 
                      key={request.idUser._id}
                      divider={index < deferredRequests.length - 1}
                      sx={{ py: 1, bgcolor: 'action.hover' }}
                    >
                      <ListItemAvatar>
                        <Avatar src={request.idUser.avatar} alt={request.idUser.name}>
                          {!request.idUser.avatar && request.idUser.name ? request.idUser.name.charAt(0).toUpperCase() : ''}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={request.idUser.name}
                        secondary="Đã tạm hoãn"
                        primaryTypographyProps={{ fontWeight: 'medium' }}
                      />
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <IconButton 
                          size="small" 
                          color="success" 
                          onClick={() => openConfirmDialog(request, 'accept')}
                          title="Chấp nhận"
                        >
                          <CheckIcon fontSize="small" />
                        </IconButton>
                        <IconButton 
                          size="small" 
                          color="error" 
                          onClick={() => openConfirmDialog(request, 'reject')}
                          title="Từ chối"
                        >
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </ListItem>
                  ))}
                </List>
              </>
            )}
          </>
        )}
      </Menu>
      
      {/* Dialog xác nhận */}
      <Dialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        aria-labelledby="confirm-dialog-title"
      >
        <DialogTitle id="confirm-dialog-title">
          {confirmAction === 'accept' && 'Chấp nhận lời mời kết bạn?'}
          {confirmAction === 'reject' && 'Từ chối lời mời kết bạn?'}
          {confirmAction === 'defer' && 'Để lời mời này lại sau?'}
        </DialogTitle>
        <DialogContent>
          <Typography>
            {confirmAction === 'accept' && `Bạn sẽ trở thành bạn bè với ${selectedRequest?.idUser?.name || 'người dùng này'}.`}
            {confirmAction === 'reject' && `Bạn sẽ từ chối lời mời kết bạn từ ${selectedRequest?.idUser?.name || 'người dùng này'}.`}
            {confirmAction === 'defer' && `Lời mời kết bạn từ ${selectedRequest?.idUser?.name || 'người dùng này'} sẽ được lưu lại để xem xét sau.`}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)} disabled={loading}>
            Hủy
          </Button>
          <Button 
            onClick={() => {
              if (confirmAction === 'accept') handleAccept(selectedRequest);
              if (confirmAction === 'reject') handleReject(selectedRequest);
              if (confirmAction === 'defer') handleDefer(selectedRequest);
            }} 
            autoFocus
            variant="contained" 
            color={confirmAction === 'accept' ? 'success' : confirmAction === 'reject' ? 'error' : 'primary'}
            disabled={loading}
          >
            Xác nhận
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Snackbar thông báo */}
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

export default FriendRequestNotification; 