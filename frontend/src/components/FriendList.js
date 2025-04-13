import React, { useState, useEffect } from 'react';
import { chatService } from '../services/chat';
import { getSocket, socketEvents } from '../services/socket';

const FriendList = ({ onSelectFriend }) => {
  const [friends, setFriends] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [activeTab, setActiveTab] = useState('friends');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  useEffect(() => {
    loadFriends();
    loadFriendRequests();
    setupSocketListeners();
  }, []);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Handle search when debounced term changes
  useEffect(() => {
    if (!debouncedSearchTerm.trim()) {
      setSearchResults([]);
      return;
    }

    const searchUsers = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await chatService.searchUsers(debouncedSearchTerm);
        console.log('Search response:', response); // Debug log
        
        if (response && response.data) {
          setSearchResults(response.data);
        } else {
          setError('Không tìm thấy kết quả');
          setSearchResults([]);
        }
      } catch (error) {
        console.error('Error searching users:', error);
        if (error.response) {
          if (error.response.status === 400) {
            setError('Từ khóa tìm kiếm không hợp lệ');
          } else if (error.response.status === 401) {
            setError('Vui lòng đăng nhập lại');
            localStorage.removeItem('token');
            window.location.href = '/login';
          } else {
            setError('Lỗi khi tìm kiếm người dùng');
          }
        } else if (error.request) {
          setError('Không thể kết nối đến máy chủ');
        } else {
          setError('Lỗi khi thực hiện tìm kiếm');
        }
        setSearchResults([]);
      } finally {
        setLoading(false);
      }
    };

    searchUsers();
  }, [debouncedSearchTerm]);

  const loadFriends = async () => {
    try {
      const response = await chatService.getFriends();
      setFriends(response.data);
    } catch (error) {
      console.error('Error loading friends:', error);
    }
  };

  const loadFriendRequests = async () => {
    try {
      console.log('Loading friend requests...');
      const response = await chatService.getFriendRequests();
      console.log('Friend requests response from service:', response);
      
      if (response && response.success) {
        // Xử lý lời mời nhận được
        const receivedRequests = (response.received || []).map(req => {
          // Đảm bảo có thông tin sender
          const sender = req.sender || {
            id: req.sender_id, 
            fullname: req.fullname || 'Người dùng',
            avatar: req.avatar || ''
          };
          
          return {
            ...req,
            _id: req.id || req._id, // Đảm bảo có trường _id
            type: 'received',
            sender // Đảm bảo có thông tin sender
          };
        });
        
        // Xử lý lời mời đã gửi
        const sentRequests = (response.sent || []).map(req => {
          // Đảm bảo có thông tin receiver
          const receiver = req.receiver || {
            id: req.receiver_id,
            fullname: req.fullname || 'Người dùng',
            avatar: req.avatar || ''
          };
          
          return {
            ...req,
            _id: req.id || req._id, // Đảm bảo có trường _id
            type: 'sent',
            receiver // Đảm bảo có thông tin receiver
          };
        });
        
        const allRequests = [...receivedRequests, ...sentRequests];
        console.log('All friend requests after processing:', allRequests);
        setFriendRequests(allRequests);
      } else {
        console.error('Invalid response format for friend requests:', response);
        setFriendRequests([]);
        if (response && response.error) {
          setError(response.error);
        }
      }
    } catch (error) {
      console.error('Error loading friend requests:', error);
      setFriendRequests([]);
      setError('Không thể tải danh sách lời mời kết bạn');
    }
  };

  const setupSocketListeners = () => {
    const socket = getSocket();
    if (!socket) return;

    socket.on(socketEvents.FRIEND_REQUEST, (request) => {
      setFriendRequests(prev => [...prev, request]);
    });

    socket.on(socketEvents.FRIEND_REQUEST_ACCEPTED, (friend) => {
      setFriends(prev => [...prev, friend]);
      setFriendRequests(prev => prev.filter(req => req.id !== friend.id));
    });

    socket.on(socketEvents.FRIEND_REQUEST_REJECTED, (requestId) => {
      setFriendRequests(prev => prev.filter(req => req.id !== requestId));
    });

    socket.on(socketEvents.FRIEND_REMOVED, (friendId) => {
      setFriends(prev => prev.filter(friend => friend.id !== friendId));
    });

    socket.on(socketEvents.STATUS_CHANGED, ({ userId, status }) => {
      setFriends(prev => prev.map(friend => 
        friend.id === userId ? { ...friend, status } : friend
      ));
    });
  };

  const handleSendFriendRequest = async (userId) => {
    try {
      const response = await chatService.sendFriendRequest(userId);
      console.log('Send friend request response:', response);
      
      if (response.success) {
        // Loại bỏ người dùng khỏi kết quả tìm kiếm
        setSearchResults(prev => prev.filter(user => user.id !== userId));
        
        // Cập nhật danh sách lời mời
        loadFriendRequests();
        
        // Chuyển sang tab lời mời kết bạn
        setActiveTab('requests');
      } else {
        // Hiển thị lỗi từ server (nếu có)
        setError(response.message || 'Không thể gửi lời mời kết bạn');
        
        // Sau 3 giây ẩn thông báo lỗi
        setTimeout(() => {
          setError('');
        }, 3000);
      }
    } catch (error) {
      console.error('Error sending friend request:', error);
      
      // Hiển thị lỗi cho người dùng
      setError('Không thể gửi lời mời kết bạn: ' + (error.message || 'Lỗi không xác định'));
      
      // Sau 3 giây ẩn thông báo lỗi
      setTimeout(() => {
        setError('');
      }, 3000);
    }
  };

  const handleAcceptRequest = async (requestId) => {
    try {
      await chatService.acceptFriendRequest(requestId);
    } catch (error) {
      console.error('Error accepting friend request:', error);
    }
  };

  const handleRejectRequest = async (requestId) => {
    try {
      await chatService.rejectFriendRequest(requestId);
    } catch (error) {
      console.error('Error rejecting friend request:', error);
    }
  };

  const handleCancelFriendRequest = async (requestId) => {
    try {
      const response = await chatService.cancelFriendRequest(requestId);
      console.log('Cancel friend request response:', response);
      
      if (response.success) {
        // Cập nhật danh sách lời mời kết bạn
        setFriendRequests(prev => prev.filter(req => (req._id || req.id) !== requestId));
      }
    } catch (error) {
      console.error('Error canceling friend request:', error);
      setError('Không thể hủy lời mời kết bạn: ' + (error.message || 'Lỗi không xác định'));
    }
  };

  return (
    <div className="friend-list">
      <div className="search-container">
        <div className="search-input-wrapper">
          <input
            type="text"
            placeholder="Tìm kiếm bạn bè..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          {loading && <div className="search-loading">Đang tìm kiếm...</div>}
        </div>
        {error && <div className="search-error">{error}</div>}
      </div>

      {/* Tabs cho bạn bè và lời mời kết bạn */}
      <div className="friend-tabs">
        <button 
          className={activeTab === 'friends' ? 'active' : ''} 
          onClick={() => setActiveTab('friends')}
        >
          Bạn bè ({friends.length})
        </button>
        <button 
          className={activeTab === 'requests' ? 'active' : ''} 
          onClick={() => setActiveTab('requests')}
        >
          Lời mời ({friendRequests.length})
        </button>
      </div>

      {/* Hiển thị danh sách bạn bè */}
      {activeTab === 'friends' && (
        <div className="friends-list">
          {friends.length > 0 ? (
            friends.map(friend => (
              <div key={friend.id} className="friend-item" onClick={() => onSelectFriend(friend)}>
                <img 
                  src={friend.avatar || '/default-avatar.png'} 
                  alt={friend.fullname}
                  onError={(e) => {
                    e.target.src = '/default-avatar.png';
                  }}
                />
                <div className="friend-info">
                  <span className="friend-name">{friend.fullname}</span>
                  <span className={`friend-status ${friend.status}`}>{friend.status || 'offline'}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="empty-list">Bạn chưa có bạn bè nào</div>
          )}
        </div>
      )}

      {/* Hiển thị danh sách lời mời kết bạn */}
      {activeTab === 'requests' && (
        <div className="requests-list">
          {friendRequests.length > 0 ? (
            <>
              {/* Lời mời nhận được */}
              {friendRequests.filter(req => req.type === 'received').length > 0 && (
                <div className="request-section">
                  <h4>Lời mời nhận được</h4>
                  {friendRequests.filter(req => req.type === 'received').map(request => (
                    <div key={request._id || request.id} className="request-item">
                      <img 
                        src={(request.sender?.avatar) || '/default-avatar.png'} 
                        alt={(request.sender?.fullname) || 'Người dùng'}
                        onError={(e) => {
                          e.target.src = '/default-avatar.png';
                        }}
                      />
                      <div className="request-info">
                        <span className="request-name">{(request.sender?.fullname) || 'Người dùng'}</span>
                        <span className="request-time">
                          {new Date(request.created_at).toLocaleString()}
                        </span>
                      </div>
                      <div className="request-actions">
                        <button 
                          className="accept-btn" 
                          onClick={() => handleAcceptRequest(request._id || request.id)}
                        >
                          Chấp nhận
                        </button>
                        <button 
                          className="reject-btn" 
                          onClick={() => handleRejectRequest(request._id || request.id)}
                        >
                          Từ chối
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Lời mời đã gửi */}
              {friendRequests.filter(req => req.type === 'sent').length > 0 && (
                <div className="request-section">
                  <h4>Lời mời đã gửi</h4>
                  {friendRequests.filter(req => req.type === 'sent').map(request => (
                    <div key={request._id || request.id} className="request-item">
                      <img 
                        src={(request.receiver?.avatar) || '/default-avatar.png'} 
                        alt={(request.receiver?.fullname) || 'Người dùng'}
                        onError={(e) => {
                          e.target.src = '/default-avatar.png';
                        }}
                      />
                      <div className="request-info">
                        <span className="request-name">{(request.receiver?.fullname) || 'Người dùng'}</span>
                        <span className="request-time">
                          {new Date(request.created_at).toLocaleString()}
                        </span>
                      </div>
                      <div className="request-actions">
                        <div className="request-status">Đang chờ</div>
                        <button 
                          className="cancel-btn" 
                          onClick={() => handleCancelFriendRequest(request._id || request.id)}
                        >
                          Hủy
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="empty-list">Không có lời mời kết bạn nào</div>
          )}
        </div>
      )}

      {/* Kết quả tìm kiếm */}
      {searchResults.length > 0 && (
        <div className="search-results">
          <h3>Kết quả tìm kiếm</h3>
          {searchResults.map(user => (
            <div key={user.id} className="search-result-item">
              <img 
                src={user.avatar || '/default-avatar.png'} 
                alt={user.name || user.fullname}
                onError={(e) => {
                  e.target.src = '/default-avatar.png';
                }}
              />
              <div className="user-info">
                <span className="user-name">{user.name || user.fullname}</span>
                <span className="user-status">{user.status || 'offline'}</span>
              </div>
              <button 
                className="add-friend-btn"
                onClick={() => handleSendFriendRequest(user.id)}
              >
                Kết bạn
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FriendList;