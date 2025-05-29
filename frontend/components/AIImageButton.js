import React, { useState } from 'react';
import { IconButton, Menu, MenuItem, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, CircularProgress, Snackbar, Alert, Box, Typography } from '@mui/material';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import ChatService from '../services/ChatService';
import AuthService from '../services/AuthService';
import { getBaseUrl } from '../config/constants'; 

const AIImageButton = ({ conversationId, userId, onImageGenerated, selectedImage, socketId }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [promptDialogOpen, setPromptDialogOpen] = useState(false);
  const [imageSelectDialogOpen, setImageSelectDialogOpen] = useState(false);
  const [transformDialogOpen, setTransformDialogOpen] = useState(false);
  const [imagePromptDialogOpen, setImagePromptDialogOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [transformPrompt, setTransformPrompt] = useState('');
  const [selectedImageForPrompt, setSelectedImageForPrompt] = useState(null);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [uploadedImagePreview, setUploadedImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('info');
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const fileInputRef = React.useRef(null);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleGenerateImage = () => {
    handleClose();
    setPromptDialogOpen(true);
  };

  // Fetch messages with images for selection
  const fetchMessages = async () => {
    if (!conversationId) return;
    
    setLoadingMessages(true);
    try {
      const token = AuthService.getAccessToken();
      if (!token) {
        console.error('No access token found');
        setSnackbarMessage('Bạn chưa đăng nhập');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
        setLoadingMessages(false);
        return;
      }
      const baseUrl = await getBaseUrl();
      const response = await fetch(`${baseUrl}/chat/allmessage/${conversationId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        // Get messages from the response (handle both formats)
        const messagesArray = data.messages || data;
        
        // Filter messages to only include those with images
        const imageMessages = messagesArray.filter(msg => 
          msg.fileUrl && (
            msg.type === 'image' || 
            (msg.fileName && msg.fileName.match(/\.(jpg|jpeg|png|gif|webp)$/i))
          )
        );
        setMessages(imageMessages);
      } else {
        console.error('Failed to fetch messages');
        setSnackbarMessage('Không thể tải tin nhắn');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      setSnackbarMessage('Lỗi khi tải tin nhắn');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setLoadingMessages(false);
    }
  };
  
  const handleSelectImage = () => {
    handleClose();
    fetchMessages();
    setImageSelectDialogOpen(true);
  };
  
  const handleImageSelected = (image) => {
    setImageSelectDialogOpen(false);
    if (!image || !image.fileUrl) {
      setSnackbarMessage('Vui lòng chọn một hình ảnh hợp lệ');
      setSnackbarSeverity('warning');
      setSnackbarOpen(true);
      return;
    }
    
    // Open the prompt dialog for the selected image
    setSelectedImageForPrompt(image);
    setImagePromptDialogOpen(true);
    setTransformPrompt('');
  };
  
  const handleTransformWithPrompt = () => {
    if (!selectedImageForPrompt || !selectedImageForPrompt.fileUrl) {
      setSnackbarMessage('Không tìm thấy hình ảnh đã chọn');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      setImagePromptDialogOpen(false);
      return;
    }
    
    setImagePromptDialogOpen(false);
    setLoading(true);
    
    ChatService.transformImage({
      imageUrl: selectedImageForPrompt.fileUrl,
      conversationId,
      sender: userId,
      socketId,
      prompt: transformPrompt // Pass the prompt to the API
    })
      .then(response => {
        if (response.data && response.data.success) {
          setSnackbarMessage('Hình ảnh đã được biến đổi thành công');
          setSnackbarSeverity('success');
          setSnackbarOpen(true);
          
          // Force refresh messages
          console.log('Refreshing messages to show transformed image...');
          if (onImageGenerated) {
            setTimeout(() => {
              onImageGenerated();
            }, 500); // Small delay to ensure the message is saved on the server
          }
        } else {
          setSnackbarMessage('Không thể biến đổi hình ảnh');
          setSnackbarSeverity('error');
          setSnackbarOpen(true);
        }
      })
      .catch(error => {
        console.error('Error transforming image:', error);
        setSnackbarMessage('Lỗi khi biến đổi hình ảnh');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      })
      .finally(() => {
        setLoading(false);
      });
  };
  
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    // Check if file is an image
    if (!file.type.match('image.*')) {
      setSnackbarMessage('Vui lòng chọn một tệp hình ảnh');
      setSnackbarSeverity('warning');
      setSnackbarOpen(true);
      return;
    }
    
    // Create a preview URL
    const reader = new FileReader();
    reader.onload = (e) => {
      setUploadedImagePreview(e.target.result);
    };
    reader.readAsDataURL(file);
    
    setUploadedImage(file);
  };
  
  const handleTransformImage = () => {
    handleClose();
    // Open the transform dialog with file upload
    setTransformDialogOpen(true);
    setTransformPrompt('');
    setUploadedImage(null);
    setUploadedImagePreview(null);
  };
  
  const handleUploadAndTransform = async () => {
    if (!uploadedImage) {
      setSnackbarMessage('Vui lòng chọn một hình ảnh để biến đổi');
      setSnackbarSeverity('warning');
      setSnackbarOpen(true);
      return;
    }
    
    setLoading(true);
    setTransformDialogOpen(false);
    
    try {
      // First upload the image to get a URL
      const formData = new FormData();
      formData.append('file', uploadedImage);
      formData.append('idConversation', conversationId);
      formData.append('sender', userId);
      formData.append('type', 'image');
      
      const token = AuthService.getAccessToken();
      if (!token) {
        throw new Error('Authentication token not found');
      }
      
      console.log('Uploading image with form data:', {
        fileName: uploadedImage.name,
        fileSize: uploadedImage.size,
        fileType: uploadedImage.type,
        conversationId: conversationId
      });
      
      // Upload the file
      const uploadResponse = await ChatService.uploadFile(formData, token);
      console.log('Upload response:', uploadResponse);
      
      // The response from the backend is the saved message object which includes fileUrl
      if (!uploadResponse || !uploadResponse.fileUrl) {
        console.error('Invalid upload response:', uploadResponse);
        throw new Error('Failed to upload image: Invalid response format');
      }
      
      // Extract the file URL from the response
      const imageUrl = uploadResponse.fileUrl;
      console.log('Image uploaded successfully, URL:', imageUrl);
      
      const transformResponse = await ChatService.transformImage({
        imageUrl,
        conversationId,
        sender: userId,
        socketId,
        prompt: transformPrompt // Pass the prompt if provided
      });
      
      if (transformResponse.data && transformResponse.data.success) {
        setSnackbarMessage('Hình ảnh đã được biến đổi thành công');
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
        
        // Force refresh messages
        console.log('Refreshing messages to show transformed image...');
        if (onImageGenerated) {
          setTimeout(() => {
            onImageGenerated();
          }, 500); // Small delay to ensure the message is saved on the server
        }
      } else {
        throw new Error('Failed to transform image');
      }
    } catch (error) {
      console.error('Error in upload and transform process:', error);
      setSnackbarMessage(`Lỗi: ${error.message}`);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitPrompt = () => {
    if (!prompt.trim()) {
      setSnackbarMessage('Vui lòng nhập mô tả hình ảnh');
      setSnackbarSeverity('warning');
      setSnackbarOpen(true);
      return;
    }
    
    setLoading(true);
    setPromptDialogOpen(false);
    
    ChatService.generateImage({
      prompt,
      conversationId,
      sender: userId,
      socketId
    })
      .then(response => {
        if (response.data && response.data.success) {
          setSnackbarMessage('Hình ảnh đã được tạo thành công');
          setSnackbarSeverity('success');
          setSnackbarOpen(true);
          
          // Force refresh messages
          console.log('Refreshing messages to show new image...');
          if (onImageGenerated) {
            setTimeout(() => {
              onImageGenerated();
            }, 500); // Small delay to ensure the message is saved on the server
          }
        } else {
          setSnackbarMessage('Không thể tạo hình ảnh');
          setSnackbarSeverity('error');
          setSnackbarOpen(true);
        }
      })
      .catch(error => {
        console.error('Error generating image:', error);
        setSnackbarMessage('Lỗi khi tạo hình ảnh');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      })
      .finally(() => {
        setLoading(false);
        setPrompt('');
      });
  };

  return (
    <>
      <Tooltip title="AI Image">
        <IconButton 
          color="primary" 
          onClick={handleClick}
          disabled={loading}
        >
          {loading ? (
            <CircularProgress size={24} />
          ) : (
            <AutoFixHighIcon />
          )}
        </IconButton>
      </Tooltip>
      
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
      >
        <MenuItem onClick={handleGenerateImage}>Tạo hình ảnh mới</MenuItem>
        <MenuItem onClick={handleTransformImage}>Biến đổi hình ảnh</MenuItem>
      </Menu>
      
      {/* Dialog for entering text prompt to generate new image */}
      <Dialog open={promptDialogOpen} onClose={() => setPromptDialogOpen(false)}>
        <DialogTitle>Tạo hình ảnh bằng AI</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Mô tả hình ảnh"
            type="text"
            fullWidth
            variant="outlined"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Ví dụ: Một con mèo đang đội nón, phong cách hoạt hình"
            multiline
            rows={3}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPromptDialogOpen(false)}>Hủy</Button>
          <Button onClick={handleSubmitPrompt} variant="contained">Tạo</Button>
        </DialogActions>
      </Dialog>
      
      {/* Dialog for uploading and transforming an image */}
      <Dialog 
        open={transformDialogOpen} 
        onClose={() => setTransformDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Biến đổi hình ảnh bằng AI</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2, mt: 1 }}>
            <Typography variant="subtitle1" gutterBottom>
              1. Chọn hình ảnh để biến đổi
            </Typography>
            <input
              accept="image/*"
              style={{ display: 'none' }}
              id="raised-button-file"
              type="file"
              onChange={handleFileChange}
              ref={fileInputRef}
            />
            <label htmlFor="raised-button-file">
              <Button 
                variant="outlined" 
                component="span"
                fullWidth
                sx={{ height: 56 }}
              >
                Chọn hình ảnh
              </Button>
            </label>
            
            {uploadedImagePreview && (
              <Box sx={{ mt: 2, textAlign: 'center' }}>
                <img 
                  src={uploadedImagePreview} 
                  alt="Preview" 
                  style={{ 
                    maxWidth: '100%', 
                    maxHeight: '300px',
                    borderRadius: '4px',
                    border: '1px solid #ddd'
                  }} 
                />
              </Box>
            )}
          </Box>
          
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              2. Nhập hướng dẫn cho AI (tùy chọn)
            </Typography>
            <TextField
              margin="dense"
              label="Hướng dẫn biến đổi"
              type="text"
              fullWidth
              variant="outlined"
              value={transformPrompt}
              onChange={(e) => setTransformPrompt(e.target.value)}
              placeholder="Ví dụ: Làm sắc nét hình ảnh, tăng độ phân giải"
              multiline
              rows={2}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTransformDialogOpen(false)}>Hủy</Button>
          <Button 
            onClick={handleUploadAndTransform} 
            variant="contained"
            disabled={!uploadedImage}
          >
            Biến đổi
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Dialog for selecting images from chat history */}
      <Dialog 
        open={imageSelectDialogOpen} 
        onClose={() => setImageSelectDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Chọn hình ảnh từ tin nhắn</DialogTitle>
        <DialogContent>
          {loadingMessages ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : messages.length === 0 ? (
            <Typography align="center" sx={{ py: 3 }}>
              Không tìm thấy hình ảnh nào trong cuộc trò chuyện này.
            </Typography>
          ) : (
            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', 
              gap: 2,
              mt: 2
            }}>
              {messages.map((message) => (
                <Box 
                  key={message._id} 
                  sx={{ 
                    position: 'relative',
                    cursor: 'pointer',
                    borderRadius: 1,
                    overflow: 'hidden',
                    '&:hover': {
                      boxShadow: '0 0 0 2px #1976d2',
                    },
                    height: 150,
                  }}
                  onClick={() => handleImageSelected(message)}
                >
                  <img 
                    src={message.fileUrl} 
                    alt="Chat image" 
                    style={{ 
                      width: '100%', 
                      height: '100%', 
                      objectFit: 'cover' 
                    }} 
                  />
                </Box>
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setImageSelectDialogOpen(false)}>Hủy</Button>
        </DialogActions>
      </Dialog>
      
      {/* Dialog for entering prompt for selected image */}
      <Dialog 
        open={imagePromptDialogOpen} 
        onClose={() => setImagePromptDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Biến đổi hình ảnh đã chọn</DialogTitle>
        <DialogContent>
          {selectedImageForPrompt && selectedImageForPrompt.fileUrl && (
            <Box sx={{ mt: 2, mb: 3, textAlign: 'center' }}>
              <img 
                src={selectedImageForPrompt.fileUrl} 
                alt="Selected image" 
                style={{ 
                  maxWidth: '100%', 
                  maxHeight: '300px',
                  borderRadius: '4px',
                  border: '1px solid #ddd'
                }} 
              />
            </Box>
          )}
          
          <TextField
            autoFocus
            margin="dense"
            label="Hướng dẫn biến đổi"
            type="text"
            fullWidth
            variant="outlined"
            value={transformPrompt}
            onChange={(e) => setTransformPrompt(e.target.value)}
            placeholder="Ví dụ: Làm sắc nét hình ảnh, tăng độ phân giải"
            multiline
            rows={3}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setImagePromptDialogOpen(false)}>Hủy</Button>
          <Button onClick={handleTransformWithPrompt} variant="contained">Biến đổi</Button>
        </DialogActions>
      </Dialog>
      
      <Snackbar 
        open={snackbarOpen} 
        autoHideDuration={6000} 
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setSnackbarOpen(false)} 
          severity={snackbarSeverity}
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
};

export default AIImageButton;
