import React from 'react';
import {
  Box,
  Chip,
  Avatar,
  Tooltip
} from '@mui/material';
import defaultAvatar from '../assets/default-avatar.png';

const TaggedUser = ({ user, onRemove }) => {
  return (
    <Tooltip title={user.phone}>
      <Chip
        avatar={
          <Avatar src={user.avatar || defaultAvatar} alt={user.name}>
            {user.name.charAt(0)}
          </Avatar>
        }
        label={user.name}
        onDelete={onRemove}
        sx={{
          m: 0.5,
          '& .MuiChip-avatar': {
            width: 24,
            height: 24
          }
        }}
      />
    </Tooltip>
  );
};

const TaggedUsers = ({ users, onRemove }) => {
  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
      {users.map((user) => (
        <TaggedUser
          key={user.userId}
          user={user}
          onRemove={() => onRemove(user)}
        />
      ))}
    </Box>
  );
};

export default TaggedUsers; 