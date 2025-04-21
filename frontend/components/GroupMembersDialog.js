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
  MenuItem
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
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [selectedMember, setSelectedMember] = useState(null);
  const [addMembersDialogOpen, setAddMembersDialogOpen] = useState(false);
  const [confirmLeaveOpen, setConfirmLeaveOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
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
    
    // Check if current user is admin
    const isUserAdmin = conversation.admin && userData && 
      conversation.admin._id === userData._id;
    setIsAdmin(isUserAdmin);
    
    // Set members
    if (conversation.members) {
      setMembers(conversation.members);
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
    onClose();
  };

  return (
    <>
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          Group Members
          <IconButton
            aria-label="close"
            onClick={handleClose}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        
        <DialogContent dividers>
          {conversation && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                {conversation.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {members.length} members
              </Typography>
            </Box>
          )}
          
          {isAdmin && (
            <Box sx={{ mb: 2 }}>
              <Button
                variant="outlined"
                startIcon={<PersonAddIcon />}
                onClick={handleAddMembers}
                fullWidth
              >
                Add Members
              </Button>
            </Box>
          )}
          
          <Divider sx={{ my: 1 }} />
          
          {loading ? (
            <Box display="flex" justifyContent="center" my={3}>
              <CircularProgress size={40} />
            </Box>
          ) : members.length === 0 ? (
            <Typography color="text.secondary" align="center" sx={{ my: 2 }}>
              No members found
            </Typography>
          ) : (
            <List sx={{ maxHeight: 300, overflow: 'auto' }}>
              {members.map((member) => (
                <ListItem key={member.idUser._id}>
                  <ListItemAvatar>
                    <Avatar src={member.idUser.avatar} alt={member.idUser.name} />
                  </ListItemAvatar>
                  <ListItemText 
                    primary={
                      <Box component="span" sx={{ display: 'flex', alignItems: 'center' }}>
                        {member.idUser.name}
                        {conversation.admin && conversation.admin._id === member.idUser._id && (
                          <Typography 
                            variant="caption" 
                            color="primary" 
                            sx={{ ml: 1, bgcolor: 'primary.light', color: 'primary.contrastText', px: 1, borderRadius: 1 }}
                          >
                            Admin
                          </Typography>
                        )}
                      </Box>
                    }
                    secondary={member.idUser.phone}
                  />
                  
                  {/* Only show options for other members if admin, or for self */}
                  {((isAdmin && currentUser._id !== member.idUser._id) || 
                    (!isAdmin && currentUser._id === member.idUser._id)) && (
                    <ListItemSecondaryAction>
                      <IconButton edge="end" onClick={(e) => handleMenuOpen(e, member)}>
                        <MoreVertIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  )}
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
            {isAdmin ? (
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={() => setConfirmDeleteOpen(true)}
                fullWidth
              >
                Delete Group
              </Button>
            ) : (
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
        {isAdmin && selectedMember && currentUser._id !== selectedMember.idUser._id && (
          <MenuItem onClick={handleRemoveMember} disabled={actionLoading}>
            <ListItemIcon>
              <DeleteIcon fontSize="small" />
            </ListItemIcon>
            Remove from group
          </MenuItem>
        )}
        
        {!isAdmin && selectedMember && currentUser._id === selectedMember.idUser._id && (
          <MenuItem onClick={() => setConfirmLeaveOpen(true)} disabled={actionLoading}>
            <ListItemIcon>
              <ExitToAppIcon fontSize="small" />
            </ListItemIcon>
            Leave group
          </MenuItem>
        )}
      </Menu>
      
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
