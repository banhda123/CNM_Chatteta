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
import ChatService from '../services/ChatService';
import AuthService from '../services/AuthService';
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

  useEffect(() => {
    if (open && conversation) {
      prepareData();
    }
  }, [open, conversation]);

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
    
    // Check if current user is admin or admin2
    const isUserAdmin = conversation.admin && userData && 
      (conversation.admin._id === userData._id || conversation.admin === userData._id);
    const isUserAdmin2 = conversation.admin2 && userData &&
      (conversation.admin2._id === userData._id || conversation.admin2 === userData._id);
    setIsAdmin(isUserAdmin);
    setIsAdmin2(isUserAdmin2);
    
    console.log('=== Role Checks ===');
    console.log('Is user admin:', isUserAdmin);
    console.log('Is user admin2:', isUserAdmin2);
    
    // Set members with correct roles
    if (conversation.members) {
      const updatedMembers = conversation.members.map(member => {
        console.log('Processing member:', member);
        
        // Get the actual user ID (handle both direct ID and nested idUser._id)
        const memberId = member.idUser?._id || member.idUser || member._id;
        console.log('Member ID:', memberId);
        
        // Set role based on admin/admin2 status
        let role = "member";
        
        if (conversation.admin) {
          const adminId = conversation.admin._id || conversation.admin;
          if (memberId === adminId) {
            role = "admin";
          }
        }
        
        if (conversation.admin2) {
          const admin2Id = conversation.admin2._id || conversation.admin2;
          if (memberId === admin2Id) {
            role = "admin2";
          }
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
        // Update local members list
        setMembers(prevMembers => 
          prevMembers.map(m => 
            m.idUser._id === selectedMember.idUser._id 
              ? { ...m, role: "admin2" }
              : m
          )
        );
        
        // Notify parent component
        if (onGroupUpdated) {
          onGroupUpdated(response.conversation);
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
    if (!conversation) return;
    
    try {
      setActionLoading(true);
      const token = AuthService.getAccessToken();
      if (!token) {
        setError('You are not authenticated. Please log in again.');
        return;
      }
      
      console.log('Token being used:', token); // Debug log
      
      const response = await ChatService.removeAdmin2(
        conversation._id,
        token
      );
      
      if (response.success) {
        // Update local members list
        setMembers(prevMembers => 
          prevMembers.map(m => 
            m.role === "admin2"
              ? { ...m, role: "member" }
              : m
          )
        );
        
        // Notify parent component
        if (onGroupUpdated) {
          onGroupUpdated(response.conversation);
        }
        
        handleMenuClose();
      } else {
        setError(response.message || 'Failed to remove admin2');
      }
    } catch (error) {
      console.error('Error removing admin2:', error);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      }
      if (error.message === 'No token provided') {
        setError('You are not authenticated. Please log in again.');
      } else {
        setError('Failed to remove admin2. Please try again.');
      }
    } finally {
      setActionLoading(false);
      setConfirmRemoveAdmin2Open(false);
    }
  };

  const handleUpdatePermissions = async (permissions) => {
    if (!conversation) return;
    
    try {
      setActionLoading(true);
      const token = AuthService.getAccessToken();
      console.log('Token being used:', token); // Debug log
      
      const response = await ChatService.updateGroupPermissions(
        conversation._id,
        permissions,
        token
      );
      
      if (response.success) {
        // Notify parent component
        if (onGroupUpdated) {
          onGroupUpdated(response.conversation);
        }
        
        setPermissionsDialogOpen(false);
      } else {
        setError(response.message || 'Failed to update permissions');
      }
    } catch (error) {
      console.error('Error updating permissions:', error);
      setError('Failed to update permissions. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveMember = async () => {
    if (!selectedMember || !conversation) return;
    
    try {
      setActionLoading(true);
      const userData = AuthService.getUserData();
      const token = userData.token;
      
      const response = await ChatService.removeMemberFromGroup(
        conversation._id,
        selectedMember.idUser._id,
        token
      );
      
      if (response.success) {
        // Update local members list
        setMembers(prevMembers => 
          prevMembers.filter(m => m.idUser._id !== selectedMember.idUser._id)
        );
        
        // Notify parent component
        if (onMemberRemoved) {
          onMemberRemoved(selectedMember, response.conversation);
        }
        
        handleMenuClose();
      } else {
        setError(response.message || 'Failed to remove member');
      }
    } catch (error) {
      console.error('Error removing member:', error);
      setError('Failed to remove member. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleLeaveGroup = async () => {
    if (!conversation) return;
    
    try {
      setActionLoading(true);
      const userData = AuthService.getUserData();
      const token = userData.token;
      
      const response = await ChatService.leaveGroup(
        conversation._id,
        token
      );
      
      if (response.success) {
        // Notify parent component
        if (onGroupLeft) {
          onGroupLeft(conversation._id);
        }
        
        handleClose();
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
      const userData = AuthService.getUserData();
      const token = userData.token;
      
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
      setError('Failed to delete group. Please try again.');
    } finally {
      setActionLoading(false);
      setConfirmDeleteOpen(false);
    }
  };

  const handleAddMembers = () => {
    setAddMembersDialogOpen(true);
  };

  const handleMembersAdded = (updatedConversation) => {
    // Update local members list
    if (updatedConversation && updatedConversation.members) {
      setMembers(updatedConversation.members);
    }
    
    // Notify parent component
    if (onGroupUpdated) {
      onGroupUpdated(updatedConversation);
    }
    
    setAddMembersDialogOpen(false);
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
                    <Avatar src={member.idUser.avatar} />
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
                  Add Members
                </Button>
                <Button
                  variant="outlined"
                  color="primary"
                  startIcon={<EditIcon />}
                  onClick={() => setPermissionsDialogOpen(true)}
                  fullWidth
                  sx={{ mb: 1 }}
                >
                  Manage Permissions
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={() => setConfirmDeleteOpen(true)}
                  fullWidth
                >
                  Delete Group
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
                Leave Group
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
                Set as admin2
              </MenuItem>
            )}
            {selectedMember.role === "admin2" && (
              <MenuItem onClick={() => setConfirmRemoveAdmin2Open(true)} disabled={actionLoading}>
                <ListItemIcon>
                  <EditIcon fontSize="small" />
                </ListItemIcon>
                Remove admin2
              </MenuItem>
            )}
            <MenuItem onClick={handleRemoveMember} disabled={actionLoading}>
              <ListItemIcon>
                <DeleteIcon fontSize="small" />
              </ListItemIcon>
              Remove from group
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
                Remove from group
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
            Leave group
          </MenuItem>
        )}
      </Menu>
      
      {/* Confirm dialogs */}
      <Dialog open={confirmSetAdmin2Open} onClose={() => setConfirmSetAdmin2Open(false)}>
        <DialogTitle>Set Admin2</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to set {selectedMember?.idUser?.name} as admin2?</Typography>
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
            {actionLoading ? <CircularProgress size={24} /> : 'Set Admin2'}
          </Button>
        </DialogActions>
      </Dialog>
      
      <Dialog open={confirmRemoveAdmin2Open} onClose={() => setConfirmRemoveAdmin2Open(false)}>
        <DialogTitle>Remove Admin2</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to remove {selectedMember?.idUser?.name} from admin2 position?</Typography>
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
            {actionLoading ? <CircularProgress size={24} /> : 'Remove Admin2'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Permissions dialog */}
      <Dialog open={permissionsDialogOpen} onClose={() => setPermissionsDialogOpen(false)}>
        <DialogTitle>Group Permissions</DialogTitle>
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
              label="Allow changing group name"
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
              label="Allow changing group avatar"
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
              label="Allow adding members"
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
              label="Allow removing members"
            />
            <FormControlLabel
              control={
                <Switch
                  defaultChecked={conversation?.permissions?.deleteGroup}
                  onChange={(e) => handleUpdatePermissions({
                    ...conversation.permissions,
                    deleteGroup: e.target.checked
                  })}
                />
              }
              label="Allow deleting group"
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
        <DialogTitle>Leave Group</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to leave this group?</Typography>
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
