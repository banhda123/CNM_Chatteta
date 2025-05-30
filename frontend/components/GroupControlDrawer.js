import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Avatar,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Button,
  Drawer,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  CircularProgress,
} from '@mui/material';
import {
  Close as CloseIcon,
  PushPin as PushPinIcon,
  People as PeopleIcon,
  Edit as EditIcon,
  Image as ImageIcon,
  Description as DescriptionIcon,
  Link as LinkIcon,
  DeleteSweep as DeleteSweepIcon,
  ExitToApp as ExitToAppIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';
import ChatService from '../services/ChatService';
import AuthService from '../services/AuthService';

const GroupControlDrawer = ({ 
  open, 
  onClose, 
  conversation, 
  isAdmin,
  isAdmin2,
  onViewPinnedMessages,
  onOpenGroupMembers,
  onEditGroup,
  onLeaveGroup,
  onDeleteGroup,
}) => {
  const [mediaItems, setMediaItems] = useState([]);
  const [files, setFiles] = useState([]);
  const [links, setLinks] = useState([]);
  const [loadingMedia, setLoadingMedia] = useState(false);
  const [showAllMedia, setShowAllMedia] = useState(false);
  
  // Fetch media, files, and links when the drawer opens
  useEffect(() => {
    if (open && conversation) {
      fetchConversationMedia();
    }
  }, [open, conversation]);

  // Function to fetch media from backend
  const fetchConversationMedia = async () => {
    setLoadingMedia(true);
    
    try {
      const token = AuthService.getAccessToken();
      if (!token) {
        console.error('No authentication token found');
        throw new Error('No authentication token');
      }

      // Fetch media (images and videos)
      const mediaResponse = await ChatService.getConversationMedia(conversation._id);
      console.log('Media API Response:', mediaResponse);
      
      // Process media items
      if (mediaResponse && mediaResponse.success && Array.isArray(mediaResponse.media) && mediaResponse.media.length > 0) {
        setMediaItems(mediaResponse.media);
      } else if (mediaResponse && Array.isArray(mediaResponse.media) && mediaResponse.media.length > 0) {
        setMediaItems(mediaResponse.media);
      } else if (Array.isArray(mediaResponse) && mediaResponse.length > 0) {
        setMediaItems(mediaResponse);
      } else {
        console.warn('No media items found in API response');
        setMediaItems([]);
      }
      
      // Fetch other data
      try {
        const filesResponse = await ChatService.getConversationFiles(conversation._id);
        const linksResponse = await ChatService.getConversationLinks(conversation._id);
        
        setFiles(filesResponse && filesResponse.files ? filesResponse.files : 
                (Array.isArray(filesResponse) ? filesResponse : []));
                
        setLinks(linksResponse && linksResponse.links ? linksResponse.links : 
                (Array.isArray(linksResponse) ? linksResponse : []));
      } catch (error) {
        console.error('Error fetching files or links:', error);
        setFiles([]);
        setLinks([]);
      }
    } catch (error) {
      console.error('Error fetching conversation media:', error);
      setMediaItems([]);
    } finally {
      setLoadingMedia(false);
    }
  };

  const handleViewAllMedia = () => {
    setShowAllMedia(true);
  };

  // Simple Media Grid Component using plain HTML/CSS for reliability
  const SimpleMediaGrid = ({ images = [] }) => {
    const imagesToShow = images.length > 0 ? images.map(item => item.fileUrl) : [];
    const displayImages = showAllMedia ? imagesToShow : imagesToShow.slice(0, 8);
    
    if (displayImages.length === 0) {
      return (
        <Box sx={{ p: 2, textAlign: 'center' }}>
          <Typography color="text.secondary">
            Chưa có ảnh/video được chia sẻ trong hội thoại này
          </Typography>
        </Box>
      );
    }
    
    return (
      <div style={{ padding: '8px', maxWidth: '100%', overflowX: 'hidden' }}>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(4, 1fr)', 
          gap: '8px',
          width: '100%'
        }}>
          {displayImages.map((url, index) => (
            <div key={`img-${index}`} style={{ 
              position: 'relative',
              paddingBottom: '100%', /* Creates a square */
              overflow: 'hidden',
              borderRadius: '4px',
              border: '1px solid #e0e0e0'
            }}>
              {url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                <img
                  src={url}
                  alt={`Media ${index+1}`}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    cursor: 'pointer'
                  }}
                  onClick={() => window.open(url, '_blank')}
                  onError={(e) => {
                    e.target.src = '/error-image.png';
                  }}
                />
              ) : url.match(/\.(mp4|mov|avi|webm)$/i) ? (
                <video
                  src={url}
                  controls
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    cursor: 'pointer'
                  }}
                  onClick={e => { e.stopPropagation(); window.open(url, '_blank'); }}
                  autoPlay={false}
                  muted
                  playsInline
                />
              ) : null}
            </div>
          ))}
        </div>
        
        {imagesToShow.length > 8 && !showAllMedia && (
          <Box sx={{ 
            p: 1, 
            textAlign: 'center', 
            borderTop: '1px solid', 
            borderColor: 'divider',
            mt: 1 
          }}>
            <Button 
              fullWidth 
              onClick={handleViewAllMedia}
              sx={{ color: 'text.secondary' }}
            >
              Xem tất cả ({imagesToShow.length})
            </Button>
          </Box>
        )}
      </div>
    );
  };

  const isGroup = conversation?.type === 'group';

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: '85%', sm: 380 },
          bgcolor: 'background.paper',
          height: '100%',
          overflowY: 'auto',
          overflowX: 'hidden'
        }
      }}
    >
      {conversation && (
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          height: '100%', 
          p: 0,
          maxWidth: '100%',
          overflowX: 'hidden'
        }}>
          {/* Header */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            p: 2, 
            borderBottom: '1px solid', 
            borderColor: 'divider',
            maxWidth: '100%',
            overflowX: 'hidden'
          }}>
            <Avatar 
              src={conversation.avatar || ""} 
              sx={{ width: 50, height: 50, mr: 2 }}
            >
              {!conversation.avatar && (conversation.name?.[0] || conversation?.members?.[0]?.idUser?.name?.[0])}
            </Avatar>
            <Box>
              <Typography variant="h6">{conversation.name || conversation?.members?.[0]?.idUser?.name || "Chat cá nhân"}</Typography>
              {isGroup && (
                <Typography variant="body2" color="text.secondary">
                  {conversation.members?.length || 0} thành viên
                </Typography>
              )}
            </Box>
            <IconButton 
              sx={{ ml: 'auto' }} 
              onClick={onClose}
            >
              <CloseIcon />
            </IconButton>
          </Box>
          
          {/* Main content */}
          <Box sx={{ 
            overflow: 'auto', 
            flex: 1,
            maxWidth: '100%',
            overflowX: 'hidden'
          }}>
            {/* Control menu */}
            <List sx={{ width: '100%', py: 0 }}>
              {isGroup && (
                <ListItem 
                  sx={{ borderBottom: '1px solid', borderColor: 'divider', py: 1.5 }}
                  button 
                  component="div"
                  onClick={() => { onClose(); onViewPinnedMessages(); }}
                >
                  <ListItemIcon>
                    <PushPinIcon />
                  </ListItemIcon>
                  <ListItemText primary="Xem tin nhắn đã ghim" />
                </ListItem>
              )}
              {isGroup && (
                <ListItem 
                  sx={{ borderBottom: '1px solid', borderColor: 'divider', py: 1.5 }}
                  button 
                  component="div"
                  onClick={() => { onClose(); onOpenGroupMembers(); }}
                >
                  <ListItemIcon>
                    <PeopleIcon />
                  </ListItemIcon>
                  <ListItemText primary="Thành viên nhóm" />
                </ListItem>
              )}
              {isGroup && isAdmin && (
                <ListItem 
                  sx={{ borderBottom: '1px solid', borderColor: 'divider', py: 1.5 }}
                  button 
                  component="div"
                  onClick={() => { onClose(); onEditGroup(); }}
                >
                  <ListItemIcon>
                    <EditIcon />
                  </ListItemIcon>
                  <ListItemText primary="Chỉnh sửa nhóm" />
                </ListItem>
              )}
            </List>
            
            {/* Ảnh/Video */}
            <Accordion defaultExpanded>
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                sx={{ 
                  borderBottom: '1px solid', 
                  borderColor: 'divider',
                  minHeight: '48px',
                  '& .MuiAccordionSummary-content': {
                    margin: '12px 0'
                  }
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                  <ImageIcon sx={{ mr: 2 }} />
                  <Typography>
                    Ảnh/Video
                  </Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails sx={{ p: 0 }}>
                {loadingMedia ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                    <CircularProgress size={24} />
                  </Box>
                ) : (
                  <SimpleMediaGrid images={mediaItems} />
                )}
              </AccordionDetails>
            </Accordion>
            
            {/* File */}
            <Accordion>
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                sx={{ 
                  borderBottom: '1px solid', 
                  borderColor: 'divider',
                  minHeight: '48px',
                  '& .MuiAccordionSummary-content': {
                    margin: '12px 0'
                  }
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                  <DescriptionIcon sx={{ mr: 2 }} />
                  <Typography>File</Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails sx={{ p: 0 }}>
                {loadingMedia ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                    <CircularProgress size={24} />
                  </Box>
                ) : files.length > 0 ? (
                  <List>
                    {files.map((file, index) => (
                      <ListItem 
                        key={file._id || `file-${index}`} 
                        button
                        onClick={() => file.fileUrl && window.open(file.fileUrl, '_blank')}
                      >
                        <ListItemIcon>
                          <DescriptionIcon />
                        </ListItemIcon>
                        <ListItemText 
                          primary={file.fileName || file.content || `File ${index + 1}`} 
                          secondary={new Date(file.createdAt).toLocaleDateString()} 
                        />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Box sx={{ p: 2, textAlign: 'center' }}>
                    <Typography color="text.secondary">
                      Chưa có File được chia sẻ trong hội thoại này
                    </Typography>
                  </Box>
                )}
              </AccordionDetails>
            </Accordion>
            
            {/* Link */}
            <Accordion>
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                sx={{ 
                  borderBottom: '1px solid', 
                  borderColor: 'divider',
                  minHeight: '48px',
                  '& .MuiAccordionSummary-content': {
                    margin: '12px 0'
                  }
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                  <LinkIcon sx={{ mr: 2 }} />
                  <Typography>Link</Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails sx={{ p: 0, maxWidth: '100%', overflowX: 'hidden' }}>
                {loadingMedia ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                    <CircularProgress size={24} />
                  </Box>
                ) : links.length > 0 ? (
                  <List sx={{ width: '100%', overflowX: 'hidden' }}>
                    {links.map((link, index) => (
                      <ListItem 
                        key={link._id || `link-${index}`} 
                        button 
                        component="a" 
                        href={link.linkUrl || link.content} 
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'flex-start',
                          maxWidth: '100%',
                          overflowX: 'hidden'
                        }}
                      >
                        <Box sx={{ display: 'flex', width: '100%', mb: 1, overflowX: 'hidden' }}>
                          <LinkIcon sx={{ mr: 2, color: 'text.secondary', flexShrink: 0 }} />
                          <Typography 
                            variant="body1" 
                            noWrap
                            sx={{ maxWidth: 'calc(100% - 40px)' }}
                          >
                            {link.content || link.linkTitle || `Link ${index + 1}`}
                          </Typography>
                        </Box>
                        <Typography 
                          variant="body2" 
                          color="primary" 
                          sx={{ ml: 4, maxWidth: 'calc(100% - 32px)' }}
                          noWrap
                        >
                          {link.linkUrl || link.content}
                        </Typography>
                        <Typography 
                          variant="caption" 
                          color="text.secondary"
                          sx={{ ml: 'auto', mt: 1 }}
                        >
                          {new Date(link.createdAt).toLocaleDateString()}
                        </Typography>
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Box sx={{ p: 2, textAlign: 'center' }}>
                    <Typography color="text.secondary">
                      Chưa có Link được chia sẻ trong hội thoại này
                    </Typography>
                  </Box>
                )}
              </AccordionDetails>
            </Accordion>
          </Box>

          {/* Footer với các nút chỉ dành cho nhóm */}
          <Box sx={{ 
            p: 2, 
            borderTop: '1px solid', 
            borderColor: 'divider',
            maxWidth: '100%',
            overflowX: 'hidden'
          }}>
            {isGroup && (
              <Button
                variant="outlined"
                color="error"
                fullWidth
                startIcon={<ExitToAppIcon />}
                onClick={() => {
                  onClose();
                  onLeaveGroup();
                }}
                sx={{ mb: isAdmin ? 2 : 0 }}
              >
                Rời nhóm
              </Button>
            )}
            {isGroup && isAdmin && (
              <Button
                variant="contained"
                color="error"
                fullWidth
                startIcon={<DeleteIcon />}
                onClick={() => {
                  onClose();
                  onDeleteGroup();
                }}
              >
                Xóa nhóm
              </Button>
            )}
          </Box>
        </Box>
      )}
    </Drawer>
  );
};

export default GroupControlDrawer; 