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
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import { useLanguage } from '../contexts/LanguageContext';
import LogoutIcon from '@mui/icons-material/Logout';
import AuthService from '../services/AuthService';

const SettingsDialog = ({ visible, onClose }) => {
  const { language, changeLanguage, t } = useLanguage();
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertSeverity, setAlertSeverity] = useState('info');

  const handleChangeLanguage = (event) => {
    const newLanguage = event.target.value;
    changeLanguage(newLanguage);
    setAlertMessage(t('languageChanged'));
    setAlertSeverity('success');
    setAlertOpen(true);
  };

  const handleLogout = async () => {
    await AuthService.logout();
    localStorage.setItem('isLoggedOut', 'true');
    window.location.reload();
  };

  return (
    <Dialog open={visible} onClose={onClose} maxWidth="xs" fullWidth>
        <DialogTitle>{t('settings')}</DialogTitle>
        <DialogContent>
        <List>
          <ListItem>
            <ListItemText primary={t('language')} />
          </ListItem>
          <ListItem>
                <RadioGroup
              row
                  aria-label="language"
                  name="language"
                  value={language}
                  onChange={handleChangeLanguage}
                >
                  <FormControlLabel value="vi" control={<Radio />} label={t('vietnamese')} />
                  <FormControlLabel value="en" control={<Radio />} label={t('english')} />
                </RadioGroup>
          </ListItem>
        </List>
        </DialogContent>
        <DialogActions>
        <Button onClick={onClose} color="inherit">
            {t('close')}
          </Button>
        </DialogActions>
      <Snackbar 
        open={alertOpen} 
        autoHideDuration={3000} 
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
    </Dialog>
  );
};

export default SettingsDialog;
