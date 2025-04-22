import React from 'react';
import { Box, Typography, CircularProgress, IconButton } from '@mui/material';
import {
  PictureAsPdf as PictureAsPdfIcon,
  Description as DescriptionIcon,
  TableChart as TableChartIcon,
  Slideshow as SlideshowIcon,
  Videocam as VideocamIcon,
  AudioTrack as AudiotrackIcon,
  InsertDriveFile as InsertDriveFileIcon,
  Gif as GifIcon
} from '@mui/icons-material';

const RenderFileMessage = ({ message, handleOpenFile }) => {
  // Đảm bảo có tin nhắn file
  if (!message) {
    return null;
  }
  
  // Kiểm tra nếu có đường dẫn file hoặc tempFileUrl (cho file chưa upload)
  if (!message.fileUrl && !message.fileName) {
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
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            position: 'relative',
            maxWidth: '250px',
          }}
        >
          <Box
            sx={{ 
              position: 'relative',
              width: '100%',
              paddingBottom: '100%',
              minHeight: '150px',
              borderRadius: '8px',
              overflow: 'hidden',
              backgroundColor: 'rgba(0, 0, 0, 0.05)',
            }}
          >
            <Box 
              component="img"
              src={message.fileUrl}
              alt="Image attachment"
              sx={{ 
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                borderRadius: '8px',
                cursor: isSending ? 'default' : 'pointer',
                opacity: isSending ? 0.7 : 1,
                filter: message.isPreview ? 'blur(0.5px)' : 'none'
              }}
              onClick={() => message.fileUrl && !message.isPreview && !isSending && 
                window.open(message.fileUrl.startsWith('http')
                  ? message.fileUrl 
                  : `http://localhost:4000${message.fileUrl.startsWith('/') ? '' : '/'}${message.fileUrl}`, '_blank')}
              onError={(e) => {
                console.error('🚫 Image failed to load:', message.fileUrl);
                e.target.src = 'https://via.placeholder.com/150?text=Image+Error';
              }}
            />
            
            {/* Tải xuống ảnh */}
            {message.fileUrl && !isSending && !message.isPreview && (
              <IconButton 
                size="small" 
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenFile(message.fileUrl, message.fileName || 'image.jpg', message.fileType);
                }}
                sx={{ 
                  position: 'absolute',
                  bottom: 8,
                  right: 8,
                  bgcolor: 'rgba(0,0,0,0.5)',
                  color: 'white',
                  '&:hover': {
                    bgcolor: 'rgba(0,0,0,0.7)'
                  },
                  width: 28,
                  height: 28
                }}
              >
                <Box component="span" sx={{ fontSize: '1rem', fontWeight: 'bold' }}>↓</Box>
              </IconButton>
            )}
          </Box>
          
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
            flexDirection: 'column',
            alignItems: 'center', 
            width: '100%',
            maxWidth: 350,
            overflow: 'hidden'
          }}
        >
          {/* Video display */}
          {message.fileUrl && !isSending && !message.fileUrl.startsWith('temp_file_') ? (
            <Box sx={{ width: '100%', mb: 1, borderRadius: '8px', overflow: 'hidden' }}>
              <video 
                controls 
                width="100%"
                style={{ 
                  borderRadius: '8px',
                  maxHeight: '250px',
                  backgroundColor: '#000',
                }}
              >
                <source 
                  src={message.fileUrl.startsWith('http') 
                    ? message.fileUrl 
                    : `http://localhost:4000${message.fileUrl.startsWith('/') ? '' : '/'}${message.fileUrl}`
                  } 
                  type={message.fileType || "video/mp4"} 
                />
                Video không được hỗ trợ.
              </video>
            </Box>
          ) : (
            <Box
              sx={{ 
                width: '100%',
                height: 150,
                bgcolor: '#222',
                borderRadius: '8px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                mb: 1,
                position: 'relative'
              }}
            >
              <VideocamIcon sx={{ fontSize: 48, color: '#f44336' }} />
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
                    bgcolor: 'rgba(0,0,0,0.6)'
                  }}
                >
                  <CircularProgress size={24} color="inherit" sx={{ color: '#fff' }} />
                </Box>
              )}
            </Box>
          )}
          
          {/* Video info */}
          <Box sx={{ width: '100%', display: 'flex', alignItems: 'center' }}>
            <VideocamIcon fontSize="small" sx={{ mr: 1, color: '#f44336' }} />
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 'medium', wordBreak: 'break-word' }}>
                {message.fileName || "Video"}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {isSending 
                  ? "Đang tải..." 
                  : message.fileUrl && !message.fileUrl.startsWith('temp_file_')
                    ? "Đang phát video" 
                    : "Đang chuẩn bị video..."
                }
              </Typography>
            </Box>
            
            {/* Tải xuống video */}
            {message.fileUrl && !isSending && !message.fileUrl.startsWith('temp_file_') && (
              <Box sx={{ ml: 'auto' }}>
                <IconButton 
                  size="small" 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenFile(message.fileUrl, message.fileName, message.fileType);
                  }}
                  sx={{ color: 'primary.main' }}
                >
                  <Box component="span" sx={{ fontSize: '1.2rem', fontWeight: 'bold' }}>↓</Box>
                </IconButton>
              </Box>
            )}
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
            flexDirection: 'column',
            width: '100%',
            maxWidth: 350,
            overflow: 'hidden'
          }}
        >
          {/* Audio player */}
          {message.fileUrl && !isSending && !message.fileUrl.startsWith('temp_file_') ? (
            <Box sx={{ width: '100%', mb: 1 }}>
              <audio 
                controls 
                style={{ 
                  width: '100%',
                  height: 40,
                  borderRadius: '8px',
                  backgroundColor: '#f5f0ff',
                }}
              >
                <source 
                  src={message.fileUrl.startsWith('http') 
                    ? message.fileUrl 
                    : `http://localhost:4000${message.fileUrl.startsWith('/') ? '' : '/'}${message.fileUrl}`
                  } 
                  type={message.fileType || "audio/mpeg"} 
                />
                Audio không được hỗ trợ.
              </audio>
            </Box>
          ) : (
            <Box
              sx={{ 
                width: '100%',
                height: 60,
                bgcolor: '#f5f0ff',
                borderRadius: '8px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                mb: 1,
                position: 'relative'
              }}
            >
              <AudiotrackIcon sx={{ fontSize: 36, color: '#9c27b0' }} />
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
          )}
          
          {/* Audio info */}
          <Box sx={{ width: '100%', display: 'flex', alignItems: 'center' }}>
            <AudiotrackIcon fontSize="small" sx={{ mr: 1, color: '#9c27b0' }} />
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 'medium', wordBreak: 'break-word' }}>
                {message.fileName || "Audio"}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {isSending 
                  ? "Đang tải..." 
                  : message.fileUrl && !message.fileUrl.startsWith('temp_file_')
                    ? "Đang phát audio" 
                    : "Đang chuẩn bị audio..."
                }
              </Typography>
            </Box>
            
            {/* Tải xuống audio */}
            {message.fileUrl && !isSending && !message.fileUrl.startsWith('temp_file_') && (
              <Box sx={{ ml: 'auto' }}>
                <IconButton 
                  size="small" 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenFile(message.fileUrl, message.fileName, message.fileType);
                  }}
                  sx={{ color: 'primary.main' }}
                >
                  <Box component="span" sx={{ fontSize: '1.2rem', fontWeight: 'bold' }}>↓</Box>
                </IconButton>
              </Box>
            )}
          </Box>
        </Box>
      );
    
    case 'gif':
      return (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            position: 'relative',
            maxWidth: '280px',
          }}
        >
          <Box 
            sx={{
              position: 'relative',
              borderRadius: '12px',
              overflow: 'hidden',
              backgroundColor: 'rgba(0, 0, 0, 0.03)',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
              border: '1px solid rgba(0, 0, 0, 0.08)',
            }}
          >
            <Box 
              component="img"
              src={message.fileUrl}
              alt="GIF"
              sx={{ 
                display: 'block',
                width: '100%',
                maxHeight: '250px',
                objectFit: 'contain',
                borderRadius: '8px',
                cursor: isSending ? 'default' : 'pointer',
                opacity: isSending ? 0.7 : 1,
                bgcolor: 'white'
              }}
              onClick={() => message.fileUrl && !isSending && 
                window.open(message.fileUrl, '_blank')}
              onError={(e) => {
                console.error('🚫 GIF failed to load:', message.fileUrl);
                e.target.src = 'https://via.placeholder.com/150?text=GIF+Error';
              }}
            />
            
            {/* Ghi chú nếu có */}
            {message.content && message.content.trim() !== '' && (
              <Box sx={{ 
                p: 1.5, 
                borderTop: '1px solid rgba(0, 0, 0, 0.08)',
                bgcolor: 'white' 
              }}>
                <Typography variant="body2">
                  {message.content}
                </Typography>
              </Box>
            )}
            
            {/* Download icon for GIFs */}
            {message.fileUrl && !isSending && !message.fileUrl.startsWith('temp_file_') && (
              <IconButton 
                size="small" 
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenFile(message.fileUrl, message.fileName || 'animation.gif', message.fileType);
                }}
                sx={{ 
                  position: 'absolute',
                  bottom: 8,
                  right: 8,
                  bgcolor: 'rgba(0,0,0,0.5)',
                  color: 'white',
                  '&:hover': {
                    bgcolor: 'rgba(0,0,0,0.7)'
                  },
                  width: 32,
                  height: 32
                }}
              >
                <Box component="span" sx={{ fontSize: '1.1rem', fontWeight: 'bold' }}>↓</Box>
              </IconButton>
            )}
          </Box>
          
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