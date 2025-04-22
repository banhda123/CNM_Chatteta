import React, { useState, useEffect } from 'react';
import { Box, Typography, Grid, CircularProgress, TextField, IconButton, Tabs, Tab, useTheme } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import axios from 'axios';

// Pre-loaded GIFs collection - Ami Cat stickers
const AMI_CAT_GIFS = [
  {
    id: 'ami1',
    url: 'https://res.cloudinary.com/daclejcpu/image/upload/v1745251558/Ami_Fat_Cat_so_Cute_te4a7y.gif',
    label: 'Ami Hi'
  },
  {
    id: 'ami2',
    url: 'https://res.cloudinary.com/daclejcpu/image/upload/v1745251245/Ami_Fat_Cat_1_hi5l9i.gif',
    label: 'Ami Sleepy'
  },
  {
    id: 'ami3',
    url: 'https://res.cloudinary.com/daclejcpu/image/upload/v1745251242/Ami_Fat_Cat_el9rjj.gif',
    label: 'Ami OK'
  },
  {
    id: 'ami4',
    url: 'https://res.cloudinary.com/daclejcpu/image/upload/v1745251241/t%E1%BA%A3i_xu%E1%BB%91ng_y14wn9.gif',
    label: 'Ami Cool'
  },
  {
    id: 'ami5',
    url: 'https://res.cloudinary.com/daclejcpu/image/upload/v1745251241/t%E1%BA%A3i_xu%E1%BB%91ng_1_ggdnzw.gif',
    label: 'Ami Love'
  },
  {
    id: 'ami6',
    url: 'https://res.cloudinary.com/daclejcpu/image/upload/v1745251241/t%E1%BA%A3i_xu%E1%BB%91ng_2_s269uh.gif',
    label: 'Ami Cry'
  },
  {
    id: 'ami7',
    url: 'https://res.cloudinary.com/daclejcpu/image/upload/v1745251559/GIF_Maker___Tenor_acnmlj.gif',
    label: 'Ami Happy'
  },
  {
    id: 'ami8',
    url: 'https://res.cloudinary.com/daclejcpu/image/upload/v1745251560/t%E1%BA%A3i_xu%E1%BB%91ng_3_vpn4ei.gif',
    label: 'Ami Laugh'
  },
  // Additional cat stickers for a fuller grid
  {
    id: 'ami9',
    url: 'https://res.cloudinary.com/daclejcpu/image/upload/v1745251558/Ami_Fat_Cat_so_Cute_te4a7y.gif',
    label: 'Ami Wave'
  },
  {
    id: 'ami10',
    url: 'https://res.cloudinary.com/daclejcpu/image/upload/v1745251245/Ami_Fat_Cat_1_hi5l9i.gif',
    label: 'Ami Tired'
  },
  {
    id: 'ami11',
    url: 'https://res.cloudinary.com/daclejcpu/image/upload/v1745251242/Ami_Fat_Cat_el9rjj.gif',
    label: 'Ami Thumbs Up'
  },
  {
    id: 'ami12',
    url: 'https://res.cloudinary.com/daclejcpu/image/upload/v1745251241/t%E1%BA%A3i_xu%E1%BB%91ng_2_s269uh.gif',
    label: 'Ami Sad'
  }
];

const RECENT_GIFS = [
  {
    id: 'recent1',
    url: 'https://res.cloudinary.com/daclejcpu/image/upload/v1745251558/Ami_Fat_Cat_so_Cute_te4a7y.gif',
    label: 'Recent 1'
  },
  {
    id: 'recent2',
    url: 'https://res.cloudinary.com/daclejcpu/image/upload/v1745251245/Ami_Fat_Cat_1_hi5l9i.gif',
    label: 'Recent 2'
  },
  {
    id: 'recent3',
    url: 'https://res.cloudinary.com/daclejcpu/image/upload/v1745251242/Ami_Fat_Cat_el9rjj.gif',
    label: 'Recent 3'
  },
  {
    id: 'recent4',
    url: 'https://res.cloudinary.com/daclejcpu/image/upload/v1745251241/t%E1%BA%A3i_xu%E1%BB%91ng_y14wn9.gif',
    label: 'Recent 4'
  }
];

const GifGallery = ({ onSelectGif, onClose }) => {
  const theme = useTheme();
  const [gifs, setGifs] = useState(AMI_CAT_GIFS);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [tabValue, setTabValue] = useState(0);
  
  // Function to load GIFs from Cloudinary (for future implementation)
  const loadGifsFromCloudinary = async () => {
    try {
      setLoading(true);
      // This would be replaced with actual Cloudinary API call
      // For now, we'll just use the default GIFs
      setGifs(tabValue === 0 ? RECENT_GIFS : AMI_CAT_GIFS);
    } catch (error) {
      console.error('Error loading GIFs:', error);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    loadGifsFromCloudinary();
  }, [tabValue]);
  
  const handleSelectGif = (gif) => {
    if (onSelectGif) {
      onSelectGif(gif);
    }
    if (onClose) {
      onClose();
    }
  };
  
  const handleSearch = () => {
    if (!searchTerm.trim()) {
      setGifs(tabValue === 0 ? RECENT_GIFS : AMI_CAT_GIFS);
      return;
    }
    
    // Simple client-side filtering
    const sourceGifs = tabValue === 0 ? RECENT_GIFS : AMI_CAT_GIFS;
    const filteredGifs = sourceGifs.filter(gif => 
      gif.label.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setGifs(filteredGifs);
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  return (
    <Box sx={{ 
      width: 320, 
      maxHeight: 400, 
      bgcolor: '#1e1e1e', 
      color: 'white',
      borderRadius: 1,
      overflow: 'hidden'
    }}>
      {/* Header with collection name */}
      <Box sx={{ p: 1.5, borderBottom: '1px solid #333', display: 'flex', alignItems: 'center' }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
          {tabValue === 0 ? "Gần đây" : "Ami Bụng Bự"}
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
          label="Ami Bụng Bự" 
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
        ) : (
          <Grid container spacing={1}>
            {gifs.map((gif) => (
              <Grid item xs={3} key={gif.id}>
                <Box
                  component="img"
                  src={gif.url}
                  alt={gif.label}
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
                  title={gif.label}
                />
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    </Box>
  );
};

export default GifGallery; 