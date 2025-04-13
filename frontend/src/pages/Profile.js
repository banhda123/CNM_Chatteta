import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Avatar,
  IconButton,
  Grid,
} from '@mui/material';
import { PhotoCamera } from '@mui/icons-material';
import { userAPI } from '../services/api';

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    fullname: '',
    username: '',
  });
  const [avatar, setAvatar] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    const fetchUserProfile = async () => {
      try {
        const response = await userAPI.getProfile();
        setUser(response.data);
        setFormData({
          fullname: response.data.fullname,
          username: response.data.username,
        });
        setAvatar(response.data.avatar);
      } catch (error) {
        console.error('Error fetching profile:', error);
        setError('Không thể tải thông tin hồ sơ');
      }
    };

    fetchUserProfile();
  }, [navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleAvatarChange = async (event) => {
    const file = event.target.files[0];
    if (file) {
      const formData = new FormData();
      formData.append('avatar', file);

      try {
        const response = await userAPI.uploadAvatar(formData);
        setAvatar(response.data.url);
      } catch (error) {
        console.error('Error uploading avatar:', error);
        setError('Không thể tải lên ảnh đại diện');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await userAPI.updateProfile(formData);
      setError('');
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('Không thể cập nhật hồ sơ');
    }
  };

  if (!user) {
    return null;
  }

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          py: 4,
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 4,
            width: '100%',
          }}
        >
          <Typography variant="h4" component="h1" gutterBottom align="center">
            Hồ sơ cá nhân
          </Typography>
          {error && (
            <Typography color="error" align="center" gutterBottom>
              {error}
            </Typography>
          )}
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 4 }}>
            <Avatar
              src={avatar}
              sx={{ width: 120, height: 120, mb: 2 }}
            />
            <input
              accept="image/*"
              style={{ display: 'none' }}
              id="avatar-upload"
              type="file"
              onChange={handleAvatarChange}
            />
            <label htmlFor="avatar-upload">
              <IconButton color="primary" component="span">
                <PhotoCamera />
              </IconButton>
            </label>
          </Box>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Họ tên"
                  name="fullname"
                  value={formData.fullname}
                  onChange={handleChange}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Tên đăng nhập"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  disabled
                />
              </Grid>
              <Grid item xs={12}>
                <Button
                  fullWidth
                  variant="contained"
                  color="primary"
                  type="submit"
                  size="large"
                >
                  Cập nhật
                </Button>
              </Grid>
              <Grid item xs={12}>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => navigate('/chat')}
                >
                  Quay lại
                </Button>
              </Grid>
            </Grid>
          </form>
        </Paper>
      </Box>
    </Container>
  );
};

export default Profile; 