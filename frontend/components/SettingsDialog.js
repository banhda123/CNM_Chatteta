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
  Snackbar,
  Tabs,
  Tab,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Divider
} from '@mui/material';
import { updateApiUrl, getApiUrl } from '../config/constants';
import { useLanguage } from '../contexts/LanguageContext';

const SettingsDialog = ({ visible, onClose }) => {
  const { language, changeLanguage, t } = useLanguage();
  const [serverUrl, setServerUrl] = useState('http://192.168.100.163:4000');
  const [isLoading, setIsLoading] = useState(false);
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertSeverity, setAlertSeverity] = useState('info');
  const [activeTab, setActiveTab] = useState(0);

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

  const handleSaveServer = async () => {
    try {
      setIsLoading(true);
      
      // Kiểm tra URL hợp lệ
      if (!serverUrl.startsWith('http://') && !serverUrl.startsWith('https://')) {
        showAlert(t('serverUrlFormatError'));
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
          throw new Error(t('connectionFailed'));
        }
      } catch (error) {
        console.warn('Server connection test failed:', error);
        // Hiển thị cảnh báo nhưng vẫn cho phép lưu
        if (window.confirm(t('connectionFailedConfirm'))) {
          await updateApiUrl(serverUrl);
          showAlert(t('serverConfigSaved'), 'success');
          setIsLoading(false);
          onClose();
        } else {
          setIsLoading(false);
        }
        return;
      }

      // Lưu URL
      await updateApiUrl(serverUrl);
      showAlert(t('serverConfigSaved'), 'success');
      setIsLoading(false);
      onClose();
    } catch (error) {
      console.error('Error saving server URL:', error);
      showAlert(t('serverConfigError'));
      setIsLoading(false);
    }
  };

  const handleChangeLanguage = (event) => {
    const newLanguage = event.target.value;
    changeLanguage(newLanguage);
    showAlert(t('languageChanged'), 'success');
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  return (
    <>
      <Dialog 
        open={visible} 
        onClose={onClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{t('settings')}</DialogTitle>
        
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label={t('language')} />
          <Tab label={t('serverConfig')} />
        </Tabs>
        
        <DialogContent>
          {activeTab === 0 && (
            <Box sx={{ mt: 2 }}>
              <FormControl component="fieldset">
                <FormLabel component="legend">{t('language')}</FormLabel>
                <RadioGroup
                  aria-label="language"
                  name="language"
                  value={language}
                  onChange={handleChangeLanguage}
                >
                  <FormControlLabel value="vi" control={<Radio />} label={t('vietnamese')} />
                  <FormControlLabel value="en" control={<Radio />} label={t('english')} />
                </RadioGroup>
              </FormControl>
              
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                {t('languageChangeInfo')}
              </Typography>
            </Box>
          )}
          
          {activeTab === 1 && (
            <Box sx={{ mt: 2 }}>
              <TextField
                label={t('serverUrl')}
                variant="outlined"
                fullWidth
                value={serverUrl}
                onChange={(e) => setServerUrl(e.target.value)}
                placeholder="http://192.168.100.163:4000"
                margin="normal"
                disabled={isLoading}
              />
              
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 2 }}>
                {t('serverUrlHelp')}<br />
                {t('yourIpAddress')}: <b>192.168.100.163</b><br />
                {t('example')}: http://192.168.100.163:4000
              </Typography>
              
              <Button
                variant="outlined"
                color="primary"
                onClick={handleSaveServer}
                disabled={isLoading}
                startIcon={isLoading ? <CircularProgress size={20} /> : null}
                sx={{ mt: 1 }}
              >
                {t('testConnection')}
              </Button>
            </Box>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button 
            onClick={onClose} 
            disabled={isLoading}
            color="inherit"
          >
            {t('close')}
          </Button>
          
          {activeTab === 1 && (
            <Button 
              onClick={handleSaveServer} 
              disabled={isLoading}
              color="primary"
              variant="contained"
              startIcon={isLoading ? <CircularProgress size={20} /> : null}
            >
              {isLoading ? t('saving') : t('save')}
            </Button>
          )}
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

export default SettingsDialog;
