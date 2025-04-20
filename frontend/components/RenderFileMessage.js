import React from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';
import {
  PictureAsPdf as PictureAsPdfIcon,
  Description as DescriptionIcon,
  TableChart as TableChartIcon,
  Slideshow as SlideshowIcon,
  Videocam as VideocamIcon,
  AudioTrack as AudiotrackIcon,
  InsertDriveFile as InsertDriveFileIcon
} from '@mui/icons-material';

const RenderFileMessage = ({ message, handleOpenFile }) => {
  // Đảm bảo có tin nhắn file
  if (!message || !message.fileUrl) {
    return null;
  }

  // Xử lý trường hợp đang tải
  const isSending = message.status === 'sending';
  
  // Render dựa vào loại file
  switch (message.type) {
    case 'image':
      return (
        <Box 
          sx={{
            position: 'relative',
            width: 'fit-content'
          }}
        >
          <Box 
            component="img"
            src={message.fileUrl}
            alt="Image attachment"
            sx={{ 
              maxWidth: '100%',
              maxHeight: '200px',
              borderRadius: '8px',
              cursor: isSending ? 'default' : 'pointer',
              opacity: isSending ? 0.7 : 1,
              filter: message.isPreview ? 'blur(0.5px)' : 'none'
            }}
            onClick={() => message.fileUrl && !message.isPreview && !isSending && 
              window.open(message.fileUrl, '_blank')}
            onError={(e) => {
              console.error('🚫 Image failed to load:', message.fileUrl);
              e.target.src = 'https://via.placeholder.com/150?text=Image+Error';
            }}
          />
          {isSending && (
            <Box 
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                backgroundColor: 'rgba(0,0,0,0.3)',
                borderRadius: '50%',
                width: 40,
                height: 40,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <CircularProgress size={24} color="inherit" />
            </Box>
          )}
        </Box>
      );
    
    case 'pdf':
      return (
        <Box
          sx={{ 
            bgcolor: 'rgba(0,0,0,0.05)',
            p: 1.5,
            borderRadius: '8px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            cursor: isSending ? 'default' : 'pointer',
            opacity: isSending ? 0.7 : 1,
            '&:hover': {
              bgcolor: !isSending ? 'rgba(0,0,0,0.1)' : 'rgba(0,0,0,0.05)'
            },
            maxWidth: 300
          }}
          onClick={() => message.fileUrl && !isSending && 
            handleOpenFile(message.fileUrl, message.fileName, message.fileType)}
        >
          {/* Preview box - tạo khung giả lập document */}
          <Box 
            sx={{
              width: '100%',
              height: 120,
              bgcolor: '#f5f5f5',
              border: '1px solid #e0e0e0',
              borderRadius: '4px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              mb: 1,
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <PictureAsPdfIcon fontSize="large" sx={{ color: '#f44336', fontSize: 48 }} />
            {isSending && (
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  bgcolor: 'rgba(255,255,255,0.7)'
                }}
              >
                <CircularProgress size={24} />
              </Box>
            )}
          </Box>
          
          {/* File information */}
          <Box sx={{ width: '100%' }}>
            <Typography variant="body2" sx={{ fontWeight: 'medium', wordBreak: 'break-word' }}>
              {message.fileName || "PDF Document"}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {isSending ? "Đang tải..." : "Nhấn để mở tài liệu PDF"}
            </Typography>
          </Box>
        </Box>
      );
    
    case 'doc':
      return (
        <Box
          sx={{ 
            bgcolor: 'rgba(0,0,0,0.05)',
            p: 1.5,
            borderRadius: '8px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            cursor: isSending ? 'default' : 'pointer',
            opacity: isSending ? 0.7 : 1,
            '&:hover': {
              bgcolor: !isSending ? 'rgba(0,0,0,0.1)' : 'rgba(0,0,0,0.05)'
            },
            maxWidth: 300
          }}
          onClick={() => message.fileUrl && !isSending && 
            handleOpenFile(message.fileUrl, message.fileName, message.fileType)}
        >
          {/* Preview box */}
          <Box 
            sx={{
              width: '100%',
              height: 120,
              bgcolor: '#f0f8ff',
              border: '1px solid #e0e0e0',
              borderRadius: '4px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              mb: 1,
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <DescriptionIcon fontSize="large" sx={{ color: '#2196f3', fontSize: 48 }} />
            {isSending && (
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  bgcolor: 'rgba(255,255,255,0.7)'
                }}
              >
                <CircularProgress size={24} />
              </Box>
            )}
          </Box>
          
          {/* File information */}
          <Box sx={{ width: '100%' }}>
            <Typography variant="body2" sx={{ fontWeight: 'medium', wordBreak: 'break-word' }}>
              {message.fileName || "Word Document"}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {isSending ? "Đang tải..." : "Nhấn để mở tài liệu Word"}
            </Typography>
          </Box>
        </Box>
      );
      
    case 'excel':
      return (
        <Box
          sx={{ 
            bgcolor: 'rgba(0,0,0,0.05)',
            p: 1.5,
            borderRadius: '8px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            cursor: isSending ? 'default' : 'pointer',
            opacity: isSending ? 0.7 : 1,
            '&:hover': {
              bgcolor: !isSending ? 'rgba(0,0,0,0.1)' : 'rgba(0,0,0,0.05)'
            },
            maxWidth: 300
          }}
          onClick={() => message.fileUrl && !isSending && 
            handleOpenFile(message.fileUrl, message.fileName, message.fileType)}
        >
          {/* Preview box */}
          <Box 
            sx={{
              width: '100%',
              height: 120,
              bgcolor: '#f0fff0',
              border: '1px solid #e0e0e0',
              borderRadius: '4px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              mb: 1,
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <TableChartIcon fontSize="large" sx={{ color: '#4caf50', fontSize: 48 }} />
            {isSending && (
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  bgcolor: 'rgba(255,255,255,0.7)'
                }}
              >
                <CircularProgress size={24} />
              </Box>
            )}
          </Box>
          
          {/* File information */}
          <Box sx={{ width: '100%' }}>
            <Typography variant="body2" sx={{ fontWeight: 'medium', wordBreak: 'break-word' }}>
              {message.fileName || "Excel Spreadsheet"}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {isSending ? "Đang tải..." : "Nhấn để mở bảng tính Excel"}
            </Typography>
          </Box>
        </Box>
      );
      
    case 'presentation':
      return (
        <Box
          sx={{ 
            bgcolor: 'rgba(0,0,0,0.05)',
            p: 1.5,
            borderRadius: '8px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            cursor: isSending ? 'default' : 'pointer',
            opacity: isSending ? 0.7 : 1,
            '&:hover': {
              bgcolor: !isSending ? 'rgba(0,0,0,0.1)' : 'rgba(0,0,0,0.05)'
            },
            maxWidth: 300
          }}
          onClick={() => message.fileUrl && !isSending && 
            handleOpenFile(message.fileUrl, message.fileName, message.fileType)}
        >
          {/* Preview box */}
          <Box 
            sx={{
              width: '100%',
              height: 120,
              bgcolor: '#fff9f0',
              border: '1px solid #e0e0e0',
              borderRadius: '4px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              mb: 1,
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <SlideshowIcon fontSize="large" sx={{ color: '#ff9800', fontSize: 48 }} />
            {isSending && (
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  bgcolor: 'rgba(255,255,255,0.7)'
                }}
              >
                <CircularProgress size={24} />
              </Box>
            )}
          </Box>
          
          {/* File information */}
          <Box sx={{ width: '100%' }}>
            <Typography variant="body2" sx={{ fontWeight: 'medium', wordBreak: 'break-word' }}>
              {message.fileName || "Presentation"}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {isSending ? "Đang tải..." : "Nhấn để mở bài thuyết trình"}
            </Typography>
          </Box>
        </Box>
      );
    
    case 'video':
      return (
        <Box
          sx={{ 
            bgcolor: 'rgba(0,0,0,0.05)',
            p: 1.5,
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            cursor: isSending ? 'default' : 'pointer',
            opacity: isSending ? 0.7 : 1,
            '&:hover': {
              bgcolor: !isSending ? 'rgba(0,0,0,0.1)' : 'rgba(0,0,0,0.05)'
            },
            maxWidth: 300
          }}
          onClick={() => message.fileUrl && !isSending && 
            handleOpenFile(message.fileUrl, message.fileName, message.fileType)}
        >
          <VideocamIcon fontSize="medium" sx={{ mr: 1.5, color: '#f44336' }} />
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
              {message.fileName || "Video"}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {isSending ? "Đang tải..." : "Nhấn để phát video"}
            </Typography>
          </Box>
        </Box>
      );
    
    case 'audio':
      return (
        <Box
          sx={{ 
            bgcolor: 'rgba(0,0,0,0.05)',
            p: 1.5,
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            cursor: isSending ? 'default' : 'pointer',
            opacity: isSending ? 0.7 : 1,
            '&:hover': {
              bgcolor: !isSending ? 'rgba(0,0,0,0.1)' : 'rgba(0,0,0,0.05)'
            },
            maxWidth: 300
          }}
          onClick={() => message.fileUrl && !isSending && 
            handleOpenFile(message.fileUrl, message.fileName, message.fileType)}
        >
          <AudiotrackIcon fontSize="medium" sx={{ mr: 1.5, color: '#9c27b0' }} />
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
              {message.fileName || "Audio"}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {isSending ? "Đang tải..." : "Nhấn để phát audio"}
            </Typography>
          </Box>
        </Box>
      );
    
    // Mặc định cho các loại file khác
    default:
      return (
        <Box
          sx={{ 
            bgcolor: 'rgba(0,0,0,0.05)',
            p: 1.5,
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            cursor: isSending ? 'default' : 'pointer',
            opacity: isSending ? 0.7 : 1,
            '&:hover': {
              bgcolor: !isSending ? 'rgba(0,0,0,0.1)' : 'rgba(0,0,0,0.05)'
            }
          }}
          onClick={() => message.fileUrl && !isSending && 
            handleOpenFile(message.fileUrl, message.fileName, message.fileType)}
        >
          <InsertDriveFileIcon fontSize="medium" sx={{ mr: 1.5, color: '#607d8b' }} />
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
              {message.fileName || "File"}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {isSending ? "Đang tải..." : "Nhấn để tải xuống"}
            </Typography>
          </Box>
        </Box>
      );
  }
};

export default RenderFileMessage; 