import React, { useState } from 'react';
import { Box, IconButton, Popover, Badge, Tooltip, Typography } from '@mui/material';
import AddReactionIcon from '@mui/icons-material/AddReaction';

// Các biểu tượng cảm xúc
const REACTIONS = [
  { emoji: '👍', name: 'Thích' },
  { emoji: '❤️', name: 'Yêu thích' },
  { emoji: '😆', name: 'Haha' },
  { emoji: '😮', name: 'Wow' },
  { emoji: '😢', name: 'Buồn' },
  { emoji: '😡', name: 'Phẫn nộ' }
];

const MessageReactions = ({ reactions, messageId, currentUserId, onAddReaction, onRemoveReaction }) => {
  // State để quản lý menu cảm xúc
  const [anchorEl, setAnchorEl] = useState(null);
  
  // Kiểm tra nếu reactions là undefined hoặc null
  if (!reactions) {
    reactions = {};
  }
  
  // Tính toán số lượng cảm xúc
  const hasReactions = Object.keys(reactions).length > 0;
  const totalReactions = hasReactions ? 
    Object.values(reactions).reduce((sum, users) => sum + users.length, 0) : 0;
  
  // Kiểm tra người dùng hiện tại đã thả cảm xúc chưa
  const userReaction = hasReactions ? 
    Object.entries(reactions).find(([emoji, users]) => 
      Array.isArray(users) && users.includes(currentUserId)
    )?.[0] : null;
  
  // Xử lý click vào nút thả cảm xúc
  const handleReactionClick = (event) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };
  
  // Đóng menu cảm xúc
  const handleClose = () => {
    setAnchorEl(null);
  };
  
  // Xử lý khi chọn cảm xúc
  const handleSelectReaction = (emoji) => {
    if (!reactions[emoji] || !reactions[emoji].includes(currentUserId)) {
      if (onAddReaction) {
        onAddReaction(messageId, emoji);
      }
    } else {
      if (onRemoveReaction) {
        onRemoveReaction(messageId, emoji);
      }
    }
    handleClose();
  };
  
  // Render danh sách cảm xúc đã thả
  const renderReactionsList = () => {
    if (!hasReactions) return null;
    
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          flexWrap: 'wrap',
          gap: 0.5,
          mt: 0.5
        }}
      >
        {Object.entries(reactions).map(([emoji, users]) => {
          if (!Array.isArray(users) || users.length === 0) return null;
          
          return (
            <Tooltip 
              key={emoji} 
              title={`${users.length} người đã thả ${emoji}`}
              arrow
            >
              <Badge 
                badgeContent={users.length} 
                color="primary"
                sx={{ 
                  '& .MuiBadge-badge': { 
                    fontSize: '0.6rem', 
                    height: '16px', 
                    minWidth: '16px',
                    top: -2,
                    right: -2
                  }
                }}
              >
                <Box 
                  sx={{ 
                    fontSize: '1.1rem',
                    bgcolor: users.includes(currentUserId) ? 'rgba(25, 118, 210, 0.1)' : 'transparent',
                    p: 0.5,
                    borderRadius: 1,
                    cursor: 'pointer',
                    '&:hover': {
                      bgcolor: 'rgba(0,0,0,0.05)'
                    }
                  }}
                  onClick={() => handleSelectReaction(emoji)}
                >
                  {emoji}
                </Box>
              </Badge>
            </Tooltip>
          );
        })}
      </Box>
    );
  };
  
  return (
    <Box sx={{ mt: 0.5 }}>
      {/* Hiển thị cảm xúc đã thả */}
      {renderReactionsList()}
      
      {/* Nút thả cảm xúc */}
      <IconButton 
        size="small" 
        onClick={handleReactionClick}
        sx={{ 
          opacity: 0.5, 
          '&:hover': { opacity: 1 },
          color: userReaction ? 'primary.main' : 'inherit'
        }}
      >
        <AddReactionIcon fontSize="small" />
      </IconButton>
      
      {/* Menu cảm xúc */}
      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        slotProps={{
          paper: {
            sx: {
              mt: -1,
              borderRadius: 4
            }
          }
        }}
      >
        <Box 
          sx={{ 
            display: 'flex', 
            p: 1,
            gap: 0.5
          }}
        >
          {REACTIONS.map(reaction => (
            <Box 
              key={reaction.emoji}
              sx={{ 
                fontSize: '1.5rem',
                p: 1,
                borderRadius: 2,
                cursor: 'pointer',
                transition: 'transform 0.2s, background-color 0.2s',
                '&:hover': {
                  bgcolor: 'rgba(0,0,0,0.05)',
                  transform: 'scale(1.2)'
                }
              }}
              onClick={() => handleSelectReaction(reaction.emoji)}
            >
              <Tooltip title={reaction.name} arrow>
                <span>{reaction.emoji}</span>
              </Tooltip>
            </Box>
          ))}
        </Box>
      </Popover>
    </Box>
  );
};

export default MessageReactions; 