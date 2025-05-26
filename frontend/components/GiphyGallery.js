import React, { useState, useEffect } from 'react';
import { Box, Typography, Grid, CircularProgress, TextField, IconButton, Tabs, Tab, useTheme } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import axios from 'axios';
import { API_URL } from '../config/constants';

// Lưu trữ GIF đã sử dụng gần đây trong localStorage
const getRecentGifs = () => {
  try {
    const recentGifs = localStorage.getItem('recentGifs');
    return recentGifs ? JSON.parse(recentGifs) : [];
  } catch (error) {
    console.error('Lỗi khi đọc GIF gần đây từ localStorage:', error);
    return [];
  }
};

// Lưu GIF đã sử dụng vào localStorage
const saveRecentGif = (gif) => {
  try {
    const recentGifs = getRecentGifs();
    // Kiểm tra nếu GIF đã tồn tại trong danh sách
    const existingIndex = recentGifs.findIndex(item => item.id === gif.id);
    
    if (existingIndex !== -1) {
      // Nếu đã tồn tại, xóa và thêm lại vào đầu danh sách
      recentGifs.splice(existingIndex, 1);
    }
    
    // Thêm GIF mới vào đầu danh sách
    recentGifs.unshift(gif);
    
    // Giới hạn số lượng GIF gần đây
    const limitedRecentGifs = recentGifs.slice(0, 12);
    
    localStorage.setItem('recentGifs', JSON.stringify(limitedRecentGifs));
  } catch (error) {
    console.error('Lỗi khi lưu GIF gần đây vào localStorage:', error);
  }
};

