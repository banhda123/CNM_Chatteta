import React, { useState, useEffect } from 'react';
import { API_URL } from '../services/api';

const Profile = () => {
  const [user, setUser] = useState({
    username: '',
    fullname: '',
    avatar: ''
  });
  const [password, setPassword] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/users/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
        return;
      }

      const data = await response.json();
      if (data.success) {
        setUser(data.user);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      setError('Không thể tải thông tin người dùng');
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/users/avatar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (response.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
        return;
      }

      const data = await response.json();
      if (data.success) {
        setUser(prev => ({ ...prev, avatar: data.user.avatar }));
        setSuccess('Cập nhật ảnh đại diện thành công');
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (error) {
      console.error('Error updating avatar:', error);
      setError('Không thể cập nhật ảnh đại diện');
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/users/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ fullname: user.fullname })
      });

      if (response.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
        return;
      }

      const data = await response.json();
      if (data.success) {
        setSuccess('Cập nhật thông tin thành công');
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('Không thể cập nhật thông tin');
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (password.newPassword !== password.confirmPassword) {
      setError('Mật khẩu mới không khớp');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/users/password`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          currentPassword: password.currentPassword,
          newPassword: password.newPassword
        })
      });

      if (response.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
        return;
      }

      const data = await response.json();
      if (data.success) {
        setSuccess('Đổi mật khẩu thành công');
        setPassword({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.message || 'Đổi mật khẩu thất bại');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      setError('Không thể đổi mật khẩu');
    }
  };

  return (
    <div className="profile-container">
      <div className="profile-header">
        <div className="avatar-section">
          <img 
            src={user.avatar || '/default-avatar.png'} 
            alt="Avatar" 
            className="avatar-preview"
          />
          <div className="avatar-actions">
            <input
              type="file"
              id="avatarInput"
              accept="image/*"
              onChange={handleAvatarChange}
              style={{ display: 'none' }}
            />
            <button
              className="btn btn-primary"
              onClick={() => document.getElementById('avatarInput').click()}
            >
              Thay đổi ảnh đại diện
            </button>
          </div>
        </div>

        <form onSubmit={handleProfileUpdate} className="profile-form">
          <div className="form-group">
            <label htmlFor="username">Tên đăng nhập</label>
            <input
              type="text"
              id="username"
              value={user.username}
              readOnly
              className="form-control"
            />
          </div>
          <div className="form-group">
            <label htmlFor="fullname">Họ và tên</label>
            <input
              type="text"
              id="fullname"
              value={user.fullname}
              onChange={(e) => setUser(prev => ({ ...prev, fullname: e.target.value }))}
              className="form-control"
            />
          </div>
          <button type="submit" className="btn btn-primary">
            Cập nhật thông tin
          </button>
        </form>
      </div>

      <div className="password-section">
        <h3>Đổi mật khẩu</h3>
        <form onSubmit={handlePasswordChange}>
          <div className="form-group">
            <label htmlFor="currentPassword">Mật khẩu hiện tại</label>
            <input
              type="password"
              id="currentPassword"
              value={password.currentPassword}
              onChange={(e) => setPassword(prev => ({ ...prev, currentPassword: e.target.value }))}
              className="form-control"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="newPassword">Mật khẩu mới</label>
            <input
              type="password"
              id="newPassword"
              value={password.newPassword}
              onChange={(e) => setPassword(prev => ({ ...prev, newPassword: e.target.value }))}
              className="form-control"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="confirmPassword">Xác nhận mật khẩu mới</label>
            <input
              type="password"
              id="confirmPassword"
              value={password.confirmPassword}
              onChange={(e) => setPassword(prev => ({ ...prev, confirmPassword: e.target.value }))}
              className="form-control"
              required
            />
          </div>
          <button type="submit" className="btn btn-primary">
            Đổi mật khẩu
          </button>
        </form>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}
    </div>
  );
};

export default Profile; 