import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  ListItemIcon,
  Avatar,
  Typography,
  Box,
  IconButton,
  Divider,
  CircularProgress,
  Menu,
  MenuItem,
  FormControlLabel,
  Switch
} from '@mui/material';
import {
  Close as CloseIcon,
  MoreVert as MoreVertIcon,
  PersonAdd as PersonAddIcon,
  ExitToApp as ExitToAppIcon,
  Delete as DeleteIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import KeyIcon from '@mui/icons-material/Key';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import ChatService from '../services/ChatService';
import AuthService from '../services/AuthService';
import SocketService from '../services/SocketService';
import AddGroupMembersDialog from './AddGroupMembersDialog';

const GroupMembersDialog = ({ open, onClose, conversation, onMemberRemoved, onGroupLeft, onGroupDeleted, onGroupUpdated }) => {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isAdmin2, setIsAdmin2] = useState(false);
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [selectedMember, setSelectedMember] = useState(null);
  const [addMembersDialogOpen, setAddMembersDialogOpen] = useState(false);
  const [confirmLeaveOpen, setConfirmLeaveOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [confirmSetAdmin2Open, setConfirmSetAdmin2Open] = useState(false);
  const [confirmRemoveAdmin2Open, setConfirmRemoveAdmin2Open] = useState(false);
  const [permissionsDialogOpen, setPermissionsDialogOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (open && conversation) {
      prepareData();
      setupSocketListeners();
    }
    
    return () => {
      // Clean up socket listeners when component unmounts or dialog closes
      SocketService.removeListener('member_added');
      SocketService.removeListener('member_removed');
      SocketService.removeListener('member_removed_from_group');
      SocketService.removeListener('member_left_group');
      SocketService.removeListener('group_left');
      SocketService.removeListener('update_conversation_list');
      SocketService.leaveConversation(conversation?._id);
    };
  }, [open, conversation]);
  
  // Setup socket listeners for real-time updates
  const setupSocketListeners = () => {
    // Ensure socket is connected
    SocketService.connect();
    
    // Join the conversation room to receive updates
    if (conversation && conversation._id) {
      SocketService.joinConversation(conversation._id);
    }
    
    // Listen for member added event
    SocketService.onMemberAdded((data) => {
      console.log('Socket: Member added to group', data);
      if (data.conversation && data.conversation._id === conversation._id) {
        // Update the local state with the new member
        const newMember = data.member;
        if (newMember && !members.some(m => m.idUser._id === newMember.idUser._id)) {
          // Add role to the new member
          const memberWithRole = { ...newMember, role: 'member' };
          setMembers(prevMembers => [...prevMembers, memberWithRole]);
          
          // Update the conversation object if needed
          if (onGroupUpdated && data.conversation) {
            onGroupUpdated(data.conversation);
          }
        }
      }
    });
    
    // Listen for member removed event
    SocketService.onMemberRemoved((data) => {
      console.log('Socket: Member removed from group', data);
      if (data.conversation && data.conversation._id === conversation._id) {
        // Remove the member from local state
        const removedMemberId = data.memberId;
        if (removedMemberId) {
          setMembers(prevMembers => 
            prevMembers.filter(m => m.idUser._id !== removedMemberId)
          );
          
          // Update the conversation object if needed
          if (onGroupUpdated && data.conversation) {
            onGroupUpdated(data.conversation);
          }

          // If the current user is the one being removed, close the dialog and trigger necessary updates
          if (currentUser && currentUser._id === removedMemberId) {
            handleClose();
            if (onGroupLeft) {
              onGroupLeft(conversation._id);
            }
          }
        }
      }
    });

    // Listen for member left group event
    SocketService.onMemberLeftGroup((data) => {
      console.log('Socket: Member left group', data);
      if (data.conversationId === conversation._id) {
        // Remove the member from local state
        setMembers(prevMembers => 
          prevMembers.filter(m => m.idUser._id !== data.memberId)
        );
      }
    });

    // Listen for group left event (for the user who left)
    SocketService.onGroupLeft((data) => {
      console.log('Socket: Group left', data);
      if (data.conversationId === conversation._id && 
          currentUser && currentUser._id === data.userId) {
        handleClose();
        if (onGroupLeft) {
          onGroupLeft(conversation._id);
        }
      }
    });

    // Listen for conversation list updates
    SocketService.onUpdateConversationList((data) => {
      console.log('Socket: Conversation list updated', data);
      if (data.conversation && data.conversation._id === conversation._id) {
        // Update members list with new conversation data
        const updatedMembers = data.conversation.members.map(member => ({
          ...member,
          role: member.idUser._id === data.conversation.admin?._id ? 'admin' :
                member.idUser._id === data.conversation.admin2?._id ? 'admin2' : 'member'
        }));
        setMembers(updatedMembers);

        // Update conversation in parent component
        if (onGroupUpdated) {
          onGroupUpdated(data.conversation);
        }
      }
    });
  };

  const prepareData = () => {
    if (!conversation) return;
    
    // Get current user data
    const userData = AuthService.getUserData();
    setCurrentUser(userData);
    
    console.log('=== Conversation Data ===');
    console.log('Full conversation:', conversation);
    console.log('Admin:', conversation.admin);
    console.log('Admin2:', conversation.admin2);
    console.log('Members:', conversation.members);
    console.log('Current user:', userData);
    
    // Store admin and admin2 IDs in localStorage for use in ChatService
    if (conversation.admin) {
      const adminId = conversation.admin._id || conversation.admin;
      localStorage.setItem('adminId', adminId);
      localStorage.setItem(`adminId_${conversation._id}`, adminId);
      console.log('Stored adminId in localStorage:', adminId);
    }
    
    if (conversation.admin2) {
      const admin2Id = conversation.admin2._id || conversation.admin2;
      localStorage.setItem('admin2Id', admin2Id);
      localStorage.setItem(`admin2Id_${conversation._id}`, admin2Id);
      console.log('Stored admin2Id in localStorage:', admin2Id);
    }
    
    // Kiểm tra thông tin admin từ localStorage
    const storedAdminId = localStorage.getItem(`adminId_${conversation._id}`);
    const storedAdmin2Id = localStorage.getItem(`admin2Id_${conversation._id}`);
    
    console.log('Stored admin ID:', storedAdminId);
    console.log('Stored admin2 ID:', storedAdmin2Id);
    
    // Cập nhật thông tin admin và admin2 trong conversation nếu không có
    if (!conversation.admin && storedAdminId) {
      console.log('Restoring admin from localStorage:', storedAdminId);
      conversation.admin = storedAdminId;
    }
    
    if (!conversation.admin2 && storedAdmin2Id) {
      console.log('Restoring admin2 from localStorage:', storedAdmin2Id);
      conversation.admin2 = storedAdmin2Id;
    }
    
    // Check if current user is admin or admin2
    const adminId = conversation.admin?._id || conversation.admin || storedAdminId;
    const admin2Id = conversation.admin2?._id || conversation.admin2 || storedAdmin2Id;
    
    const isUserAdmin = adminId && userData && userData._id === adminId;
    const isUserAdmin2 = admin2Id && userData && userData._id === admin2Id;
    
    setIsAdmin(isUserAdmin);
    setIsAdmin2(isUserAdmin2);
    
    console.log('=== Role Checks ===');
    console.log('Is user admin:', isUserAdmin, 'Admin ID:', adminId, 'User ID:', userData?._id);
    console.log('Is user admin2:', isUserAdmin2, 'Admin2 ID:', admin2Id, 'User ID:', userData?._id);
    
    // Set members with correct roles
    if (conversation.members) {
      // Lọc bỏ AI Gemini khỏi danh sách thành viên nhóm
      const updatedMembers = conversation.members
        .filter(member => {
          // Lọc theo email hoặc tên đặc biệt
          const email = member.idUser?.email || '';
          const name = member.idUser?.name || '';
          return email !== 'gemini@ai.assistant' && name !== 'Gemini AI';
        })
        .map(member => {
          console.log('Processing member:', member);
          
          // Get the actual user ID (handle both direct ID and nested idUser._id)
          const memberId = member.idUser?._id || member.idUser || member._id;
          console.log('Member ID:', memberId);
          
          // Set role based on admin/admin2 status
          let role = "member";
          
          if (adminId && memberId === adminId) {
            role = "admin";
          }
          
          if (admin2Id && memberId === admin2Id) {
            role = "admin2";
          }
          
          console.log('Setting role to', role, 'for member:', memberId);
          return { ...member, role };
        });
      
      console.log('=== Final Members ===');
      console.log('Updated members:', updatedMembers);
      setMembers(updatedMembers);
    }
  };

  const handleMenuOpen = (event, member) => {
    setMenuAnchorEl(event.currentTarget);
    setSelectedMember(member);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setSelectedMember(null);
  };

  const handleSetAdmin2 = async () => {
    if (!selectedMember || !conversation) return;
    
    try {
      setActionLoading(true);
      const token = AuthService.getAccessToken();
      
      const response = await ChatService.setAdmin2(
        conversation._id,
        selectedMember.idUser._id,
        token
      );
      
      if (response.success) {
        // Create updated conversation object with the new admin2
        const updatedConversation = {
          ...conversation,
          admin2: selectedMember.idUser,
          members: conversation.members.map(m => 
            m.idUser._id === selectedMember.idUser._id 
              ? { ...m, role: "admin2" }
              : m
          )
        };
        
        // Update local members list
        setMembers(prevMembers => 
          prevMembers.map(m => 
            m.idUser._id === selectedMember.idUser._id 
              ? { ...m, role: "admin2" }
              : m
          )
        );
        
        // Update local conversation state
        conversation.admin2 = selectedMember.idUser;
        
        // Notify parent component with the complete updated conversation
        if (onGroupUpdated) {
          onGroupUpdated(updatedConversation);
        }
        
        handleMenuClose();
      } else {
        setError(response.message || 'Failed to set admin2');
      }
    } catch (error) {
      console.error('Error setting admin2:', error);
      setError('Failed to set admin2. Please try again.');
    } finally {
      setActionLoading(false);
      setConfirmSetAdmin2Open(false);
    }
  };

  const handleRemoveAdmin2 = async () => {
    try {
      setActionLoading(true);
      console.log('Attempting to remove admin2 from conversation:', conversation._id); // Debug log
      
      const token = AuthService.getAccessToken();
      
      if (!token) {
        throw new Error('Không có token xác thực');
      }
      
      const response = await ChatService.removeAdmin2(conversation._id, token);
      
      // Xóa thông tin admin2 từ localStorage
      localStorage.removeItem(`admin2Id_${conversation._id}`);
      localStorage.removeItem('admin2Id');
      
      // Cập nhật conversation với admin2 = null
      const updatedConversation = {
        ...conversation,
        admin2: null
      };
      
      setActionLoading(false);
      setConfirmRemoveAdmin2Open(false);
      
      // Notify parent component
      onGroupUpdated(updatedConversation);
      
      // Hiển thị thông báo thành công
      setSuccess('Đã xóa phó nhóm thành công');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error removing admin2:', error);
      setActionLoading(false);
      
      if (error.response) {
        setError(error.response.data.message || 'Failed to remove admin2. Please try again.');
      } else {
        setError('Failed to remove admin2. Please try again.');
      }
      
      setTimeout(() => setError(''), 5000);
    }
  };

  const handleUpdatePermissions = async (permissions) => {
    if (!conversation) return;
    
    try {
      setActionLoading(true);
      const authToken = AuthService.getAccessToken();
      console.log('Token being used:', authToken); // Debug log
      
      const permissionsResponse = await ChatService.updateGroupPermissions(
        conversation._id,
        permissions,
        authToken
      );
      
      if (permissionsResponse.success) {
        // Create a deep copy of the conversation to modify
        const updatedConversation = JSON.parse(JSON.stringify(conversation));
        
        // Update the permissions in both the local state and the copy
        updatedConversation.permissions = permissions;
        conversation.permissions = permissions;
        
        console.log('Updated conversation with new permissions:', updatedConversation);
        
        // Notify parent component with the complete updated conversation
        if (onGroupUpdated) {
          onGroupUpdated(updatedConversation);
        }
        
        // Force a re-render by updating the state
        setMembers([...members]);
        
        setPermissionsDialogOpen(false);
      } else {
        setError(permissionsResponse.message || 'Failed to update permissions');
      }
    } catch (error) {
      console.error('Error updating permissions:', error);
      setError('Failed to update permissions. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveMember = async () => {
    if (!selectedMember || actionLoading) return;

    try {
      setActionLoading(true);
      const token = AuthService.getAccessToken();
      if (!token) {
        setError('You are not authenticated. Please log in again.');
        return;
      }

      // Store member info before removal
      const memberToRemove = selectedMember;
      
      // Close the menu first
      handleMenuClose();

      // Clear any existing error before attempting removal
      setError('');

      console.log('Removing member:', memberToRemove.idUser.name, 'with ID:', memberToRemove.idUser._id);
      console.log('Conversation before removal:', conversation);

      // Gọi API để xóa thành viên
      try {
        const response = await ChatService.removeMemberFromGroup(
          conversation._id,
          memberToRemove.idUser._id,
          token
        );

        console.log('Remove member API response:', response);

        // Update members list immediately
        setMembers(prevMembers => 
          prevMembers.filter(m => m.idUser._id !== memberToRemove.idUser._id)
        );
        
        // Update conversation if available in response
        if (response?.conversation) {
          if (onGroupUpdated) {
            onGroupUpdated(response.conversation);
          }
        }
        
        // Notify parent component about member removal
        if (onMemberRemoved) {
          onMemberRemoved(memberToRemove, response?.conversation);
        }

        // Emit socket event với đầy đủ thông tin
        try {
          const socketData = {
            conversationId: conversation._id,
            memberId: memberToRemove.idUser._id,
            memberName: memberToRemove.idUser.name,
            removedBy: currentUser._id,
            removedByName: currentUser.name,
            groupName: conversation.name || 'Group Chat',
            timestamp: new Date().toISOString()
          };
          
          console.log('Emitting member_removed_from_group with data:', socketData);
          
          // Emit socket event
          SocketService.emitMemberRemovedFromGroup(socketData);
          
          // Đảm bảo conversation được cập nhật cho tất cả thành viên
          SocketService.socket.emit('update_conversation_list', {
            conversation: response?.conversation || conversation,
            action: 'member_removed',
            timestamp: new Date().toISOString()
          });
          
          console.log('Successfully emitted member_removed_from_group event');
        } catch (socketError) {
          console.error('Error emitting socket event:', socketError);
          // Không cần hiển thị lỗi socket cho người dùng vì API đã thành công
        }
      } catch (apiError) {
        console.error('Error from API when removing member:', apiError);
        if (apiError.response?.status === 400 || apiError.response?.status === 403) {
          setError(apiError.response.data.message || 'Không thể xóa thành viên. Vui lòng thử lại.');
        } else {
          setError('Có lỗi xảy ra khi xóa thành viên. Vui lòng thử lại sau.');
        }
        throw apiError; // Re-throw để không thực hiện code phía dưới nếu API lỗi
      }

    } catch (error) {
      console.error('Error in handleRemoveMember:', error);
      // Lỗi đã được xử lý ở try-catch bên trong
    } finally {
      setActionLoading(false);
    }
  };

  const handleLeaveGroup = async () => {
    if (!conversation || !currentUser) return;
    
    try {
      setActionLoading(true);
      const token = localStorage.getItem('accessToken');
      
      if (!token) {
        setError('No authentication token found. Please log in again.');
        return;
      }
      
      // Emit socket event for real-time updates
      SocketService.leaveGroup(conversation._id, currentUser._id);
      
      const response = await ChatService.leaveGroup(conversation._id, token);
      
      if (response.success) {
        // Close the dialog first
        handleClose();
        
        // Notify parent component
        if (onGroupLeft) {
          onGroupLeft(conversation._id);
        }
      } else {
        setError(response.message || 'Failed to leave group');
      }
    } catch (error) {
      console.error('Error leaving group:', error);
      setError('Failed to leave group. Please try again.');
    } finally {
      setActionLoading(false);
      setConfirmLeaveOpen(false);
    }
  };

  const handleDeleteGroup = async () => {
    if (!conversation) return;
    
    try {
      setActionLoading(true);
      const token = AuthService.getAccessToken();
      if (!token) {
        setError('You are not authenticated. Please log in again.');
        return;
      }
      
      console.log('Token being used:', token); // Debug log
      
      const response = await ChatService.deleteGroup(
        conversation._id,
        token
      );
      
      if (response.success) {
        // Notify parent component
        if (onGroupDeleted) {
          onGroupDeleted(conversation._id);
        }
        
        handleClose();
      } else {
        setError(response.message || 'Failed to delete group');
      }
    } catch (error) {
      console.error('Error deleting group:', error);
      if (error.response) {
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
      }
      if (error.message === 'No token provided') {
        setError('You are not authenticated. Please log in again.');
      } else {
        setError('Failed to delete group. Please try again.');
      }
    } finally {
      setActionLoading(false);
      setConfirmDeleteOpen(false);
    }
  };

  const handleAddMembers = () => {
    setAddMembersDialogOpen(true);
  };

  const handleMembersAdded = (updatedConversation) => {
    // Close the add members dialog
    setAddMembersDialogOpen(false);
    
    // Update the conversation and members list
    if (updatedConversation) {
      // Find the newly added members by comparing with current members
      const currentMemberIds = members.map(m => m.idUser._id);
      const newMembers = updatedConversation.members.filter(
        m => !currentMemberIds.includes(m.idUser._id || m.idUser)
      );
      
      console.log('New members added:', newMembers);
      
      // Emit socket events for each new member added
      if (newMembers.length > 0 && conversation._id) {
        // Thông báo cho tất cả thành viên trong nhóm về việc có thành viên mới
        console.log('📣 Thông báo cho tất cả thành viên trong nhóm về thành viên mới');
        
        // Thông báo cho toàn bộ nhóm về sự thay đổi
        SocketService.socket.emit('group_updated', {
          _id: updatedConversation._id,
          name: updatedConversation.name,
          type: updatedConversation.type,
          avatar: updatedConversation.avatar,
          members: updatedConversation.members,
          admin: updatedConversation.admin,
          admin2: updatedConversation.admin2,
          lastMessage: updatedConversation.lastMessage
        });
        
        // Thông báo cho từng thành viên mới
        newMembers.forEach(member => {
          const memberId = member.idUser._id || member.idUser;
          console.log('🔔 Emit sự kiện member_added cho:', memberId);
          
          // Emit socket event cho thành viên mới
          SocketService.socket.emit('member_added', { 
            conversation: updatedConversation, 
            member: member
          });
        });
      }
      
      // Update the conversation in parent components
      if (onGroupUpdated) {
        onGroupUpdated(updatedConversation);
      }
      
      // Refresh the members list
      prepareData();
    }
  };

  const handleClose = () => {
    setError('');
    setMenuAnchorEl(null);
    setSelectedMember(null);
    setConfirmLeaveOpen(false);
    setConfirmDeleteOpen(false);
    setConfirmSetAdmin2Open(false);
    setConfirmRemoveAdmin2Open(false);
    setPermissionsDialogOpen(false);
    onClose();
  };

  return (
    <>
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Group Members</Typography>
            <IconButton onClick={handleClose} disabled={actionLoading}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {loading ? (
            <Box display="flex" justifyContent="center" p={3}>
              <CircularProgress />
            </Box>
          ) : (
            <List>
              {members.map((member) => (
                <ListItem key={member.idUser._id}>
                  <ListItemAvatar>
                    <Box sx={{ position: 'relative' }}>
                      <Avatar src={member.idUser.avatar}>
                        {!member.idUser.avatar && member.idUser.name?.[0]}
                      </Avatar>
                      
                      {/* Biểu tượng chìa khóa vàng cho admin */}
                      {member.idUser._id === (conversation.admin?._id || conversation.admin) && (
                        <Box 
                          sx={{ 
                            position: 'absolute', 
                            top: -5, 
                            left: -5, 
                            bgcolor: 'background.paper',
                            borderRadius: '50%',
                            padding: '2px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <KeyIcon sx={{ fontSize: 14, color: '#FFD700' }} /> {/* Màu vàng */}
                        </Box>
                      )}
                      
                      {/* Biểu tượng chìa khóa bạc cho admin2 */}
                      {member.idUser._id === (conversation.admin2?._id || conversation.admin2) && (
                        <Box 
                          sx={{ 
                            position: 'absolute', 
                            top: -5, 
                            left: -5, 
                            bgcolor: 'background.paper',
                            borderRadius: '50%',
                            padding: '2px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <VpnKeyIcon sx={{ fontSize: 14, color: '#C0C0C0' }} /> {/* Màu bạc */}
                        </Box>
                      )}
                    </Box>
                  </ListItemAvatar>
                  <ListItemText
                    primary={member.idUser.name}
                    secondary={
                      member.idUser._id === (conversation.admin?._id || conversation.admin)
                        ? "Admin"
                        : member.idUser._id === (conversation.admin2?._id || conversation.admin2)
                        ? "Phó nhóm"
                        : "Thành viên"
                    }
                  />
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      onClick={(e) => handleMenuOpen(e, member)}
                      disabled={actionLoading}
                    >
                      <MoreVertIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          )}
          
          {error && (
            <Typography color="error" variant="body2" sx={{ mt: 2 }}>
              {error}
            </Typography>
          )}
          
          <Divider sx={{ my: 2 }} />
          
          <Box sx={{ mt: 2 }}>
            {isAdmin && (
              <>
                <Button
                  variant="outlined"
                  color="primary"
                  startIcon={<PersonAddIcon />}
                  onClick={handleAddMembers}
                  fullWidth
                  sx={{ mb: 1 }}
                >
                  Thêm thành viên
                </Button>
                <Button
                  variant="outlined"
                  color="primary"
                  startIcon={<EditIcon />}
                  onClick={() => setPermissionsDialogOpen(true)}
                  fullWidth
                  sx={{ mb: 1 }}
                >
                  Quản lý quyền
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={() => setConfirmDeleteOpen(true)}
                  fullWidth
                >
                  Xóa nhóm
                </Button>
              </>
            )}
            {isAdmin2 && !isAdmin && (
              <Button
                variant="outlined"
                color="primary"
                startIcon={<PersonAddIcon />}
                onClick={handleAddMembers}
                fullWidth
                sx={{ mb: 1 }}
              >
                Add Members
              </Button>
            )}
            {!isAdmin && !isAdmin2 && (
              <Button
                variant="outlined"
                color="error"
                startIcon={<ExitToAppIcon />}
                onClick={() => setConfirmLeaveOpen(true)}
                fullWidth
              >
                Rời nhóm
              </Button>
            )}
          </Box>
        </DialogContent>
      </Dialog>
      
      {/* Member options menu */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
      >
        {/* Admin options */}
        {isAdmin && selectedMember && currentUser._id !== selectedMember.idUser._id && (
          <>
            {selectedMember.role !== "admin2" && (
              <MenuItem onClick={() => setConfirmSetAdmin2Open(true)} disabled={actionLoading}>
                <ListItemIcon>
                  <EditIcon fontSize="small" />
                </ListItemIcon>
                 Thêm phó nhóm
              </MenuItem>
            )}
            {selectedMember.role === "admin2" && (
              <MenuItem onClick={() => setConfirmRemoveAdmin2Open(true)} disabled={actionLoading}>
                <ListItemIcon>
                  <EditIcon fontSize="small" />
                </ListItemIcon>
                Xóa phó nhóm
              </MenuItem>
            )}
            <MenuItem onClick={handleRemoveMember} disabled={actionLoading}>
              <ListItemIcon>
                <DeleteIcon fontSize="small" />
              </ListItemIcon>
              Xóa thành viên
            </MenuItem>
          </>
        )}

        {/* Admin2 options */}
        {isAdmin2 && !isAdmin && selectedMember && currentUser._id !== selectedMember.idUser._id && (
          <>
            {/* Admin2 can't remove admin or other admin2 */}
            {selectedMember.role !== "admin" && selectedMember.role !== "admin2" && (
              <MenuItem onClick={handleRemoveMember} disabled={actionLoading}>
                <ListItemIcon>
                  <DeleteIcon fontSize="small" />
                </ListItemIcon>
                Xóa thành viên
              </MenuItem>
            )}
          </>
        )}
        
        {/* Regular member options */}
        {!isAdmin && !isAdmin2 && selectedMember && currentUser._id === selectedMember.idUser._id && (
          <MenuItem onClick={() => setConfirmLeaveOpen(true)} disabled={actionLoading}>
            <ListItemIcon>
              <ExitToAppIcon fontSize="small" />
            </ListItemIcon>
            Rời nhóm
          </MenuItem>
        )}
      </Menu>
      
      {/* Confirm dialogs */}
      <Dialog open={confirmSetAdmin2Open} onClose={() => setConfirmSetAdmin2Open(false)}>
        <DialogTitle>Thêm phó nhóm</DialogTitle>
        <DialogContent>
          <Typography>Bạn có chắc muốn đặt {selectedMember?.idUser?.name} là phó nhóm?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmSetAdmin2Open(false)} disabled={actionLoading}>
            Cancel
          </Button>
          <Button 
            onClick={handleSetAdmin2} 
            color="primary" 
            variant="contained"
            disabled={actionLoading}
          >
            {actionLoading ? <CircularProgress size={24} /> : 'Thêm phó nhóm'}
          </Button>
        </DialogActions>
      </Dialog>
      
      <Dialog open={confirmRemoveAdmin2Open} onClose={() => setConfirmRemoveAdmin2Open(false)}>
        <DialogTitle>Xóa phó nhóm</DialogTitle>
        <DialogContent>
          <Typography>Bạn có chắc muốn xóa {selectedMember?.idUser?.name} là phó nhóm?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmRemoveAdmin2Open(false)} disabled={actionLoading}>
            Cancel
          </Button>
          <Button 
            onClick={handleRemoveAdmin2} 
            color="primary" 
            variant="contained"
            disabled={actionLoading}
          >
            {actionLoading ? <CircularProgress size={24} /> : 'Xóa phó nhóm'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Permissions dialog */}
      <Dialog open={permissionsDialogOpen} onClose={() => setPermissionsDialogOpen(false)}>
        <DialogTitle>Quyền nhóm</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  defaultChecked={conversation?.permissions?.changeName}
                  onChange={(e) => handleUpdatePermissions({
                    ...conversation.permissions,
                    changeName: e.target.checked
                  })}
                />
              }
              label="Cho phép thay đổi tên nhóm"
            />
            <FormControlLabel
              control={
                <Switch
                  defaultChecked={conversation?.permissions?.changeAvatar}
                  onChange={(e) => handleUpdatePermissions({
                    ...conversation.permissions,
                    changeAvatar: e.target.checked
                  })}
                />
              }
              label="Cho phép thay đổi ảnh avatar"
            />
            <FormControlLabel
              control={
                <Switch
                  defaultChecked={conversation?.permissions?.addMembers}
                  onChange={(e) => handleUpdatePermissions({
                    ...conversation.permissions,
                    addMembers: e.target.checked
                  })}
                />
              }
              label="Cho phép thêm thành viên"
            />
            <FormControlLabel
              control={
                <Switch
                  defaultChecked={conversation?.permissions?.removeMembers}
                  onChange={(e) => handleUpdatePermissions({
                    ...conversation.permissions,
                    removeMembers: e.target.checked
                  })}
                />
              }
              label="Cho phép xóa thành viên"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPermissionsDialogOpen(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Confirm leave dialog */}
      <Dialog open={confirmLeaveOpen} onClose={() => setConfirmLeaveOpen(false)}>
        <DialogTitle>Rời nhóm</DialogTitle>
        <DialogContent>
          <Typography>Bạn có chắc chắn muốn rời nhóm này không?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmLeaveOpen(false)} disabled={actionLoading}>
            Cancel
          </Button>
          <Button 
            onClick={handleLeaveGroup} 
            color="error" 
            variant="contained"
            disabled={actionLoading}
          >
            {actionLoading ? <CircularProgress size={24} /> : 'Leave'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Confirm delete dialog */}
      <Dialog open={confirmDeleteOpen} onClose={() => setConfirmDeleteOpen(false)}>
        <DialogTitle>Delete Group</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this group? This action cannot be undone.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDeleteOpen(false)} disabled={actionLoading}>
            Cancel
          </Button>
          <Button 
            onClick={handleDeleteGroup} 
            color="error" 
            variant="contained"
            disabled={actionLoading}
          >
            {actionLoading ? <CircularProgress size={24} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Add members dialog */}
      {conversation && (
        <AddGroupMembersDialog
          open={addMembersDialogOpen}
          onClose={() => setAddMembersDialogOpen(false)}
          conversation={conversation}
          onMembersAdded={handleMembersAdded}
        />
      )}
    </>
  );
};

export default GroupMembersDialog;