const GiphyGallery = ({ onSelectGif, onClose }) => {
  const theme = useTheme();
  const [gifs, setGifs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [tabValue, setTabValue] = useState(0);
  
  // Tải GIF từ Giphy API
  const loadGifsFromGiphy = async (endpoint, params = {}) => {
    try {
      setLoading(true);
      
      const response = await axios.get(`${API_URL}/giphy/${endpoint}`, { params });
      
      if (response.data && response.data.data) {
        const formattedGifs = response.data.data.map(item => ({
          id: item.id,
          url: item.images.fixed_height.url,
          preview: item.images.fixed_height_small.url,
          original: item.images.original.url,
          title: item.title
        }));
        
        setGifs(formattedGifs);
      }
    } catch (error) {
      console.error(`Lỗi khi tải GIF từ Giphy API (${endpoint}):`, error);
      setGifs([]);
    } finally {
      setLoading(false);
    }
  };
  
  // Xử lý khi tab thay đổi
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setSearchTerm('');
    
    if (newValue === 0) {
      // Tab "Gần đây"
      setGifs(getRecentGifs());
    } else if (newValue === 1) {
      // Tab "Trending"
      loadGifsFromGiphy('trending');
    }
  };
  
  // Xử lý khi chọn GIF
  const handleSelectGif = (gif) => {
    if (onSelectGif) {
      saveRecentGif(gif);
      onSelectGif(gif);
    }
    if (onClose) {
      onClose();
    }
  };
  
  // Xử lý tìm kiếm GIF
  const handleSearch = () => {
    if (!searchTerm.trim()) {
      // Nếu không có từ khóa tìm kiếm, hiển thị GIF trending
      loadGifsFromGiphy('trending');
      return;
    }
    
    loadGifsFromGiphy('search', { q: searchTerm });
  };
  
  // Tải GIF khi component được tạo
  useEffect(() => {
    if (tabValue === 0) {
      // Tab "Gần đây"
      setGifs(getRecentGifs());
      setLoading(false);
    } else if (tabValue === 1) {
      // Tab "Trending"
      loadGifsFromGiphy('trending');
    }
  }, [tabValue]);
  
  return (
    <Box sx={{ 
      width: 320, 
      bgcolor: '#1e1e1e',
      color: 'white',
      borderRadius: 1,
      overflow: 'hidden',
      boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
    }}>
      {/* Header */}
      <Box sx={{ 
        p: 1.5, 
        borderBottom: '1px solid #333',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
          Thư viện GIF
        </Typography>
      </Box>
      
      {/* Tab navigation */}
      <Tabs 
        value={tabValue} 
        onChange={handleTabChange}
        sx={{ 
          bgcolor: '#252525',
          '& .MuiTabs-indicator': {
            backgroundColor: '#2979ff',
          },
          '& .MuiTab-root': {
            color: 'rgba(255, 255, 255, 0.7)',
            '&.Mui-selected': {
              color: '#2979ff',
            },
            minWidth: 80,
          }
        }}
      >
        <Tab 
          icon={<AccessTimeIcon />} 
          label="Gần đây"
          iconPosition="start"
          sx={{ fontSize: '0.75rem', textTransform: 'none' }}
        />
        <Tab 
          icon={<TrendingUpIcon />}
          label="Xu hướng" 
          iconPosition="start"
          sx={{ fontSize: '0.75rem', textTransform: 'none' }}
        />
      </Tabs>
      
      {/* Tip for adding caption */}
      <Box sx={{ 
        px: 1.5, 
        py: 0.75, 
        bgcolor: 'rgba(41, 121, 255, 0.1)', 
        fontSize: '0.75rem',
        color: 'rgba(255, 255, 255, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderBottom: '1px solid #333'
      }}>
        <Typography variant="caption">
          Nhập văn bản để thêm chú thích cho GIF
        </Typography>
      </Box>
      
      {/* Search bar */}
      <Box sx={{ p: 1, bgcolor: '#252525' }}>
        <Box sx={{ 
          display: 'flex', 
          bgcolor: '#333', 
          borderRadius: 1,
          p: 0.5 
        }}>
          <TextField
            size="small"
            placeholder="Tìm kiếm GIF"
            fullWidth
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            sx={{
              '& .MuiInputBase-root': {
                color: 'white',
                fontSize: '0.875rem',
                padding: '0 8px',
              },
              '& .MuiOutlinedInput-notchedOutline': {
                border: 'none'
              },
              '& .MuiInputBase-input': {
                padding: '6px 8px',
              }
            }}
            variant="outlined"
          />
          <IconButton onClick={handleSearch} size="small" sx={{ color: 'white' }}>
            <SearchIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>
      
      {/* GIF grid */}
      <Box sx={{ 
        p: 1, 
        bgcolor: '#1e1e1e',
        height: 270,
        overflowY: 'auto',
        '&::-webkit-scrollbar': {
          width: '8px',
        },
        '&::-webkit-scrollbar-track': {
          background: '#1e1e1e',
        },
        '&::-webkit-scrollbar-thumb': {
          background: '#444',
          borderRadius: 1,
        },
      }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <CircularProgress size={24} sx={{ color: 'white' }} />
          </Box>
        ) : gifs.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', flexDirection: 'column' }}>
            {tabValue === 0 ? (
              <>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mb: 1 }}>
                  Bạn chưa sử dụng GIF nào gần đây
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                  Hãy chuyển sang tab Xu hướng để tìm GIF
                </Typography>
              </>
            ) : (
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                Không tìm thấy GIF nào
              </Typography>
            )}
          </Box>
        ) : (
          <Grid container spacing={1}>
            {gifs.map((gif) => (
              <Grid item xs={3} key={gif.id}>
                <Box
                  component="img"
                  src={gif.preview || gif.url}
                  alt={gif.title || "GIF"}
                  sx={{
                    width: '100%',
                    height: 68,
                    objectFit: 'cover',
                    borderRadius: 1,
                    cursor: 'pointer',
                    '&:hover': {
                      opacity: 0.8,
                      transform: 'scale(1.05)',
                      transition: 'all 0.2s'
                    }
                  }}
                  onClick={() => handleSelectGif(gif)}
                  title={gif.title}
                />
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    </Box>
  );
};

export default GiphyGallery;
