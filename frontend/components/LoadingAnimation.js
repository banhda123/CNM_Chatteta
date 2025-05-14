import React from 'react';
import { Box } from '@mui/material';
import Lottie from 'lottie-react';
import catAnimation from '../assets/cat_animation.json';

/**
 * A component that displays a Lottie animation during loading states
 */
const LoadingAnimation = ({ size = 200 }) => {
  return (
    <Box 
      sx={{
        width: size,
        height: size,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}
    >
      <Lottie 
        animationData={catAnimation} 
        loop={true}
        style={{ width: '100%', height: '100%' }}
      />
    </Box>
  );
};

export default LoadingAnimation; 