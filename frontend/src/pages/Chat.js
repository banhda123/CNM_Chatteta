import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  TextField,
  IconButton,
  Typography,
  Badge,
  Tabs,
  Tab,
  Button,
} from '@mui/material';
import {
  Send as SendIcon,
  AttachFile as AttachFileIcon,
  EmojiEmotions as EmojiIcon,
  Search as SearchIcon,
  Logout as LogoutIcon,
} from '@mui/icons-material';
import EmojiPicker from 'emoji-picker-react';
import io from 'socket.io-client';
import { userAPI, friendAPI, chatAPI } from '../services/api';

const Chat = () => {
  const navigate = useNavigate();
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [friends, setFriends] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [activeTab, setActiveTab] = useState(0);
  const [currentChat, setCurrentChat] = useState(null);
  const [messageInput, setMessageInput] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    const newSocket = io('http://localhost:5000', {
      auth: { token },
    });

    setSocket(newSocket);

    return () => newSocket.close();
  }, [navigate]);

  useEffect(() => {
    if (socket) {
      socket.on('message', (message) => {
        setMessages((prev) => [...prev, message]);
      });

      socket.on('friendRequest', (request) => {
        setFriendRequests((prev) => [...prev, request]);
      });
    }
  }, [socket]);

  useEffect(() => {
    const fetchFriends = async () => {
      try {
        const response = await friendAPI.getFriends();
        if (response.data && response.data.friends && Array.isArray(response.data.friends)) {
          setFriends(response.data.friends);
        } else {
          console.error('Invalid friends data format:', response.data);
          setFriends([]);
        }
      } catch (error) {
        console.error('Error fetching friends:', error);
        setFriends([]);
      }
    };

    fetchFriends();
  }, []);

  useEffect(() => {
    const fetchFriendRequests = async () => {
      try {
        const response = await friendAPI.getFriendRequests();
        console.log('Friend requests:', response.data);
        if (response.data && response.data.success) {
          // Xử lý lời mời đã nhận (received)
          let receivedRequests = [];
          
          if (response.data.received) {
            if (Array.isArray(response.data.received)) {
              receivedRequests = response.data.received;
            } else if (typeof response.data.received === 'object') {
              // Convert object to array of values
              receivedRequests = Object.values(response.data.received);
            } else {
              console.error('Invalid received friend requests format:', response.data);
            }
          }
          
          // Xử lý lời mời đã gửi (sent)
          let sentRequests = [];
          
          if (response.data.sent) {
            if (Array.isArray(response.data.sent)) {
              sentRequests = response.data.sent;
            } else if (typeof response.data.sent === 'object') {
              // Convert object to array of values
              sentRequests = Object.values(response.data.sent);
            } else {
              console.error('Invalid sent friend requests format:', response.data);
            }
          }
          
          // Process each request to ensure sender information is correctly structured
          const processedReceivedRequests = receivedRequests.map(request => {
            if (typeof request.sender_id !== 'undefined' && (typeof request.sender === 'undefined' || !request.sender)) {
              return {
                ...request,
                _id: request.id || request._id,
                type: 'received',
                sender: {
                  id: request.sender_id,
                  fullname: request.username || request.fullname || 'Unknown User',
                  avatar: request.avatar || ''
                }
              };
            }
            
            if (request.username || request.fullname) {
              return {
                ...request,
                _id: request.id || request._id,
                type: 'received',
                sender: {
                  id: request.sender_id,
                  fullname: request.username || request.fullname,
                  avatar: request.avatar || ''
                }
              };
            }
            
            return {
              ...request,
              type: 'received'
            };
          });
          
          // Process sent requests
          const processedSentRequests = sentRequests.map(request => {
            if (typeof request.receiver_id !== 'undefined' && (typeof request.receiver === 'undefined' || !request.receiver)) {
              return {
                ...request,
                _id: request.id || request._id,
                type: 'sent',
                receiver: {
                  id: request.receiver_id,
                  fullname: request.username || request.fullname || 'Unknown User',
                  avatar: request.avatar || ''
                }
              };
            }
            
            if (request.username || request.fullname) {
              return {
                ...request,
                _id: request.id || request._id,
                type: 'sent',
                receiver: {
                  id: request.receiver_id,
                  fullname: request.username || request.fullname,
                  avatar: request.avatar || ''
                }
              };
            }
            
            return {
              ...request,
              type: 'sent'
            };
          });
          
          console.log('Processed received requests:', processedReceivedRequests);
          console.log('Processed sent requests:', processedSentRequests);
          
          // Combine both received and sent requests
          const allRequests = [...processedReceivedRequests, ...processedSentRequests];
          setFriendRequests(allRequests);
        } else {
          console.error('Failed to fetch friend requests:', response.data);
          setFriendRequests([]);
        }
      } catch (error) {
        console.error('Error fetching friend requests:', error);
        // Even on error, ensure we set an empty array to prevent app from breaking
        setFriendRequests([]);
      }
    };

    if (socket) {
      // Try to fetch friend requests, but don't let it break the app
      fetchFriendRequests().catch(err => {
        console.error('Fatal error fetching friend requests:', err);
        setFriendRequests([]);
      });

      // Listen for new friend requests
      socket.on('friendRequest', (request) => {
        console.log('New friend request received:', request);
        
        // Process the request to ensure sender information is correctly structured
        let processedRequest = request;
        
        if (typeof request.sender_id !== 'undefined' && (typeof request.sender === 'undefined' || !request.sender)) {
          processedRequest = {
            ...request,
            _id: request.id || request._id,
            type: 'received',
            sender: {
              id: request.sender_id,
              fullname: request.username || request.fullname || 'Unknown User',
              avatar: request.avatar || ''
            }
          };
        } else if (request.sender && typeof request.sender === 'object' && !request.sender.fullname && (request.username || request.fullname)) {
          processedRequest = {
            ...request,
            _id: request.id || request._id,
            type: 'received',
            sender: {
              ...request.sender,
              id: request.sender.id || request.sender_id,
              fullname: request.username || request.fullname || request.sender.username || 'Unknown User',
              avatar: request.sender.avatar || request.avatar || ''
            }
          };
        } else {
          // Đảm bảo request luôn có type
          processedRequest = {
            ...processedRequest,
            type: 'received'
          };
        }
        
        console.log('Processed new friend request:', processedRequest);
        setFriendRequests((prev) => [...prev, processedRequest]);
      });

      return () => {
        socket.off('friendRequest');
      };
    }
  }, [socket]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = () => {
    if (messageInput.trim() && currentChat) {
      socket.emit('message', {
        to: currentChat._id,
        content: messageInput,
      });
      setMessageInput('');
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (file && currentChat) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('to', currentChat._id);

      try {
        await chatAPI.uploadFile(formData);
      } catch (error) {
        console.error('Error uploading file:', error);
      }
    }
  };

  const handleSearch = async () => {
    try {
      const response = await userAPI.searchUsers(searchQuery);
      console.log('Search response:', response.data);
      
      if (response.data && response.data.users) {
        // Handle both single object and array cases
        let users = [];
        
        if (Array.isArray(response.data.users)) {
          users = response.data.users;
        } else if (typeof response.data.users === 'object' && response.data.users !== null) {
          // If it's a single object, convert to array with one item
          users = [response.data.users];
        } else {
          console.error('Invalid search results format:', response.data);
          setSearchResults([]);
          return;
        }
        
        // Get the current friend IDs
        const friendIds = friends.map(friend => friend?.id || friend?._id).filter(Boolean);
        
        // Get pending friend request IDs (both sent and received)
        let pendingRequestIds = [];
        let hasFriendRequestError = false;
        
        try {
          const requestsResponse = await friendAPI.getFriendRequests();
          // Check if this is our fake success response from the error handler
          if (requestsResponse.data && 
              requestsResponse.data.success && 
              Array.isArray(requestsResponse.data.received) && 
              requestsResponse.data.received.length === 0 && 
              Array.isArray(requestsResponse.data.sent) && 
              requestsResponse.data.sent.length === 0) {
            // This might be our fake response from the error handler
            console.log('Using empty friend requests due to possible API error');
            hasFriendRequestError = true;
          } else if (requestsResponse.data && requestsResponse.data.success) {
            // Add received request sender IDs
            if (Array.isArray(requestsResponse.data.received)) {
              pendingRequestIds = [
                ...pendingRequestIds,
                ...requestsResponse.data.received.map(req => req.sender_id || req.sender?.id).filter(Boolean)
              ];
            }
            
            // Add sent request receiver IDs
            if (Array.isArray(requestsResponse.data.sent)) {
              pendingRequestIds = [
                ...pendingRequestIds,
                ...requestsResponse.data.sent.map(req => req.receiver_id || req.receiver?.id).filter(Boolean)
              ];
            }
          }
        } catch (error) {
          console.error('Error fetching pending requests:', error);
          hasFriendRequestError = true;
        }
        
        // Process users and mark those who are already friends or have pending requests
        const processedUsers = users.map(user => {
          const userId = parseInt(user.id, 10);
          const isFriend = friendIds.includes(userId);
          
          // If we had an error with friend requests, don't try to check pending status
          const hasPendingRequest = hasFriendRequestError 
            ? false 
            : pendingRequestIds.length > 0 && pendingRequestIds.includes(userId);
          
          return {
            ...user,
            id: userId,
            isFriend,
            hasPendingRequest
          };
        });
        
        console.log('Processed users:', processedUsers);
        setSearchResults(processedUsers);
      } else {
        console.error('Invalid search results format:', response.data);
        setSearchResults([]);
      }
      
      setActiveTab(2);
    } catch (error) {
      console.error('Error searching users:', error);
      setSearchResults([]);
    }
  };

  const handleSendFriendRequest = async (userId) => {
    try {
      console.log('Sending friend request to user ID:', userId);
      
      // Make sure userId is a valid integer
      if (!userId) {
        console.error('Invalid user ID:', userId);
        return;
      }
      
      // Convert to integer if it's a string
      const receiverId = parseInt(userId, 10);
      
      if (isNaN(receiverId)) {
        console.error('User ID is not a valid number:', userId);
        return;
      }
      
      const response = await friendAPI.sendFriendRequest(receiverId);
      console.log('Friend request response:', response.data);
      
      // Handle all success cases
      if (response.data && response.data.success) {
        if (response.data.autoAccepted) {
          // Lời mời được tự động chấp nhận (có lời mời từ phía bên kia)
          console.log('Friend request auto-accepted');
          // Làm mới danh sách bạn bè
          const friendsResponse = await friendAPI.getFriends();
          if (friendsResponse.data && friendsResponse.data.friends) {
            setFriends(friendsResponse.data.friends);
          }
          // Cập nhật UI để hiển thị người dùng là bạn bè
          setSearchResults(prev => prev.map(user => 
            user.id === userId ? { ...user, isFriend: true, hasPendingRequest: false } : user
          ));
          // toast.success('Đã trở thành bạn bè');
        } else {
          // Lời mời đã được gửi thành công
          console.log('Friend request sent successfully');
          // Cập nhật UI để hiển thị đã gửi lời mời
          setSearchResults(prev => prev.map(user => 
            user.id === userId ? { ...user, hasPendingRequest: true } : user
          ));
          // toast.success('Đã gửi lời mời kết bạn');
        }
      }
    } catch (error) {
      console.error('Error sending friend request:', error);
      
      // Handle different error scenarios
      if (error.response) {
        console.error('Server response:', error.response.data);
        
        // Xử lý trường hợp đã gửi lời mời trước đó (409 Conflict)
        if (error.response.status === 409 && 
            error.response.data && 
            error.response.data.message) {
          
          // Cập nhật UI để hiển thị trạng thái đã gửi lời mời
          setSearchResults(prev => prev.map(user => 
            user.id === userId ? { ...user, hasPendingRequest: true } : user
          ));
          
          // Hiển thị thông báo nếu cần
          // toast.info(error.response.data.message);
          
          return; // Kết thúc xử lý
        }
        
        // Xử lý các lỗi khác với mã 400 và có message
        if (error.response.status === 400 && 
            error.response.data && 
            error.response.data.message) {
          // Hiển thị thông báo lỗi nếu cần
          // toast.error(error.response.data.message);
        }
      }
    }
  };

  const handleAcceptFriendRequest = async (requestId) => {
    try {
      const response = await friendAPI.acceptFriendRequest(requestId);
      console.log('Accept friend request response:', response.data);
      
      // Remove the request from the list
      setFriendRequests((prev) => prev.filter((req) => {
        const id = req.id || req._id;
        return id !== requestId;
      }));
      
      // Refresh the friends list to show the new friend
      try {
        const friendsResponse = await friendAPI.getFriends();
        if (friendsResponse.data && friendsResponse.data.friends) {
          setFriends(friendsResponse.data.friends);
        }
      } catch (error) {
        console.error('Error refreshing friends list:', error);
      }
      
      // If we were on the friend requests tab, switch to friends tab if there are no more requests
      if (activeTab === 1) {
        const remainingRequests = friendRequests.filter(req => {
          const id = req.id || req._id;
          return id !== requestId;
        });
        
        if (remainingRequests.length === 0) {
          setActiveTab(0); // Switch to Friends tab
        }
      }
    } catch (error) {
      console.error('Error accepting friend request:', error);
    }
  };

  const handleRejectFriendRequest = async (requestId) => {
    try {
      const response = await friendAPI.rejectFriendRequest(requestId);
      console.log('Reject friend request response:', response.data);
      
      // Remove the request from the list
      setFriendRequests((prev) => prev.filter((req) => {
        const id = req.id || req._id;
        return id !== requestId;
      }));
    } catch (error) {
      console.error('Error rejecting friend request:', error);
    }
  };

  const handleCancelFriendRequest = async (requestId) => {
    try {
      // Gọi API để hủy lời mời kết bạn
      const response = await friendAPI.cancelFriendRequest(requestId);
      console.log('Cancel friend request response:', response.data);
      
      // Xóa lời mời khỏi danh sách hiển thị
      setFriendRequests((prev) => prev.filter((req) => {
        const id = req.id || req._id;
        return id !== requestId;
      }));
    } catch (error) {
      console.error('Error canceling friend request:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  // Refresh data when tab changes
  useEffect(() => {
    if (activeTab === 0) {
      // Refresh friends list when viewing Friends tab
      const refreshFriends = async () => {
        try {
          const response = await friendAPI.getFriends();
          if (response.data && response.data.friends && Array.isArray(response.data.friends)) {
            setFriends(response.data.friends);
          }
        } catch (error) {
          console.error('Error refreshing friends list:', error);
          // Don't update the friends list on error
        }
      };
      
      refreshFriends().catch(err => {
        console.error('Fatal error refreshing friends list:', err);
      });
    } else if (activeTab === 1) {
      // Refresh friend requests when viewing Requests tab
      const refreshFriendRequests = async () => {
        try {
          const response = await friendAPI.getFriendRequests();
          if (response.data && response.data.success) {
            // Process friend requests
            // Xử lý lời mời đã nhận (received)
            let receivedRequests = [];
            
            if (response.data.received) {
              if (Array.isArray(response.data.received)) {
                receivedRequests = response.data.received;
              } else if (typeof response.data.received === 'object') {
                receivedRequests = Object.values(response.data.received);
              } else {
                console.error('Invalid received friend requests format:', response.data);
              }
            }
            
            // Xử lý lời mời đã gửi (sent)
            let sentRequests = [];
            
            if (response.data.sent) {
              if (Array.isArray(response.data.sent)) {
                sentRequests = response.data.sent;
              } else if (typeof response.data.sent === 'object') {
                sentRequests = Object.values(response.data.sent);
              } else {
                console.error('Invalid sent friend requests format:', response.data);
              }
            }
            
            // Process each request to ensure sender information is correctly structured
            const processedReceivedRequests = receivedRequests.map(request => {
              if (typeof request.sender_id !== 'undefined' && !request.sender) {
                return {
                  ...request,
                  _id: request.id || request._id,
                  type: 'received',
                  sender: {
                    id: request.sender_id,
                    fullname: request.username || request.fullname || 'Unknown User',
                    avatar: request.avatar || ''
                  }
                };
              }
              return {
                ...request,
                type: 'received'
              };
            });
            
            // Process sent requests
            const processedSentRequests = sentRequests.map(request => {
              if (typeof request.receiver_id !== 'undefined' && !request.receiver) {
                return {
                  ...request,
                  _id: request.id || request._id,
                  type: 'sent',
                  receiver: {
                    id: request.receiver_id,
                    fullname: request.username || request.fullname || 'Unknown User',
                    avatar: request.avatar || ''
                  }
                };
              }
              return {
                ...request,
                type: 'sent'
              };
            });
            
            // Combine both received and sent requests
            const allRequests = [...processedReceivedRequests, ...processedSentRequests];
            setFriendRequests(allRequests);
          }
        } catch (error) {
          console.error('Error refreshing friend requests:', error);
          // Don't change the friend requests list on error to preserve any existing data
        }
      };
      
      refreshFriendRequests().catch(err => {
        console.error('Fatal error refreshing friend requests:', err);
      });
    }
  }, [activeTab]);

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      {/* Sidebar */}
      <Drawer
        variant="permanent"
        sx={{
          width: 300,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: 300,
            boxSizing: 'border-box',
          },
        }}
      >
        <Box sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Zalo Clone</Typography>
            <IconButton onClick={handleLogout}>
              <LogoutIcon />
            </IconButton>
          </Box>
          <Box sx={{ display: 'flex', mb: 2 }}>
            <TextField
              size="small"
              placeholder="Tìm kiếm..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{ flexGrow: 1, mr: 1 }}
            />
            <IconButton onClick={handleSearch}>
              <SearchIcon />
            </IconButton>
          </Box>
          <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
            <Tab label="Bạn bè" />
            <Tab label="Lời mời" />
            <Tab label="Tìm kiếm" />
          </Tabs>
        </Box>
        <List>
          {activeTab === 0 && friends.map((friend) => (
            <ListItem
              key={friend?._id || `friend-${Math.random()}`}
              button
              onClick={() => friend?._id && setCurrentChat(friend)}
              selected={currentChat?._id === friend?._id}
            >
              <ListItemAvatar>
                <Badge
                  color="success"
                  variant="dot"
                  invisible={!friend?.isOnline}
                >
                  <Avatar src={friend?.avatar || ''} />
                </Badge>
              </ListItemAvatar>
              <ListItemText
                primary={friend?.fullname || 'Unknown Friend'}
                secondary={friend?.isOnline ? 'Online' : 'Offline'}
              />
            </ListItem>
          ))}
          {activeTab === 1 && (
            <>
              {friendRequests.length > 0 ? (
                <>
                  {/* Hiển thị tiêu đề cho nhóm */}
                  {friendRequests.some(request => request.type === 'received') && (
                    <ListItem>
                      <ListItemText 
                        primary="Lời mời đã nhận" 
                        primaryTypographyProps={{
                          variant: 'subtitle1',
                          fontWeight: 'bold',
                          color: 'primary'
                        }}
                      />
                    </ListItem>
                  )}
                  
                  {/* Hiển thị lời mời đã nhận */}
                  {friendRequests
                    .filter(request => request.type === 'received')
                    .map((request) => {
                      // Extract sender info from the request object
                      const requestId = request.id || request._id || `req-${Math.random()}`;
                      const sender = request.sender || {};
                      const senderId = sender.id || request.sender_id;
                      const senderName = sender.fullname || sender.username || 'Unknown User';
                      const senderAvatar = sender.avatar || '';
                      
                      console.log('Rendering received friend request:', request);
                      
                      return (
                        <ListItem key={`received-${requestId}`}>
                          <ListItemAvatar>
                            <Avatar src={senderAvatar} />
                          </ListItemAvatar>
                          <ListItemText
                            primary={senderName}
                            secondary="Đã gửi lời mời kết bạn"
                          />
                          <Button
                            size="small"
                            variant="contained"
                            color="primary"
                            onClick={() => handleAcceptFriendRequest(requestId)}
                          >
                            Chấp nhận
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            color="secondary"
                            onClick={() => handleRejectFriendRequest(requestId)}
                            sx={{ ml: 1 }}
                          >
                            Từ chối
                          </Button>
                        </ListItem>
                      );
                    })}
                  
                  {/* Hiển thị tiêu đề cho nhóm */}
                  {friendRequests.some(request => request.type === 'sent') && (
                    <ListItem>
                      <ListItemText 
                        primary="Lời mời đã gửi" 
                        primaryTypographyProps={{
                          variant: 'subtitle1',
                          fontWeight: 'bold',
                          color: 'primary'
                        }}
                      />
                    </ListItem>
                  )}
                  
                  {/* Hiển thị lời mời đã gửi */}
                  {friendRequests
                    .filter(request => request.type === 'sent')
                    .map((request) => {
                      // Extract receiver info from the request object
                      const requestId = request.id || request._id || `req-${Math.random()}`;
                      const receiver = request.receiver || {};
                      const receiverId = receiver.id || request.receiver_id;
                      const receiverName = receiver.fullname || receiver.username || 'Unknown User';
                      const receiverAvatar = receiver.avatar || '';
                      
                      console.log('Rendering sent friend request:', request);
                      
                      return (
                        <ListItem key={`sent-${requestId}`}>
                          <ListItemAvatar>
                            <Avatar src={receiverAvatar} />
                          </ListItemAvatar>
                          <ListItemText
                            primary={receiverName}
                            secondary="Đang chờ phản hồi"
                          />
                          <Button
                            size="small"
                            variant="outlined"
                            color="secondary"
                            onClick={() => handleCancelFriendRequest(requestId)}
                          >
                            Hủy
                          </Button>
                        </ListItem>
                      );
                    })}
                </>
              ) : (
                <ListItem>
                  <ListItemText 
                    primary="Không có lời mời kết bạn" 
                    secondary="Bạn chưa nhận được lời mời kết bạn nào"
                  />
                </ListItem>
              )}
            </>
          )}
          {activeTab === 2 && searchResults.map((user) => (
            <ListItem key={user?.id || `user-${Math.random()}`}>
              <ListItemAvatar>
                <Avatar src={user?.avatar || ''} />
              </ListItemAvatar>
              <ListItemText 
                primary={user?.fullname || 'Unknown User'} 
                secondary={
                  user?.isFriend ? 'Đã là bạn bè' : 
                  user?.hasPendingRequest ? 'Đã gửi lời mời' : 
                  null
                }
              />
              {user?.isFriend ? (
                <Button
                  size="small"
                  variant="outlined"
                  disabled
                >
                  Đã là bạn
                </Button>
              ) : user?.hasPendingRequest ? (
                <Button
                  size="small"
                  variant="outlined"
                  disabled
                >
                  Đã gửi lời mời
                </Button>
              ) : (
                <Button
                  size="small"
                  variant="contained"
                  onClick={() => handleSendFriendRequest(user?.id)}
                  disabled={!user?.id}
                >
                  Kết bạn
                </Button>
              )}
            </ListItem>
          ))}
        </List>
      </Drawer>

      {/* Main chat area */}
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        {currentChat ? (
          <>
            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
              <Typography variant="h6">{currentChat.fullname}</Typography>
            </Box>
            <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2 }}>
              {messages.map((message, index) => (
                <Box
                  key={index}
                  sx={{
                    display: 'flex',
                    justifyContent: message.sender === currentChat._id ? 'flex-start' : 'flex-end',
                    mb: 2,
                  }}
                >
                  <Box
                    sx={{
                      maxWidth: '70%',
                      p: 2,
                      borderRadius: 2,
                      bgcolor: message.sender === currentChat._id ? 'grey.100' : 'primary.main',
                      color: message.sender === currentChat._id ? 'text.primary' : 'white',
                    }}
                  >
                    {message.content}
                  </Box>
                </Box>
              ))}
              <div ref={messagesEndRef} />
            </Box>
            <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <IconButton onClick={() => setShowEmojiPicker(!showEmojiPicker)}>
                  <EmojiIcon />
                </IconButton>
                <input
                  type="file"
                  id="fileInput"
                  style={{ display: 'none' }}
                  onChange={handleFileUpload}
                />
                <label htmlFor="fileInput">
                  <IconButton component="span">
                    <AttachFileIcon />
                  </IconButton>
                </label>
                <TextField
                  fullWidth
                  variant="outlined"
                  placeholder="Nhập tin nhắn..."
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  sx={{ mx: 2 }}
                />
                <IconButton onClick={handleSendMessage}>
                  <SendIcon />
                </IconButton>
              </Box>
              {showEmojiPicker && (
                <Box sx={{ position: 'absolute', bottom: 0, right: 0 }}>
                  <EmojiPicker
                    onEmojiClick={(emojiObject) => {
                      setMessageInput((prev) => prev + emojiObject.emoji);
                    }}
                  />
                </Box>
              )}
            </Box>
          </>
        ) : (
          <Box
            sx={{
              flexGrow: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Typography variant="h6" color="text.secondary">
              Chọn một cuộc trò chuyện để bắt đầu
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default Chat;