import React, { useEffect, useState, useRef } from 'react';
import { Platform } from 'react-native';
import {
  Box,
  Typography,
  Avatar,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Tabs,
  Tab,
  CircularProgress,
  Paper,
  InputAdornment,
  IconButton,
  Badge,
  Container,
  Snackbar,
  Alert as MuiAlert,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  Menu,
  MenuItem
} from '@mui/material';
import {
  Search as SearchIcon,
  Message as MessageIcon,
  PersonAdd as PersonAddIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Notifications as NotificationsIcon,
  Schedule as ScheduleIcon,
  MoreVert as MoreVertIcon,
  PersonRemove as PersonRemoveIcon
} from '@mui/icons-material';
import { useNavigation } from '@react-navigation/native';
import UserService from '../services/UserService';
import AuthService from '../services/AuthService';
import SocketService from '../services/SocketService';
import defaultAvatar from '../assets/default-avatar.png';
import FriendRequestNotification from '../components/FriendRequestNotification';

// Create custom Alert component using MUI
const Alert = React.forwardRef(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

// Custom alert dialog for React Native compatibility
const AlertDialog = ({ open, title, message, onClose }) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
    >
      <DialogTitle id="alert-dialog-title">{title}</DialogTitle>
      <DialogContent>
        <DialogContentText id="alert-dialog-description">
          {message}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary" autoFocus>
          OK
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// TabPanel component for tab content
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`contacts-tabpanel-${index}`}
      aria-labelledby={`contacts-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box>
          {children}
        </Box>
      )}
    </div>
  );
}

const Contacts = () => {
  const navigation = useNavigation();
  const [tabIndex, setTabIndex] = useState(0);
  const [friends, setFriends] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingRequests, setIsLoadingRequests] = useState(false);
  const [userId, setUserId] = useState(null);
  
  // Ref để theo dõi polling interval
  const pollingIntervalRef = useRef(null);
  const prevTabIndexRef = useRef(0);
  
  // Snackbar state
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info' // 'success', 'error', 'warning', 'info'
  });
  
  // Alert dialog state
  const [alertDialog, setAlertDialog] = useState({
    open: false,
    title: '',
    message: ''
  });

  const [deferredRequests, setDeferredRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [confirmAction, setConfirmAction] = useState('');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    title: '',
    message: '',
    onConfirm: null
  });

  // Handle closing the snackbar
  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbar({ ...snackbar, open: false });
  };
  
  // Handle closing the alert dialog
  const handleCloseAlertDialog = () => {
    setAlertDialog({ ...alertDialog, open: false });
  };

  // Show notification helper function
  const showNotification = (message, severity = 'info') => {
    // On web, use Snackbar
    if (Platform.OS === 'web') {
      setSnackbar({
        open: true,
        message,
        severity
      });
    } else {
      // On native, use Alert Dialog
      setAlertDialog({
        open: true,
        title: severity === 'error' ? 'Error' : 'Notification',
        message
      });
    }
  };

  useEffect(() => {
    const loadUserData = async () => {
      setIsLoading(true);
      try {
        const userData = await AuthService.getCurrentUser();
        setUserId(userData._id);
        // Load friends
        const friendsData = await UserService.getAllFriends(userData._id);
        setFriends(friendsData);
        // Load friend requests
        const requestsData = await UserService.getAllFriendRequests(userData._id);
        setFriendRequests(requestsData);
        // Load deferred requests
        const token = AuthService.getAccessToken();
        if (token) {
          const deferredData = await UserService.getDeferredFriendRequests(userData._id, token);
          setDeferredRequests(deferredData || []);
        }
        // Load sent requests
        const sentData = await UserService.getAllSentFriendRequests(userData._id);
        setSentRequests(sentData || []);
        // Thiết lập lắng nghe sự kiện socket
        setupSocketListeners(userData._id);
      } catch (error) {
        console.error('Error loading contact data:', error);
        showNotification('Failed to load contact data', 'error');
      } finally {
        setIsLoading(false);
      }
    };
    loadUserData();
    // Hủy lắng nghe sự kiện khi component unmount
    return () => {
      SocketService.removeListener('new_friend_request');
      SocketService.removeListener('friend_request_accepted');
      SocketService.removeListener('friend_request_rejected');
      SocketService.removeListener('friend_request_deferred');
    };
  }, []);

  // Theo dõi thay đổi tab để tải dữ liệu phù hợp (KHÔNG cần polling nữa)
  useEffect(() => {
    // Lưu giá trị tab trước đó
    const prevTabIndex = prevTabIndexRef.current;
    prevTabIndexRef.current = tabIndex;
    // Nếu chuyển sang tab lời mời, tải dữ liệu ngay lập tức
    if (tabIndex === 1) {
      loadFriendRequests();
    } else if (tabIndex === 2) {
      loadSentRequests();
    }
  }, [tabIndex, userId]);
  
  // Thiết lập lắng nghe sự kiện socket
  const setupSocketListeners = (userId) => {
    // Lắng nghe lời mời kết bạn mới
    SocketService.onNewFriendRequest((data) => {
      console.log('Received new friend request in Contacts page:', data);
      
      // Nếu người nhận là người dùng hiện tại
      if (data.to === userId) {
        // Cập nhật danh sách lời mời kết bạn ngay lập tức
        loadFriendRequests();
        showNotification(`${data.fromName || 'Người dùng'} đã gửi lời mời kết bạn`, 'info');
      } 
      // Nếu người gửi là người dùng hiện tại
      else if (data.from === userId || data.userFrom === userId) {
        // Cập nhật danh sách lời mời đã gửi
        loadSentRequests();
      }
    });
    
    // Lắng nghe lời mời kết bạn được chấp nhận
    SocketService.onFriendRequestAccepted((data) => {
      console.log('Friend request accepted in Contacts page:', data);
      
      if (data.to === userId || data.from === userId || 
          data.userTo === userId || data.userFrom === userId) {
        // Cập nhật tất cả danh sách liên quan
        loadFriends();
        loadFriendRequests();
        loadSentRequests();
        showNotification('Lời mời kết bạn đã được chấp nhận', 'success');
      }
    });
    
    // Lắng nghe lời mời kết bạn bị từ chối
    SocketService.onFriendRequestRejected((data) => {
      console.log('Friend request rejected in Contacts page:', data);
      
      if (data.to === userId || data.from === userId || 
          data.userTo === userId || data.userFrom === userId) {
        // Cập nhật danh sách lời mời và lời mời đã gửi
        loadFriendRequests();
        loadSentRequests();
      }
    });

    // Lắng nghe lời mời kết bạn bị hủy
    SocketService.onFriendRequestCanceled((data) => {
      console.log('Friend request canceled in Contacts page:', data);
      
      if (data.to === userId || data.userTo === userId) {
        // Cập nhật danh sách lời mời nếu là người nhận
        loadFriendRequests();
      } else if (data.from === userId || data.userFrom === userId) {
        // Cập nhật danh sách lời mời đã gửi nếu là người gửi
        loadSentRequests();
      }
    });

    // Đảm bảo kết nối socket được thiết lập
    if (!SocketService.isConnected) {
      SocketService.connect();
    }
  };
  
  // Load danh sách bạn bè
  const loadFriends = async () => {
    try {
      const friendsData = await UserService.getAllFriends(userId);
      setFriends(friendsData);
    } catch (error) {
      console.error('Error loading friends:', error);
    }
  };
  
  // Load danh sách lời mời kết bạn
  const loadFriendRequests = async () => {
    try {
      setIsLoadingRequests(true);
      const requests = await UserService.getAllFriendRequests(userId);
      
      // Filter out any requests that have been rejected in this session
      const filteredRequests = requests.filter(request => {
        return !localStorage.getItem(`rejected_request_${request._id}`);
      });
      
      setFriendRequests(filteredRequests);
      
      // Load deferred requests
      const token = AuthService.getAccessToken();
      if (token) {
        const deferredData = await UserService.getDeferredFriendRequests(userId, token);
        setDeferredRequests(deferredData || []);
      }
    } catch (error) {
      console.error('Error loading friend requests:', error);
      setFriendRequests([]);
    } finally {
      setIsLoadingRequests(false);
    }
  };

  // Load danh sách lời mời kết bạn đã gửi
  const loadSentRequests = async () => {
    try {
      setIsLoading(true);
      const requests = await UserService.getAllSentFriendRequests(userId);
      setSentRequests(requests || []);
    } catch (error) {
      console.error('Error loading sent friend requests:', error);
      setSentRequests([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsLoading(true);
    try {
      const results = await UserService.searchUser(searchQuery);
      
      // Check if results is an array
      if (!Array.isArray(results)) {
        // Handle case when results is a single user object
        const singleResult = [results];
        
        // Filter out current user and existing friends
        const filteredResults = singleResult.filter(user => 
          user._id !== userId && 
          !friends.some(friend => friend.idUser?._id === user._id)
        );
        
        setSearchResults(filteredResults);
      } else {
        // Filter out current user and existing friends
        const filteredResults = results.filter(user => 
          user._id !== userId && 
          !friends.some(friend => friend.idUser?._id === user._id)
        );
        
        setSearchResults(filteredResults);
      }
    } catch (error) {
      console.error('Search error:', error);
      showNotification('Không tìm thấy người dùng với số điện thoại này', 'info');
      setSearchResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const sendFriendRequest = async (user) => {
    try {
      // Kiểm tra trạng thái kết bạn
      const token = AuthService.getAccessToken();
      const status = await UserService.checkFriendshipStatus(userId, user._id, token);
      
      if (status && status.status === 'friend') {
        showNotification(`Bạn đã là bạn bè với ${user.name}`, 'info');
        return;
      }
      
      if (status && status.status === 'pending_sent') {
        showNotification(`Bạn đã gửi lời mời kết bạn cho ${user.name}`, 'info');
        return;
      }
      
      if (status && status.status === 'pending_received') {
        showNotification(`${user.name} đã gửi lời mời kết bạn cho bạn`, 'info');
        return;
      }
      
      // Gửi lời mời kết bạn qua API
      const result = await UserService.addFriend(user, token);
      showNotification('Đã gửi lời mời kết bạn', 'success');
      
      // Lấy thông tin người dùng hiện tại cho socket event
      const currentUser = AuthService.getUserData();
      
      // Thông báo qua socket với đầy đủ thông tin
      SocketService.emitSendFriendRequest({
        userFrom: userId,
        userTo: user._id,
        from: userId,
        to: user._id,
        fromName: currentUser?.name || 'Người dùng',
        fromPhone: currentUser?.phone,
        fromAvatar: currentUser?.avatar,
        toName: user.name,
        toPhone: user.phone,
        toAvatar: user.avatar,
        createdAt: new Date().toISOString()
      });
      
      // Update search results to show sent status
      setSearchResults(prev => 
        prev.map(item => 
          item._id === user._id 
            ? {...item, requestSent: true} 
            : item
        )
      );

      // Tải lại danh sách lời mời đã gửi
      loadSentRequests();
    } catch (error) {
      console.error('Error sending friend request:', error);
      showNotification('Không thể gửi lời mời kết bạn', 'error');
    }
  };

  const acceptFriendRequest = async (request) => {
    try {
      // Immediately update UI to show request as accepted
      setFriendRequests(prev => 
        prev.filter(req => req.idUser._id !== request.idUser._id)
      );
      
      setSelectedRequest(request);
      setConfirmAction('accept');
      
      const token = AuthService.getAccessToken();
      
      // Ensure we're passing the correct userTo format
      const userToId = request.idUser._id || request.idUser;
      
      console.log('Accepting friend request:', {
        userFrom: userId,
        userTo: userToId
      });
      
      // Call the service
      await UserService.acceptFriend(userId, userToId, token);
      
      // Thông báo qua socket
      SocketService.emitAcceptFriendRequest({
        userFrom: userId,
        userTo: userToId
      });
      
      // Reload friends list
      const updatedFriends = await UserService.getAllFriends(userId);
      setFriends(updatedFriends);
      
      showNotification('Đã chấp nhận lời mời kết bạn', 'success');
    } catch (error) {
      console.error('Error accepting friend request:', error);
      // Reload friend requests in case of error
      await loadFriendRequests();
      showNotification('Không thể chấp nhận lời mời kết bạn. Vui lòng thử lại sau.', 'error');
    } finally {
      setSelectedRequest(null);
      setConfirmAction('');
    }
  };

  const rejectFriendRequest = async (request) => {
    try {
      // Immediately update UI to show request as removed
      setFriendRequests(prev => 
        prev.filter(req => req.idUser._id !== request.idUser._id)
      );
      
      setSelectedRequest(request);
      setConfirmAction('reject');
      
      const token = AuthService.getAccessToken();
      
      // Ensure we're passing the correct userTo format
      const userToId = request.idUser._id || request.idUser;
      
      console.log('Rejecting friend request:', {
        userFrom: userId,
        userTo: userToId
      });
      
      // Store the rejected request ID to filter it out when reloading
      const rejectedRequestId = request._id;
      localStorage.setItem(`rejected_request_${rejectedRequestId}`, 'true');
      
      // Call the service
      await UserService.rejectFriend(userId, userToId, token);
      
      // Thông báo qua socket
      SocketService.emitRejectFriendRequest({
        userFrom: userId,
        userTo: userToId
      });
      
      showNotification('Đã từ chối lời mời kết bạn', 'success');
    } catch (error) {
      console.error('Error rejecting friend request:', error);
      // Reload the friend requests in case of error
      await loadFriendRequests();
      showNotification('Không thể từ chối lời mời kết bạn. Vui lòng thử lại sau.', 'error');
    } finally {
      setSelectedRequest(null);
      setConfirmAction('');
    }
  };
  
  const deferFriendRequest = async (request) => {
    try {
      // Immediately update UI to show request as deferred
      setFriendRequests(prev => 
        prev.filter(req => req.idUser._id !== request.idUser._id)
      );
      
      // Add to deferred requests list
      setDeferredRequests(prev => [...prev, request]);
      
      setSelectedRequest(request);
      setConfirmAction('defer');
      
      const token = AuthService.getAccessToken();
      
      // Call the API
      await UserService.deferFriendRequest(userId, request.idUser._id, token);
      
      showNotification('Friend request deferred', 'info');
    } catch (error) {
      console.error('Error deferring friend request:', error);
      
      // Reload both lists in case of error
      await loadFriendRequests();
      showNotification('Failed to defer friend request', 'error');
    } finally {
      setSelectedRequest(null);
      setConfirmAction('');
    }
  };

  // Hủy lời mời kết bạn đã gửi
  const cancelSentRequest = async (request) => {
    try {
      // Immediately update UI to show request as cancelled
      setSentRequests(prev => 
        prev.filter(req => req._id !== request._id)
      );
      
      setSelectedRequest(request);
      setConfirmAction('cancel');
      
      const token = AuthService.getAccessToken();
      const userToId = request.idUser._id || request.idUser;
      
      // Gọi API để hủy lời mời
      await UserService.cancelFriendRequest(userId, userToId, token);
      
      showNotification('Đã hủy lời mời kết bạn', 'info');
    } catch (error) {
      console.error('Error canceling friend request:', error);
      
      // Reload sent requests in case of error
      await loadSentRequests();
      showNotification('Không thể hủy lời mời kết bạn. Vui lòng thử lại sau.', 'error');
    } finally {
      setSelectedRequest(null);
      setConfirmAction('');
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabIndex(newValue);
  };
  
  // Expose setTabIndex for external navigation
  React.useEffect(() => {
    window.setContactsTabIndex = setTabIndex;
    
    return () => {
      window.setContactsTabIndex = undefined;
    };
  }, []);

  // Handle opening the menu
  const handleMenuOpen = (event, friend) => {
    event.stopPropagation(); // Prevent navigation to chat
    setMenuAnchorEl(event.currentTarget);
    setSelectedFriend(friend);
  };

  // Handle closing the menu
  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };

  // Handle unfriend confirmation dialog
  const handleCloseConfirmDialog = () => {
    setConfirmDialog({ ...confirmDialog, open: false });
  };

  // Handle unfriend action
  const handleUnfriend = () => {
    handleMenuClose();
    
    // Open confirmation dialog
    setConfirmDialog({
      open: true,
      title: 'Xác nhận huỷ kết bạn',
      message: `Bạn có chắc chắn muốn huỷ kết bạn với ${selectedFriend?.idUser.name} không?`,
      onConfirm: () => removeFriend(selectedFriend)
    });
  };

  // Remove friend function
  const removeFriend = async (friend) => {
    try {
      const result = await AuthService.removeFriend(friend.idUser._id);
      
      if (result.success) {
        // Update the friends list
        setFriends(prev => prev.filter(f => f.idUser._id !== friend.idUser._id));
        showNotification(`Đã huỷ kết bạn với ${friend.idUser.name}`, 'success');
      } else {
        showNotification(result.message || 'Không thể huỷ kết bạn', 'error');
      }
    } catch (error) {
      console.error('Error removing friend:', error);
      showNotification('Lỗi khi huỷ kết bạn', 'error');
    } finally {
      setConfirmDialog({ ...confirmDialog, open: false });
    }
  };

  if (isLoading && !friends.length && !friendRequests.length && !searchResults.length) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        height: '100vh'
      }}>
        <CircularProgress />
        <Typography variant="body1" sx={{ ml: 2 }}>Loading contacts...</Typography>
      </Box>
    );
  }

  return (
    <Container maxWidth="md" sx={{ 
      py: 4,
      height: '100%',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <Paper elevation={3} sx={{ 
        p: 3, 
        borderRadius: 2,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden'
      }}>
        {/* Header cố định */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: 3,
          flexShrink: 0
        }}>
          <Typography variant="h5" component="h1" gutterBottom>
            Contacts
          </Typography>
        </Box>

        {/* Tabs cố định */}
        <Tabs
          value={tabIndex}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
          sx={{ 
            borderBottom: 1, 
            borderColor: 'divider', 
            mb: 2,
            flexShrink: 0
          }}
        >
          <Tab 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography sx={{ mr: 1 }}>Bạn bè</Typography>
                <Badge badgeContent={friends.length} color="primary" />
              </Box>
            } 
          />
          <Tab 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography sx={{ mr: 1 }}>Lời mời</Typography>
                <Badge badgeContent={friendRequests.length} color="error" />
              </Box>
            } 
          />
          <Tab 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography sx={{ mr: 1 }}>Đã gửi</Typography>
                <Badge badgeContent={sentRequests.length} color="secondary" />
              </Box>
            } 
          />
          <Tab 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography sx={{ mr: 1 }}>Tìm kiếm</Typography>
                <SearchIcon fontSize="small" />
              </Box>
            } 
          />
        </Tabs>

        {/* Vùng chứa tab có thể cuộn */}
        <Box sx={{ 
          flex: 1, 
          overflow: 'auto',
          position: 'relative' 
        }}>
          {/* Friends Tab */}
          <TabPanel value={tabIndex} index={0}>
            {isLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <>
                {friends.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography color="text.secondary" gutterBottom>
                      Bạn chưa có bạn bè nào
                    </Typography>
                    <Button 
                      variant="contained" 
                      color="primary" 
                      onClick={() => setTabIndex(2)}
                      startIcon={<PersonAddIcon />}
                      size="large"
                      sx={{ mt: 2 }}
                    >
                      Tìm kiếm bạn bè
                    </Button>
                  </Box>
                ) : (
                  <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
                    {friends.map((friend) => (
                      <ListItem 
                        key={friend._id}
                        alignItems="flex-start"
                        secondaryAction={
                          <Box>
                            <IconButton 
                              edge="end" 
                              aria-label="message"
                              onClick={() => navigation.navigate('Chat', { 
                                screen: 'ChatDetail',
                                params: { userId: friend.idUser._id }
                              })}
                              color="primary"
                            >
                              <MessageIcon />
                            </IconButton>
                            <IconButton 
                              edge="end" 
                              aria-label="more"
                              onClick={(event) => handleMenuOpen(event, friend)}
                            >
                              <MoreVertIcon />
                            </IconButton>
                          </Box>
                        }
                        sx={{ 
                          borderBottom: '1px solid',
                          borderColor: 'divider',
                          '&:hover': { bgcolor: 'action.hover' }
                        }}
                      >
                        <ListItemAvatar>
                          <Avatar alt={friend.idUser?.name || "User"} 
                                  src={friend.idUser?.avatar || defaultAvatar} />
                        </ListItemAvatar>
                        <ListItemText
                          primary={friend.idUser?.name || "User"}
                          secondary={
                            <React.Fragment>
                              <Typography
                                component="span"
                                variant="body2"
                                color="text.primary"
                              >
                                {friend.idUser?.phone || ""}
                              </Typography>
                              {friend.idUser?.status && (
                                <Typography
                                  component="span"
                                  variant="body2"
                                  color="text.secondary"
                                  sx={{ display: 'block' }}
                                >
                                  {friend.idUser.status}
                                </Typography>
                              )}
                            </React.Fragment>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                )}
              </>
            )}
          </TabPanel>

          {/* Requests Tab */}
          <TabPanel value={tabIndex} index={1}>
            {isLoadingRequests ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <>
                {friendRequests.length === 0 && deferredRequests.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography color="text.secondary">
                      Bạn không có lời mời kết bạn nào
                    </Typography>
                  </Box>
                ) : (
                  <>
                    {/* Pending Requests */}
                    {friendRequests.length > 0 && (
                      <>
                        <Typography variant="h6" gutterBottom>
                          Lời mời kết bạn đang chờ xử lý
                        </Typography>
                        <Typography variant="body2" color="text.secondary" paragraph>
                          Dưới đây là danh sách những người đã gửi lời mời kết bạn cho bạn. Bạn có thể chấp nhận, từ chối hoặc tạm hoãn việc trả lời.
                        </Typography>
                        <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
                          {friendRequests.map((request) => (
                            <ListItem 
                              key={request._id}
                              alignItems="flex-start"
                              secondaryAction={
                                <Box sx={{ display: 'flex', gap: 1 }}>
                                  <Button 
                                    variant="contained" 
                                    color="primary"
                                    startIcon={<CheckIcon />}
                                    onClick={() => acceptFriendRequest(request)}
                                  >
                                    Đồng ý
                                  </Button>
                                  <Button 
                                    variant="outlined" 
                                    color="error"
                                    startIcon={<CloseIcon />}
                                    onClick={() => rejectFriendRequest(request)}
                                  >
                                    Từ chối
                                  </Button>
                                  <IconButton 
                                    color="default"
                                    onClick={() => deferFriendRequest(request)}
                                    title="Để sau"
                                  >
                                    <ScheduleIcon />
                                  </IconButton>
                                </Box>
                              }
                              sx={{ 
                                borderBottom: '1px solid',
                                borderColor: 'divider',
                                '&:hover': { bgcolor: 'action.hover' },
                                py: 1.5
                              }}
                            >
                              <ListItemAvatar>
                                <Avatar
                                  alt={request.idUser?.name || "User"} 
                                  src={request.idUser?.avatar || defaultAvatar}
                                  sx={{ width: 56, height: 56 }}
                                />
                              </ListItemAvatar>
                              <ListItemText
                                primary={
                                  <Typography variant="subtitle1" component="span" fontWeight="medium">
                                    {request.idUser?.name || "User"}
                                  </Typography>
                                }
                                secondary={
                                  <React.Fragment>
                                    <Typography
                                      component="span"
                                      variant="body2"
                                      color="text.primary"
                                      display="block"
                                    >
                                      {request.idUser?.phone || ""}
                                    </Typography>
                                    <Typography
                                      component="span"
                                      variant="body2"
                                      color="text.secondary"
                                      display="block"
                                    >
                                      Đã gửi lời mời kết bạn {new Date(request.createdAt).toLocaleDateString('vi-VN')}
                                    </Typography>
                                  </React.Fragment>
                                }
                              />
                            </ListItem>
                          ))}
                        </List>
                      </>
                    )}
                    
                    {/* Deferred Requests */}
                    {deferredRequests.length > 0 && (
                      <>
                        <Divider sx={{ my: 2 }} />
                        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                          <ScheduleIcon sx={{ mr: 1 }} /> Lời mời đã tạm hoãn
                        </Typography>
                        <Typography variant="body2" color="text.secondary" paragraph>
                          Đây là những lời mời bạn đã tạm hoãn trước đó. Bạn vẫn có thể chấp nhận hoặc từ chối chúng.
                        </Typography>
                        <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
                          {deferredRequests.map((request) => (
                            <ListItem 
                              key={request._id}
                              alignItems="flex-start"
                              secondaryAction={
                                <Box sx={{ display: 'flex', gap: 1 }}>
                                  <Button 
                                    variant="contained" 
                                    color="primary"
                                    startIcon={<CheckIcon />}
                                    onClick={() => acceptFriendRequest(request)}
                                  >
                                    Đồng ý
                                  </Button>
                                  <Button 
                                    variant="outlined" 
                                    color="error"
                                    startIcon={<CloseIcon />}
                                    onClick={() => rejectFriendRequest(request)}
                                  >
                                    Từ chối
                                  </Button>
                                </Box>
                              }
                              sx={{ 
                                borderBottom: '1px solid',
                                borderColor: 'divider',
                                '&:hover': { bgcolor: 'action.hover' },
                                bgcolor: 'action.hover',
                                py: 1.5
                              }}
                            >
                              <ListItemAvatar>
                                <Avatar
                                  alt={request.idUser?.name || "User"} 
                                  src={request.idUser?.avatar || defaultAvatar}
                                  sx={{ width: 56, height: 56 }}
                                />
                              </ListItemAvatar>
                              <ListItemText
                                primary={
                                  <Typography variant="subtitle1" component="span" fontWeight="medium">
                                    {request.idUser?.name || "User"}
                                  </Typography>
                                }
                                secondary={
                                  <React.Fragment>
                                    <Typography
                                      component="span"
                                      variant="body2"
                                      color="text.primary"
                                      display="block"
                                    >
                                      {request.idUser?.phone || ""}
                                    </Typography>
                                    <Typography
                                      component="span"
                                      variant="body2"
                                      color="text.secondary"
                                      display="block"
                                    >
                                      Đã tạm hoãn - Gửi lời mời {new Date(request.createdAt).toLocaleDateString('vi-VN')}
                                    </Typography>
                                  </React.Fragment>
                                }
                              />
                            </ListItem>
                          ))}
                        </List>
                      </>
                    )}
                  </>
                )}
              </>
            )}
          </TabPanel>

          {/* Sent Requests Tab */}
          <TabPanel value={tabIndex} index={2}>
            {isLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <>
                {sentRequests.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography color="text.secondary">
                      Bạn chưa gửi lời mời kết bạn nào
                    </Typography>
                  </Box>
                ) : (
                  <>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      Dưới đây là danh sách lời mời kết bạn bạn đã gửi đi. Bạn có thể hủy lời mời bất kỳ lúc nào.
                    </Typography>
                    <List>
                      {sentRequests.map((request) => (
                        <ListItem 
                          key={request._id}
                          alignItems="flex-start"
                          secondaryAction={
                            <IconButton 
                              color="default"
                              onClick={() => cancelSentRequest(request)}
                              aria-label="cancel request"
                            >
                              <CloseIcon />
                            </IconButton>
                          }
                          sx={{ 
                            borderBottom: '1px solid',
                            borderColor: 'divider',
                            '&:hover': { bgcolor: 'action.hover' }
                          }}
                        >
                          <ListItemAvatar>
                            <Avatar alt={request.idUser?.name || "User"} 
                                    src={request.idUser?.avatar || defaultAvatar} />
                          </ListItemAvatar>
                          <ListItemText
                            primary={request.idUser?.name || "User"}
                            secondary={
                              <React.Fragment>
                                <Typography
                                  component="span"
                                  variant="body2"
                                  color="text.primary"
                                >
                                  {request.idUser?.phone || ""}
                                </Typography>
                                <Typography
                                  component="span"
                                  variant="body2"
                                  color="text.secondary"
                                  sx={{ display: 'block' }}
                                >
                                  Đã gửi lời mời - Đang chờ phản hồi
                                </Typography>
                              </React.Fragment>
                            }
                          />
                        </ListItem>
                      ))}
                    </List>
                  </>
                )}
              </>
            )}
          </TabPanel>

          {/* Search Tab */}
          <TabPanel value={tabIndex} index={3}>
            <Box sx={{ mb: 3 }}>
              <TextField
                fullWidth
                label="Search by name or phone number"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={handleSearch} disabled={isLoading}>
                        {isLoading ? <CircularProgress size={24} /> : <SearchIcon />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch();
                  }
                }}
                variant="outlined"
                placeholder="Nhập số điện thoại để tìm kiếm"
                helperText="Nhập số điện thoại và nhấn Enter hoặc biểu tượng tìm kiếm"
              />
            </Box>

            {searchResults.length > 0 ? (
              <List>
                {searchResults.map((user) => {
                  const isAlreadyFriend = friends.some(friend => friend._id === user._id);
                  const hasPendingRequest = friendRequests.some(req => req.idUser?._id === user._id);
                  
                  return (
                    <ListItem 
                      key={user._id}
                      alignItems="flex-start"
                      secondaryAction={
                        isAlreadyFriend ? (
                          <Button 
                            variant="outlined" 
                            startIcon={<MessageIcon />}
                            onClick={() => navigation.navigate('Chat', { userId: user._id })}
                          >
                            Nhắn tin
                          </Button>
                        ) : hasPendingRequest ? (
                          <Button 
                            variant="outlined" 
                            disabled
                            startIcon={<ScheduleIcon />}
                          >
                            Chờ xác nhận
                          </Button>
                        ) : (
                          <Button 
                            variant="contained" 
                            color="primary"
                            startIcon={<PersonAddIcon />}
                            onClick={() => sendFriendRequest(user)}
                          >
                            Kết bạn
                          </Button>
                        )
                      }
                      sx={{ 
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                        '&:hover': { bgcolor: 'action.hover' }
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar alt={user.name} src={user.avatar || defaultAvatar} />
                      </ListItemAvatar>
                      <ListItemText
                        primary={user.name}
                        secondary={
                          <React.Fragment>
                            <Typography
                              component="span"
                              variant="body2"
                              color="text.primary"
                            >
                              {user.phone}
                            </Typography>
                            {user.status && (
                              <Typography
                                component="span"
                                variant="body2"
                                color="text.secondary"
                                sx={{ display: 'block' }}
                              >
                                {user.status}
                              </Typography>
                            )}
                          </React.Fragment>
                        }
                      />
                    </ListItem>
                  );
                })}
              </List>
            ) : (
              searchQuery && !isLoading && (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography color="text.secondary" gutterBottom>
                    Không tìm thấy người dùng với số điện thoại "{searchQuery}"
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Hãy kiểm tra lại số điện thoại và thử lại. Đảm bảo bạn nhập đúng định dạng số điện thoại.
                  </Typography>
                </Box>
              )
            )}
          </TabPanel>
        </Box>
      </Paper>

      {/* Friend options menu */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
        keepMounted={false}
        disablePortal
      >
        <MenuItem onClick={handleUnfriend}>
          <ListItemAvatar>
            <Avatar sx={{ bgcolor: 'error.light', width: 28, height: 28 }}>
              <PersonRemoveIcon fontSize="small" />
            </Avatar>
          </ListItemAvatar>
          <ListItemText primary="Remove Friend" />
        </MenuItem>
      </Menu>

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialog.open}
        onClose={handleCloseConfirmDialog}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">{confirmDialog.title}</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            {confirmDialog.message}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseConfirmDialog}>Cancel</Button>
          <Button 
            onClick={() => {
              confirmDialog.onConfirm();
              handleCloseConfirmDialog();
            }} 
            color="error" 
            autoFocus
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={handleCloseSnackbar}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity} 
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
      
      {/* Alert Dialog for mobile */}
      <AlertDialog
        open={alertDialog.open}
        title={alertDialog.title}
        message={alertDialog.message}
        onClose={handleCloseAlertDialog}
      />
    </Container>
  );
};

export default Contacts; 