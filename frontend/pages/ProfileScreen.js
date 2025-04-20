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
import { useRoute, useNavigation } from "@react-navigation/native";
import UserService from "../services/UserService";
import AuthService from "../services/AuthService";
import { Edit as EditIcon, Save as SaveIcon, PhotoCamera as PhotoCameraIcon } from "@mui/icons-material";

const ProfileScreen = ({ onBack }) => {
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
          name: userData.name || "No name provided",
        avatar: userData.avatar || "https://via.placeholder.com/150",
          status: userData.status || "Hey there! I'm using this app",
          birthday: userData.birthday || "Not specified",
          phone: userData.phone || "Not provided",
          email: userData.email || "Not provided",
          about: userData.about || "No bio yet",
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
      alert("Failed to load profile data");
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
      
      // Update user avatar
      setUser({
        ...user,
        avatar: response.avatar
      });
      
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

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
        {/* Header with back button */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h5" fontWeight="bold">Trang cá nhân</Typography>
          <Button 
            variant="outlined" 
            onClick={onBack}
            color="primary"
          >
            Quay lại
          </Button>
        </Box>

        {/* Avatar and basic info */}
        <Box display="flex" flexDirection="column" alignItems="center" mb={4}>
          <Box sx={{ position: 'relative', mb: 2 }}>
            <Avatar
              src={avatarPreview || user.avatar}
              sx={{ 
                width: 120, 
                height: 120, 
                cursor: 'pointer',
                border: '3px solid #f0f0f0'
              }}
              onClick={handleAvatarClick}
            />
            <IconButton
              sx={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                backgroundColor: 'primary.main',
                color: 'white',
                '&:hover': {
                  backgroundColor: 'primary.dark',
                }
              }}
              onClick={handleAvatarClick}
            >
              <PhotoCameraIcon fontSize="small" />
            </IconButton>
          </Box>

          <Typography variant="h5" fontWeight="bold" mb={0.5}>
            {user.name}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {user.phone}
          </Typography>
        </Box>

        {/* Avatar change dialog */}
        <Dialog open={showAvatarDialog} onClose={() => setShowAvatarDialog(false)}>
          <DialogTitle>Thay đổi ảnh đại diện</DialogTitle>
          <DialogContent>
            <Box sx={{ textAlign: 'center', py: 2 }}>
              <Avatar
                src={avatarPreview || user.avatar}
                sx={{ width: 150, height: 150, mx: 'auto', mb: 2, border: '3px solid #f0f0f0' }}
              />
              
              {avatarPreview && (
                <Typography variant="caption" color="text.secondary" display="block" mb={2}>
                  Xem trước ảnh mới
                </Typography>
              )}
              
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                accept="image/*"
                onChange={handleFileSelect}
              />
              
              <Button 
                variant="outlined" 
                onClick={triggerFileInput}
                sx={{ mb: 2 }}
              >
                Chọn ảnh
              </Button>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowAvatarDialog(false)} disabled={uploadingAvatar}>
              Hủy
            </Button>
            <Button 
              onClick={handleUploadAvatar} 
              disabled={!avatarFile || uploadingAvatar}
              variant="contained"
            >
              {uploadingAvatar ? <CircularProgress size={24} /> : "Lưu ảnh mới"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={tabValue} onChange={handleTabChange} centered>
            <Tab label="Thông tin cá nhân" />
            <Tab label="Đổi mật khẩu" />
          </Tabs>
        </Box>

        {/* Profile Information Tab */}
        {tabValue === 0 && (
          <Box>
            <Box display="flex" justifyContent="flex-end" mb={2}>
              <Button 
                startIcon={editMode ? <SaveIcon /> : <EditIcon />}
                variant={editMode ? "contained" : "outlined"}
                onClick={editMode ? handleSaveProfile : handleEditToggle}
                disabled={saveLoading}
              >
                {saveLoading ? <CircularProgress size={24} /> : (editMode ? "Lưu thay đổi" : "Chỉnh sửa")}
              </Button>
            </Box>

            {saveSuccess && (
              <Alert severity="success" sx={{ mb: 2 }}>
                Cập nhật thông tin thành công!
              </Alert>
            )}
            
            {saveError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {saveError}
              </Alert>
            )}
            
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Tên hiển thị"
                  name="name"
                  value={editMode ? formData.name : user.name}
                  onChange={handleInputChange}
                  disabled={!editMode}
                  variant={editMode ? "outlined" : "filled"}
                  InputProps={{ readOnly: !editMode }}
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
                  InputProps={{ readOnly: !editMode }}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Số điện thoại"
                  value={user.phone}
                  disabled
                  variant="filled"
                  InputProps={{ readOnly: true }}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Email"
                  name="email"
                  value={editMode ? formData.email : user.email}
                  onChange={handleInputChange}
                  disabled={!editMode}
                  variant={editMode ? "outlined" : "filled"}
                  InputProps={{ readOnly: !editMode }}
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Ngày sinh"
                  name="birthday"
                  value={editMode ? formData.birthday : user.birthday}
                  onChange={handleInputChange}
                  disabled={!editMode}
                  variant={editMode ? "outlined" : "filled"}
                  InputProps={{ readOnly: !editMode }}
                  placeholder="DD/MM/YYYY"
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
                  multiline
                  rows={4}
                  InputProps={{ readOnly: !editMode }}
                />
              </Grid>
            </Grid>
            
            {editMode && (
              <Box display="flex" justifyContent="space-between" mt={3}>
                <Button
                  variant="outlined"
                  color="error"
                  onClick={handleEditToggle}
                >
                  Hủy
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleSaveProfile}
                  disabled={saveLoading}
                >
                  {saveLoading ? <CircularProgress size={24} /> : "Lưu thay đổi"}
                </Button>
              </Box>
            )}
          </Box>
        )}

        {/* Password Change Tab */}
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
            
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  type="password"
                  label="Mật khẩu hiện tại"
                  name="currentPassword"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordInputChange}
                  required
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  type="password"
                  label="Mật khẩu mới"
                  name="newPassword"
                  value={passwordData.newPassword}
                  onChange={handlePasswordInputChange}
                  required
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  type="password"
                  label="Xác nhận mật khẩu mới"
                  name="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordInputChange}
                  required
                  error={passwordData.newPassword !== passwordData.confirmPassword && passwordData.confirmPassword !== ""}
                  helperText={passwordData.newPassword !== passwordData.confirmPassword && passwordData.confirmPassword !== "" ? "Mật khẩu không khớp" : ""}
                />
              </Grid>
            </Grid>
            
            <Box display="flex" justifyContent="flex-end" mt={3}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleChangePassword}
                disabled={changingPassword}
              >
                {changingPassword ? <CircularProgress size={24} /> : "Đổi mật khẩu"}
              </Button>
            </Box>
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default ProfileScreen;
