import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Container,
  Typography,
  Avatar,
  TextField,
  Button,
  IconButton,
  Divider,
  Paper,
  Tabs,
  Tab,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress
} from "@mui/material";
import UserService from "../services/UserService";
import AuthService from "../services/AuthService";
import SocketService from "../services/SocketService";
import { Edit as EditIcon, Save as SaveIcon, PhotoCamera as PhotoCameraIcon } from "@mui/icons-material";
import defaultAvatar from '../assets/default-avatar.png';

const ProfileScreen = () => {
  const [tabValue, setTabValue] = useState(0);
  const [user, setUser] = useState({
    name: "",
    avatar: "",
    status: "",
    birthday: "",
    phone: "",
    email: "",
    about: "",
  });
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState("");
  
  // Avatar change
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [showAvatarDialog, setShowAvatarDialog] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef(null);
  
  // Password change
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  // Form data for editing
  const [formData, setFormData] = useState({
    name: "",
    status: "",
    email: "",
    birthday: "",
    about: ""
  });

  // Get current user ID
  const userData = AuthService.getUserData();
  const userId = userData?._id;

  // Fetch user data when component mounts
  useEffect(() => {
    fetchUserData();
  }, [userId]);

  const fetchUserData = async () => {
    try {
      setLoading(true);

      if (!userId) {
        throw new Error("User ID not found");
      }

      const userData = await UserService.getUserById(userId);
    
    const userInfo = {
        name: userData.name || "Chưa có tên",
      avatar: userData.avatar || "https://via.placeholder.com/150",
        status: userData.status || "Xin chào! Tôi đang sử dụng ứng dụng này",
        birthday: userData.birthday || "Chưa cung cấp",
        phone: userData.phone || "Chưa cung cấp",
        email: userData.email || "Chưa cung cấp",
        about: userData.about || "Chưa có thông tin giới thiệu",
    };
    
    setUser(userInfo);
    setFormData({
      name: userInfo.name,
      status: userInfo.status,
      email: userInfo.email,
      birthday: userInfo.birthday,
      about: userInfo.about
      });
    } catch (error) {
    console.error("Failed to load profile data:", error);
    alert("Không thể tải thông tin hồ sơ");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleEditToggle = () => {
    if (editMode) {
      // Reset form data
      setFormData({
        name: user.name,
        status: user.status,
        email: user.email,
        birthday: user.birthday,
        about: user.about
      });
    }
    setEditMode(!editMode);
  };

  const handleSaveProfile = async () => {
    try {
      setSaveLoading(true);
      setSaveError("");
      setSaveSuccess(false);
      
      const token = AuthService.getAccessToken();
      if (!token) {
        throw new Error("Not authenticated");
      }

      const response = await UserService.updateUserInfo(
        {
          userId,
          ...formData
        },
        token
      );

      if (response.success) {
        setSaveSuccess(true);
        setUser({
          ...user,
          ...formData
        });
        setEditMode(false);
      } else {
        throw new Error(response.message || "Failed to update profile");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      setSaveError(error.message || "Failed to update profile");
    } finally {
      setSaveLoading(false);
    }
  };

  // Avatar handling
  const handleAvatarClick = () => {
    setShowAvatarDialog(true);
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    setAvatarFile(file);
    
    // Create preview URL
    const reader = new FileReader();
    reader.onload = (e) => {
      setAvatarPreview(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };
  
  const handleUploadAvatar = async () => {
    if (!avatarFile) return;
    
    try {
      setUploadingAvatar(true);
      
      const token = AuthService.getAccessToken();
      if (!token) {
        throw new Error("Not authenticated");
      }

      const response = await UserService.changeAvatar(userId, avatarFile, token);
      
      // Update user avatar in state
      setUser({
        ...user,
        avatar: response.avatar
      });
      
      // Update user avatar in localStorage
      const userData = AuthService.getUserData();
      if (userData) {
        userData.avatar = response.avatar;
        AuthService.setUserData(userData);
        
        // Dispatch a custom event to notify other components about the avatar update
        window.dispatchEvent(new CustomEvent('user-avatar-updated', { 
          detail: { avatar: response.avatar }
        }));
        
        // Broadcast avatar update to all connected users via socket
        SocketService.emitAvatarUpdated(userId, response.avatar);
      }
      
      // Close dialog and reset
      setShowAvatarDialog(false);
      setAvatarFile(null);
      setAvatarPreview(null);
      
    } catch (error) {
      console.error("Error uploading avatar:", error);
      alert("Failed to upload avatar");
    } finally {
      setUploadingAvatar(false);
    }
  };

  // Password change
  const handlePasswordInputChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear previous messages
    setPasswordError("");
    setPasswordSuccess(false);
  };
  
  const handleChangePassword = async () => {
    try {
      // Validate
      if (passwordData.newPassword !== passwordData.confirmPassword) {
        setPasswordError("New passwords don't match");
        return;
      }
      
      if (!passwordData.currentPassword || !passwordData.newPassword) {
        setPasswordError("All fields are required");
        return;
      }
      
      setChangingPassword(true);
      setPasswordError("");
      setPasswordSuccess(false);
      
      const token = AuthService.getAccessToken();
      if (!token) {
        throw new Error("Not authenticated");
      }

      const response = await UserService.changeUserPassword(
        {
          userId,
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        },
        token
      );

      if (response.success) {
        setPasswordSuccess(true);
        // Reset form
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: ""
        });
      } else {
        throw new Error(response.message || "Failed to change password");
      }
    } catch (error) {
      console.error("Error changing password:", error);
      setPasswordError(error.message || "Failed to change password");
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Paper elevation={3} sx={{ p: 3, mb: 4, borderRadius: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <Box sx={{ position: 'relative' }}>
                <Avatar 
                  src={user.avatar && typeof user.avatar === 'string' && user.avatar.trim() !== '' ? user.avatar : defaultAvatar} 
                  alt={user.name} 
                  sx={{ 
                    width: 120, 
                    height: 120,
                    border: '4px solid',
                    borderColor: 'primary.main',
                    cursor: 'pointer'
                  }}
                  onClick={handleAvatarClick}
                />
                <IconButton 
                  sx={{ 
                    position: 'absolute', 
                    bottom: 0, 
                    right: 0, 
                    bgcolor: 'background.paper',
                    '&:hover': {
                      bgcolor: 'background.default',
                    }
                  }}
                  onClick={handleAvatarClick}
                >
                  <PhotoCameraIcon />
                </IconButton>
              </Box>
              <Box sx={{ ml: 3, flex: 1 }}>
                <Typography variant="h4" gutterBottom>
                  {user.name}
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  {user.status}
                </Typography>
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
                  {!editMode ? (
                    <Button 
                      variant="outlined" 
                      startIcon={<EditIcon />}
                      onClick={handleEditToggle}
                    >
                      Edit Profile
                    </Button>
                  ) : (
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <Button 
                        variant="outlined" 
                        onClick={handleEditToggle}
                      >
                        Cancel
                      </Button>
                      <Button 
                        variant="contained" 
                        startIcon={<SaveIcon />}
                        onClick={handleSaveProfile}
                        disabled={saveLoading}
                      >
                        {saveLoading ? <CircularProgress size={24} /> : "Lưu thay đổi"}
                      </Button>
                    </Box>
                  )}
                </Box>
              </Box>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              indicatorColor="primary"
              textColor="primary"
              sx={{ mb: 3 }}
            >
              <Tab label="Thông tin cá nhân" />
              <Tab label="Bảo mật" />
            </Tabs>

            {tabValue === 0 && (
              <Box>
                {saveSuccess && (
                  <Alert severity="success" sx={{ mb: 2 }}>
                    Cập nhật hồ sơ thành công!
                  </Alert>
                )}
                {saveError && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {saveError}
                  </Alert>
                )}
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Họ và tên"
                      name="name"
                      value={editMode ? formData.name : user.name}
                      onChange={handleInputChange}
                      disabled={!editMode}
                      variant={editMode ? "outlined" : "filled"}
                      margin="normal"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Email"
                      name="email"
                      value={editMode ? formData.email : user.email}
                      onChange={handleInputChange}
                      disabled={!editMode}
                      variant={editMode ? "outlined" : "filled"}
                      margin="normal"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Số điện thoại"
                      value={user.phone}
                      disabled
                      variant="filled"
                      margin="normal"
                      helperText="Số điện thoại không thể thay đổi"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Ngày sinh"
                      name="birthday"
                      type={editMode ? "date" : "text"}
                      value={editMode ? formData.birthday : user.birthday}
                      onChange={handleInputChange}
                      disabled={!editMode}
                      variant={editMode ? "outlined" : "filled"}
                      margin="normal"
                      InputLabelProps={{
                        shrink: true,
                      }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Trạng thái"
                      name="status"
                      value={editMode ? formData.status : user.status}
                      onChange={handleInputChange}
                      disabled={!editMode}
                      variant={editMode ? "outlined" : "filled"}
                      margin="normal"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Giới thiệu"
                      name="about"
                      value={editMode ? formData.about : user.about}
                      onChange={handleInputChange}
                      disabled={!editMode}
                      variant={editMode ? "outlined" : "filled"}
                      margin="normal"
                      multiline
                      rows={4}
                    />
                  </Grid>
                </Grid>
              </Box>
            )}

            {tabValue === 1 && (
              <Box>
                {passwordSuccess && (
                  <Alert severity="success" sx={{ mb: 2 }}>
                    Đổi mật khẩu thành công!
                  </Alert>
                )}
                {passwordError && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {passwordError}
                  </Alert>
                )}
                <Typography variant="h6" gutterBottom>
                  Đổi mật khẩu
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Mật khẩu hiện tại"
                      name="currentPassword"
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={handlePasswordInputChange}
                      margin="normal"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Mật khẩu mới"
                      name="newPassword"
                      type="password"
                      value={passwordData.newPassword}
                      onChange={handlePasswordInputChange}
                      margin="normal"
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Xác nhận mật khẩu mới"
                      name="confirmPassword"
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordInputChange}
                      margin="normal"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Button 
                      variant="contained" 
                      color="primary"
                      onClick={handleChangePassword}
                      disabled={changingPassword}
                    >
                      {changingPassword ? <CircularProgress size={24} /> : "Đổi mật khẩu"}
                    </Button>
                  </Grid>
                </Grid>
              </Box>
            )}
          </Paper>
        </>
      )}

      {/* Avatar Change Dialog */}
      <Dialog open={showAvatarDialog} onClose={() => setShowAvatarDialog(false)}>
        <DialogTitle>Change Profile Picture</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 2 }}>
            <Avatar 
              src={avatarPreview || user.avatar} 
              alt={user.name} 
              sx={{ width: 150, height: 150, mb: 3 }}
            />
            <input
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              ref={fileInputRef}
              onChange={handleFileSelect}
            />
            <Button
              variant="outlined"
              onClick={triggerFileInput}
              startIcon={<PhotoCameraIcon />}
            >
              Select Image
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowAvatarDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleUploadAvatar} 
            variant="contained" 
            color="primary"
            disabled={!avatarFile || uploadingAvatar}
          >
            {uploadingAvatar ? <CircularProgress size={24} /> : "Upload"}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ProfileScreen;
