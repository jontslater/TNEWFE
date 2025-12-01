/**
 * Boss Cast Bar Component
 * Displays boss ability cast progress with interrupt indicator
 */

import React, { useEffect, useState } from 'react';
import { CastInfo } from '../types/BossMechanics';

interface BossCastBarProps {
  cast: CastInfo | null;
  bossName: string;
  position?: 'top' | 'bottom';
}

export default function BossCastBar({ cast, bossName, position = 'top' }: BossCastBarProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!cast) {
      setProgress(0);
      return;
    }

    if (cast.interrupted) {
      setProgress(0);
      return;
    }

    const updateProgress = () => {
      const now = Date.now();
      const elapsed = now - cast.startTime;
      const totalTime = cast.endTime - cast.startTime;
      const currentProgress = Math.min(1.0, Math.max(0, elapsed / totalTime));
      setProgress(currentProgress);

      if (currentProgress < 1.0 && !cast.interrupted) {
        requestAnimationFrame(updateProgress);
      }
    };

    const frameId = requestAnimationFrame(updateProgress);
    return () => cancelAnimationFrame(frameId);
  }, [cast]);

  if (!cast || cast.interrupted) {
    return null;
  }

  const timeRemaining = Math.max(0, Math.ceil((cast.endTime - Date.now()) / 1000));
  const progressPercent = Math.round(progress * 100);

  return (
    <div
      style={{
        position: 'absolute',
        [position]: position === 'top' ? '-60px' : '60px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '400px',
        height: '40px',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        border: '2px solid',
        borderColor: cast.mechanic.interruptible ? '#ffd700' : '#ff0000',
        borderRadius: '4px',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '4px 8px',
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.5)'
      }}
    >
      {/* Cast name and time */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '4px',
        fontSize: '12px',
        color: '#ffffff',
        fontWeight: 'bold'
      }}>
        <span>{cast.mechanic.name}</span>
        <span>{timeRemaining}s</span>
      </div>

      {/* Progress bar */}
      <div style={{
        width: '100%',
        height: '20px',
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: '2px',
        overflow: 'hidden',
        position: 'relative'
      }}>
        <div
          style={{
            width: `${progressPercent}%`,
            height: '100%',
            backgroundColor: cast.mechanic.interruptible ? '#ffd700' : '#ff0000',
            transition: 'width 0.1s linear',
            boxShadow: `0 0 10px ${cast.mechanic.interruptible ? '#ffd700' : '#ff0000'}`
          }}
        />
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          fontSize: '10px',
          color: '#ffffff',
          fontWeight: 'bold',
          textShadow: '1px 1px 2px rgba(0, 0, 0, 0.8)'
        }}>
          {progressPercent}%
        </div>
      </div>

      {/* Interruptible indicator */}
      {cast.mechanic.interruptible && (
        <div style={{
          fontSize: '10px',
          color: '#ffd700',
          textAlign: 'center',
          marginTop: '2px',
          fontStyle: 'italic'
        }}>
          INTERRUPTIBLE
        </div>
      )}
    </div>
  );
}



