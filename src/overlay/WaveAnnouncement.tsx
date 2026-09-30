/**
 * Wave Announcement Component
 * Displays animated wave progress indicator between waves
 */

import React from 'react';

export interface WaveAnnouncementProps {
  currentWave: number;
  totalWaves: number;
}

export const WaveAnnouncement: React.FC<WaveAnnouncementProps> = ({
  currentWave,
  totalWaves
}) => {
  return (
    <div style={{
      position: 'absolute',
      top: '40%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      fontSize: '64px',
      fontWeight: 'bold',
      color: '#fbbf24',
      textShadow: '0 0 30px rgba(0,0,0,1), 0 0 60px rgba(251, 191, 36, 0.8)',
      zIndex: 999,
      pointerEvents: 'none',
      textAlign: 'center',
      animation: 'fadeInOut 2s ease-in-out'
    }}>
      🐉 Wave {currentWave} / {totalWaves} 🐉
    </div>
  );
};
