import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Checkbox,
  Typography,
  Box,
  CircularProgress,
  IconButton,
  InputAdornment
} from '@mui/material';
import { Search as SearchIcon, Close as CloseIcon } from '@mui/icons-material';
import UserService from '../services/UserService';
import ChatService from '../services/ChatService';
import AuthService from '../services/AuthService';

const AddGroupMembersDialog = ({ open, onClose, conversation, onMembersAdded }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [friends, setFriends] = useState([]);
  const [filteredFriends, setFilteredFriends] = useState([]);
  const [selectedFriends, setSelectedFriends] = useState([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');
  const [existingMemberIds, setExistingMemberIds] = useState([]);

  // Fetch friends when dialog opens
  useEffect(() => {
    if (open) {
      fetchFriends();
      prepareExistingMembers();
    }
  }, [open, conversation]);

  // Filter friends based on search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredFriends(friends);
    } else {
      const filtered = friends.filter(friend =>
        friend.idUser.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredFriends(filtered);
    }
  }, [searchQuery, friends]);

  const prepareExistingMembers = () => {
    if (!conversation || !conversation.members) return;
    
    // Extract member IDs to exclude them from the selection
    const memberIds = conversation.members.map(member => 
      member.idUser._id || member.idUser
    );
    setExistingMemberIds(memberIds);
  };

  const fetchFriends = async () => {
    try {
      setLoading(true);
      const userData = AuthService.getUserData();
      if (!userData || !userData._id) {
        throw new Error('User not authenticated');
      }

      const response = await UserService.getAllFriends(userData._id);
      setFriends(response || []);
      setFilteredFriends(response || []);
    } catch (error) {
      console.error('Error fetching friends:', error);
      setError('Failed to load friends list');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFriend = (friendId) => {
    setSelectedFriends(prevSelected => {
      if (prevSelected.includes(friendId)) {
        return prevSelected.filter(id => id !== friendId);
      } else {
        return [...prevSelected, friendId];
      }
    });
  };

  const handleAddMembers = async () => {
    if (selectedFriends.length === 0) {
      setError('Please select at least one friend');
      return;
    }

    try {
      setAdding(true);
      setError('');
      
      const token = AuthService.getAccessToken();
      if (!token) {
        setError('You are not authenticated. Please log in again.');
        return;
      }
      
      console.log('Token being used:', token); // Debug log
      
      const response = await ChatService.addMembersToGroup(
        conversation._id,
        selectedFriends,
        token
      );
      
      if (response.success) {
        onMembersAdded(response.conversation);
        handleClose();
      } else {
        setError(response.message || 'Failed to add members');
      }
    } catch (error) {
      console.error('Error adding members:', error);
      if (error.response) {
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
      }
      if (error.message === 'No token provided') {
        setError('You are not authenticated. Please log in again.');
      } else {
        setError('Failed to add members. Please try again.');
      }
    } finally {
      setAdding(false);
    }
  };

  const handleClose = () => {
    setSearchQuery('');
    setSelectedFriends([]);
    setError('');
    onClose();
  };

  // Filter out friends who are already in the group
  const availableFriends = filteredFriends.filter(friend => 
    !existingMemberIds.includes(friend.idUser._id)
  );

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Add Group Members
        <IconButton
          aria-label="close"
          onClick={handleClose}
          sx={{ position: 'absolute', right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent dividers>
        <TextField
          fullWidth
          placeholder="Search friends"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
            endAdornment: searchQuery ? (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => setSearchQuery('')}>
                  <CloseIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            ) : null
          }}
          sx={{ mb: 2 }}
        />
        
        {loading ? (
          <Box display="flex" justifyContent="center" my={3}>
            <CircularProgress size={40} />
          </Box>
        ) : availableFriends.length === 0 ? (
          <Typography color="text.secondary" align="center" sx={{ my: 2 }}>
            {friends.length === 0 
              ? "You don't have any friends yet. Add friends first."
              : "All your friends are already in this group."}
          </Typography>
        ) : (
          <List sx={{ maxHeight: 300, overflow: 'auto', bgcolor: 'background.paper' }}>
            {availableFriends.map((friend) => (
              <ListItem 
                key={friend.idUser._id}
                dense
                button
                onClick={() => handleToggleFriend(friend.idUser._id)}
                sx={{
                  borderRadius: 1,
                  mb: 0.5,
                  '&:hover': { bgcolor: 'action.hover' },
                  bgcolor: selectedFriends.includes(friend.idUser._id) ? 'action.selected' : 'transparent'
                }}
              >
                <Checkbox
                  edge="start"
                  checked={selectedFriends.includes(friend.idUser._id)}
                  tabIndex={-1}
                  disableRipple
                />
                <ListItemAvatar>
                  <Avatar src={friend.idUser.avatar} alt={friend.idUser.name} />
                </ListItemAvatar>
                <ListItemText 
                  primary={friend.idUser.name}
                  secondary={friend.idUser.phone}
                />
              </ListItem>
            ))}
          </List>
        )}
        
        {error && (
          <Typography color="error" variant="body2" sx={{ mt: 2 }}>
            {error}
          </Typography>
        )}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        <Button 
          onClick={handleAddMembers} 
          color="primary" 
          variant="contained"
          disabled={adding || selectedFriends.length === 0}
        >
          {adding ? <CircularProgress size={24} /> : 'Add Members'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddGroupMembersDialog;
