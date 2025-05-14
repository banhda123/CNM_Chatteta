import React, { useState, useRef } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Card,
  CardMedia,
  CardContent,
  CardActions,
} from '@mui/material';
import {
  Image as ImageIcon,
  VideoLibrary as VideoIcon,
  AudioFile as AudioIcon,
  PictureAsPdf as PdfIcon,
  Description as DocIcon,
  TableChart as ExcelIcon,
  Slideshow as PptIcon,
  InsertDriveFile as FileIcon,
  Add as AddIcon,
  Close as CloseIcon,
  Send as SendIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';

const FileUploadGroup = ({ onFileSelect }) => {
  const [open, setOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState(0);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const fileInputRef = useRef(null);

  // Define file type groups
  const fileGroups = [
    {
      type: 'image',
      label: 'Hình ảnh',
      accept: 'image/*',
      icon: <ImageIcon />,
      multiple: true
    },
    {
      type: 'video',
      label: 'Video',
      accept: 'video/*',
      icon: <VideoIcon />,
      multiple: true
    },
    {
      type: 'audio',
      label: 'Âm thanh',
      accept: 'audio/*',
      icon: <AudioIcon />,
      multiple: true
    },
    {
      type: 'pdf',
      label: 'PDF',
      accept: '.pdf',
      icon: <PdfIcon />,
      multiple: false
    },
    {
      type: 'doc',
      label: 'Word',
      accept: '.doc,.docx,.rtf',
      icon: <DocIcon />,
      multiple: false
    },
    {
      type: 'excel',
      label: 'Excel',
      accept: '.xls,.xlsx,.csv',
      icon: <ExcelIcon />,
      multiple: false
    },
    {
      type: 'presentation',
      label: 'PowerPoint',
      accept: '.ppt,.pptx',
      icon: <PptIcon />,
      multiple: false
    },
    {
      type: 'other',
      label: 'Khác',
      accept: '*',
      icon: <FileIcon />,
      multiple: false
    }
  ];

  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false);
    setSelectedFiles([]);
    setPreviews([]);
  };

  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
    setSelectedFiles([]);
    setPreviews([]);
  };

  const handleFileInputClick = (accept, multiple) => {
    if (fileInputRef.current) {
      fileInputRef.current.accept = accept;
      fileInputRef.current.multiple = multiple;
      fileInputRef.current.click();
    }
  };

  const createFilePreview = async (file) => {
    if (file.type.startsWith('image/')) {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.readAsDataURL(file);
      });
    } else if (file.type.startsWith('video/')) {
      return new Promise((resolve) => {
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.onloadedmetadata = () => {
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          canvas.getContext('2d').drawImage(video, 0, 0);
          resolve(canvas.toDataURL('image/jpeg'));
        };
        video.src = URL.createObjectURL(file);
      });
    }
    return null;
  };

  const handleFileChange = async (event) => {
    const files = Array.from(event.target.files);
    const currentGroup = fileGroups[selectedTab];
    
    setSelectedFiles(files);

    // Create previews for images and videos
    const newPreviews = await Promise.all(
      files.map(file => createFilePreview(file))
    );
    setPreviews(newPreviews);
  };

  const handleRemoveFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSendFiles = () => {
    selectedFiles.forEach(file => {
      const currentGroup = fileGroups[selectedTab];
      onFileSelect(file, currentGroup.type);
    });
    handleClose();
  };

  const renderPreview = (file, preview, index) => {
    const currentGroup = fileGroups[selectedTab];

    return (
      <Grid item xs={12} sm={6} md={4} key={index}>
        <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          {preview ? (
            <CardMedia
              component="img"
              height="140"
              image={preview}
              alt={file.name}
              sx={{ objectFit: 'cover' }}
            />
          ) : (
            <Box
              sx={{
                height: 140,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'action.hover'
              }}
            >
              {currentGroup.icon}
            </Box>
          )}
          <CardContent sx={{ flexGrow: 1 }}>
            <Typography variant="body2" noWrap>
              {file.name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {(file.size / 1024 / 1024).toFixed(2)} MB
            </Typography>
          </CardContent>
          <CardActions>
            <IconButton size="small" onClick={() => handleRemoveFile(index)}>
              <DeleteIcon />
            </IconButton>
          </CardActions>
        </Card>
      </Grid>
    );
  };

  return (
    <>
      <IconButton onClick={handleOpen}>
        <AddIcon />
      </IconButton>

      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Chọn tệp tin</Typography>
            <IconButton onClick={handleClose} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        
        <DialogContent>
          <Tabs
            value={selectedTab}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}
          >
            {fileGroups.map((group, index) => (
              <Tab
                key={group.type}
                icon={group.icon}
                label={group.label}
                value={index}
                sx={{ minWidth: 'auto' }}
              />
            ))}
          </Tabs>

          {/* Upload button */}
          <Box sx={{ mb: 3 }}>
            <Button
              variant="outlined"
              startIcon={fileGroups[selectedTab].icon}
              onClick={() => handleFileInputClick(
                fileGroups[selectedTab].accept,
                fileGroups[selectedTab].multiple
              )}
              fullWidth
            >
              Chọn {fileGroups[selectedTab].label}
            </Button>
          </Box>

          {/* Preview area */}
          {selectedFiles.length > 0 && (
            <Grid container spacing={2}>
              {selectedFiles.map((file, index) => 
                renderPreview(file, previews[index], index)
              )}
            </Grid>
          )}

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            style={{ display: 'none' }}
            multiple={fileGroups[selectedTab].multiple}
          />
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleClose}>
            Hủy
          </Button>
          <Button
            variant="contained"
            startIcon={<SendIcon />}
            onClick={handleSendFiles}
            disabled={selectedFiles.length === 0}
          >
            Gửi {selectedFiles.length > 0 ? `(${selectedFiles.length})` : ''}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default FileUploadGroup; 