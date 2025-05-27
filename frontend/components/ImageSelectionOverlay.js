import React from 'react';
import { Box, Typography, IconButton } from '@mui/material';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';

/**
 * Component to add an overlay on images in the chat to allow selecting them for AI transformation
 */
const ImageSelectionOverlay = ({ message, onSelect }) => {
  // Check if the message contains an image
  const isImage = message && message.fileUrl && (
    message.type === 'image' || 
    (message.fileName && message.fileName.match(/\.(jpg|jpeg|png|gif|webp)$/i))
  );

  if (!isImage) return null;

  const handleSelect = (e) => {
    e.stopPropagation();
    if (onSelect) {
      onSelect(message);
    }
  };

  return (
    <Box 
      sx={{
        position: 'absolute',
        top: 0,
        right: 0,
        zIndex: 10,
        m: 0.5
      }}
    >
      <IconButton
        onClick={handleSelect}
        size="small"
        sx={{
          bgcolor: 'rgba(255, 255, 255, 0.8)',
          '&:hover': {
            bgcolor: 'rgba(255, 255, 255, 0.9)',
          },
          boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
        }}
        title="Chọn để biến đổi bằng AI"
      >
        <AutoFixHighIcon fontSize="small" color="primary" />
      </IconButton>
    </Box>
  );
};

export default ImageSelectionOverlay;
