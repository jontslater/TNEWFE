/**
 * Unified Browser Source Page for OBS
 * Automatically switches between regular battlefield, raid, and dungeon views
 * based on user's active instances
 * 
 * This page uses window.location to redirect to the appropriate page
 * since React Router's useParams requires being in a route context
 */

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useActiveInstanceListener } from '../hooks/useActiveInstanceListener';
import BrowserSourcePage from './BrowserSourcePage';
import RaidBrowserSourcePage from './RaidBrowserSourcePage';

// Add CSS for fade animation
if (typeof document !== 'undefined' && !document.getElementById('transition-animation-style')) {
  const styleSheet = document.createElement('style');
  styleSheet.id = 'transition-animation-style';
  styleSheet.textContent = `
    @keyframes fadeInOut {
      0% { opacity: 0; }
      20% { opacity: 1; }
      80% { opacity: 1; }
      100% { opacity: 0; }
    }
  `;
  document.head.appendChild(styleSheet);
}

export default function UnifiedBrowserSourcePage() {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [fadeState, setFadeState] = useState<'fade-in' | 'fade-out' | 'visible'>('visible');
  
  // Get user ID for instance listener
  // Check URL params first (for test script), then auth user
  const urlUserId = searchParams.get('userId');
  const userId = urlUserId || user?.twitchId || user?.id || null;
  
  // Listen for active instances
  const { activeInstance, loading } = useActiveInstanceListener(userId);
  
  // Debounce instance changes to prevent rapid switching
  const [debouncedInstance, setDebouncedInstance] = useState(activeInstance);
  
  const [transitionMessage, setTransitionMessage] = useState<string | null>(null);

  useEffect(() => {
    // Debounce instance changes by 200ms to prevent flickering
    const timer = setTimeout(() => {
      if (activeInstance.instanceId !== debouncedInstance.instanceId || activeInstance.type !== debouncedInstance.type) {
        // Determine transition message
        let message = null;
        if (debouncedInstance.type === null && activeInstance.type === 'dungeon') {
          message = 'Entering Dungeon...';
        } else if (debouncedInstance.type === 'dungeon' && activeInstance.type === null) {
          message = 'Leaving Dungeon...';
        } else if (debouncedInstance.type === null && activeInstance.type === 'raid') {
          message = 'Entering Raid...';
        } else if (debouncedInstance.type === 'raid' && activeInstance.type === null) {
          message = 'Leaving Raid...';
        } else if (debouncedInstance.type === 'dungeon' && activeInstance.type === 'raid') {
          message = 'Entering Raid...';
        } else if (debouncedInstance.type === 'raid' && activeInstance.type === 'dungeon') {
          message = 'Entering Dungeon...';
        } else if ((debouncedInstance.type === 'dungeon' || debouncedInstance.type === 'raid') && activeInstance.type === null) {
          message = 'Returning to Idle Adventure...';
        }
        
        if (message) {
          setTransitionMessage(message);
          console.log(`[Browser Source] ${message}`);
        }
        
        setFadeState('fade-out');
        setTimeout(() => {
          setDebouncedInstance(activeInstance);
          setFadeState('fade-in');
          setTimeout(() => {
            setFadeState('visible');
            // Clear transition message after fade-in completes
            setTimeout(() => setTransitionMessage(null), 500);
          }, 200);
        }, 200);
      }
    }, 200);
    
    return () => clearTimeout(timer);
  }, [activeInstance, debouncedInstance]);
  
  // Show loading state briefly
  if (loading && !debouncedInstance.instanceId) {
    return (
      <div style={{
        width: '1920px',
        height: '1080px',
        backgroundColor: 'transparent',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white'
      }}>
        <div>Loading...</div>
      </div>
    );
  }
  
  // Render transition message overlay
  const renderTransitionOverlay = () => {
    if (!transitionMessage) return null;
    
    return (
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        zIndex: 10000,
        pointerEvents: 'none',
        animation: 'fadeInOut 1.5s ease-in-out'
      }}>
        <div style={{
          fontSize: '48px',
          fontWeight: 'bold',
          color: '#fff',
          textShadow: '2px 2px 4px rgba(0, 0, 0, 0.8)',
          textAlign: 'center'
        }}>
          {transitionMessage}
        </div>
      </div>
    );
  };

  // Render based on active instance type
  if (debouncedInstance.type === 'raid' && debouncedInstance.instanceId) {
    // Render raid browser source page directly with instanceId prop
    return (
      <div style={{
        width: '1920px',
        height: '1080px',
        backgroundColor: 'transparent',
        opacity: fadeState === 'fade-out' ? 0 : fadeState === 'fade-in' ? 0.5 : 1,
        transition: 'opacity 0.2s ease-in-out',
        position: 'relative'
      }}>
        {renderTransitionOverlay()}
        <RaidBrowserSourcePage instanceId={debouncedInstance.instanceId} />
      </div>
    );
  }
  
  if (debouncedInstance.type === 'dungeon' && debouncedInstance.instanceId) {
    // Reuse RaidBrowserSourcePage for dungeons (same structure)
    return (
      <div style={{
        width: '1920px',
        height: '1080px',
        backgroundColor: 'transparent',
        opacity: fadeState === 'fade-out' ? 0 : fadeState === 'fade-in' ? 0.5 : 1,
        transition: 'opacity 0.2s ease-in-out',
        position: 'relative'
      }}>
        {renderTransitionOverlay()}
        <RaidBrowserSourcePage instanceId={debouncedInstance.instanceId} />
      </div>
    );
  }
  
  // No active instance - show regular battlefield
  // Pass searchParams to BrowserSourcePage so it can get battlefieldId from URL
  return (
    <div style={{
      width: '1920px',
      height: '1080px',
      backgroundColor: 'transparent',
      opacity: fadeState === 'fade-out' ? 0 : fadeState === 'fade-in' ? 0.5 : 1,
      transition: 'opacity 0.2s ease-in-out',
      position: 'relative'
    }}>
      {renderTransitionOverlay()}
      <BrowserSourcePage />
    </div>
  );
}
