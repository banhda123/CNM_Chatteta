import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Snackbar
} from '@mui/material';
import { updateApiUrl, getApiUrl } from '../config/constants';

const ServerConfigDialog = ({ visible, onClose }) => {
  const [serverUrl, setServerUrl] = useState('http://192.168.100.163:4000');
  const [isLoading, setIsLoading] = useState(false);
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertSeverity, setAlertSeverity] = useState('info');

  useEffect(() => {
    if (visible) {
      loadSavedUrl();
    }
  }, [visible]);

  const loadSavedUrl = async () => {
    try {
      const savedUrl = await getApiUrl();
      if (savedUrl) {
        setServerUrl(savedUrl);
      } else {
        // Mặc định là địa chỉ IP của bạn
        setServerUrl('http://192.168.100.163:4000');
      }
    } catch (error) {
      console.error('Error loading saved URL:', error);
      setServerUrl('http://192.168.100.163:4000');
    }
  };

  const showAlert = (message, severity = 'error') => {
    setAlertMessage(message);
    setAlertSeverity(severity);
    setAlertOpen(true);
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);
      
      // Kiểm tra URL hợp lệ
      if (!serverUrl.startsWith('http://') && !serverUrl.startsWith('https://')) {
        showAlert('URL phải bắt đầu bằng http:// hoặc https://');
        setIsLoading(false);
        return;
      }

      // Kiểm tra kết nối đến server
      try {
        const response = await fetch(`${serverUrl}/user/demo`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (!response.ok) {
          throw new Error('Không thể kết nối đến server');
        }
      } catch (error) {
        console.warn('Server connection test failed:', error);
        // Hiển thị cảnh báo nhưng vẫn cho phép lưu
        if (window.confirm('Không thể kết nối đến server. Bạn vẫn muốn lưu URL này?')) {
          await updateApiUrl(serverUrl);
          showAlert('Đã lưu cấu hình server. Vui lòng khởi động lại ứng dụng để áp dụng thay đổi.', 'success');
          setIsLoading(false);
          onClose();
        } else {
          setIsLoading(false);
        }
        return;
      }

      // Lưu URL
      await updateApiUrl(serverUrl);
      showAlert('Đã lưu cấu hình server. Vui lòng khởi động lại ứng dụng để áp dụng thay đổi.', 'success');
      setIsLoading(false);
      onClose();
    } catch (error) {
      console.error('Error saving server URL:', error);
      showAlert('Không thể lưu cấu hình server');
      setIsLoading(false);
    }
  };

  return (
    <>
      <Dialog 
        open={visible} 
        onClose={onClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Cấu hình Server</DialogTitle>
        
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              label="URL Server (bao gồm port)"
              variant="outlined"
              fullWidth
              value={serverUrl}
              onChange={(e) => setServerUrl(e.target.value)}
              placeholder="http://192.168.100.163:4000"
              margin="normal"
              disabled={isLoading}
            />
            
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 2 }}>
              Nhập địa chỉ IP của máy chạy backend, bao gồm cả port.<br />
              Địa chỉ IP của bạn: <b>192.168.100.163</b><br />
              Ví dụ: http://192.168.100.163:4000
            </Typography>
          </Box>
        </DialogContent>
        
        <DialogActions>
          <Button 
            onClick={onClose} 
            disabled={isLoading}
            color="inherit"
          >
            Hủy
          </Button>
          
          <Button 
            onClick={handleSave} 
            disabled={isLoading}
            color="primary"
            variant="contained"
            startIcon={isLoading ? <CircularProgress size={20} /> : null}
          >
            {isLoading ? 'Đang lưu...' : 'Lưu'}
          </Button>
        </DialogActions>
      </Dialog>
      
      <Snackbar 
        open={alertOpen} 
        autoHideDuration={6000} 
        onClose={() => setAlertOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setAlertOpen(false)} 
          severity={alertSeverity}
          sx={{ width: '100%' }}
        >
          {alertMessage}
        </Alert>
      </Snackbar>
    </>
  );
};

export default ServerConfigDialog;
