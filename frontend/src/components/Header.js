import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { API_URL } from '../services/api';
import '../styles/Header.css';

const Header = () => {
  const [user, setUser] = useState(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadUserProfile();
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleClickOutside = (event) => {
    if (menuRef.current && !menuRef.current.contains(event.target)) {
      setShowProfileMenu(false);
    }
  };

  const loadUserProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await fetch(`${API_URL}/users/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
        return;
      }

      const data = await response.json();
      if (data.success) {
        setUser(data.user);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const handleProfileClick = () => {
    setShowProfileMenu(!showProfileMenu);
  };

  return (
    <header className="app-header">
      <div className="header-left">
        <Link to="/" className="logo">
          <img src="/logo.png" alt="Zalo-Clone" />
          <span>Zalo-Clone</span>
        </Link>
      </div>

      <div className="header-right">
        {user && (
          <div className="profile-section" ref={menuRef}>
            <div 
              className="avatar-container"
              onClick={handleProfileClick}
            >
              <img 
                src={user.avatar || '/default-avatar.png'} 
                alt={user.fullname} 
                className="user-avatar"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = '/default-avatar.png';
                }}
              />
            </div>

            {showProfileMenu && (
              <div className="profile-menu">
                <div className="menu-header">
                  <img 
                    src={user.avatar || '/default-avatar.png'} 
                    alt={user.fullname} 
                    className="menu-avatar"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/default-avatar.png';
                    }}
                  />
                  <div className="user-info">
                    <span className="user-name">{user.fullname}</span>
                    <span className="user-username">{user.username}</span>
                  </div>
                </div>
                <div className="menu-items">
                  <Link to="/profile" className="menu-item" onClick={() => setShowProfileMenu(false)}>
                    <i className="fas fa-user"></i>
                    <span>Hồ sơ cá nhân</span>
                  </Link>
                  <button className="menu-item" onClick={handleLogout}>
                    <i className="fas fa-sign-out-alt"></i>
                    <span>Đăng xuất</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

export default Header; 