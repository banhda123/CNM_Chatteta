import React, { useState, useEffect } from 'react';
import { Box } from '@mui/material';
import LoadingAnimation from './LoadingAnimation';

/**
 * Component that shows a loading animation during page refreshes and transitions
 */
const PageTransition = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Handle page visibility changes
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        setIsLoading(true);
      } else if (document.visibilityState === 'visible') {
        // Add a small delay to ensure smooth transition
        setTimeout(() => setIsLoading(false), 500);
      }
    };

    // Custom event for route changes
    const handleRouteChange = () => {
      setIsLoading(true);
      // Give time for the new content to load
      setTimeout(() => setIsLoading(false), 800);
    };

    // Custom function to check for history changes 
    const setupHistoryWatcher = () => {
      const originalPushState = history.pushState;
      const originalReplaceState = history.replaceState;
      
      // Override pushState
      history.pushState = function() {
        originalPushState.apply(this, arguments);
        handleRouteChange();
      };
      
      // Override replaceState
      history.replaceState = function() {
        originalReplaceState.apply(this, arguments);
        handleRouteChange();
      };
      
      // Listen for popstate (back/forward navigation)
      window.addEventListener('popstate', handleRouteChange);
      
      return () => {
        history.pushState = originalPushState;
        history.replaceState = originalReplaceState;
        window.removeEventListener('popstate', handleRouteChange);
      };
    };

    // Initial page load animation for 1 second
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 1000);

    // Add visibility change listener
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Setup history watcher
    const cleanupHistoryWatcher = setupHistoryWatcher();

    // Clean up event listeners
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      cleanupHistoryWatcher();
    };
  }, []);

  return (
    <>
      {isLoading && (
        <Box 
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: theme => theme.palette.background.default,
            zIndex: 9999,
          }}
        >
          <LoadingAnimation size={250} />
        </Box>
      )}
      {children}
    </>
  );
};

export default PageTransition; 