/**
 * Dragon Animation Test Page
 * Test all Dragon_1 animations without combat interference
 */

import React, { useRef, useState } from 'react';
import EnemySpriteJS, { EnemySpriteJSHandle } from '../components/EnemySpriteJS';

export default function DragonAnimationTest() {
  const dragonRef = useRef<EnemySpriteJSHandle>(null);
  const [scale, setScale] = useState(6.0);
  const [facing, setFacing] = useState<'left' | 'right'>('left');
  const [currentAnim, setCurrentAnim] = useState('idle');
  
  const playAnimation = (anim: string) => {
    if (dragonRef.current) {
      console.log(`[Test] Playing: ${anim}`);
      setCurrentAnim(anim);
      dragonRef.current.playAnimation(anim);
    }
  };
  
  const playAerialSequence = () => {
    console.log('[Test] Starting AERIAL SEQUENCE...');
    
    const dragonElement = document.querySelector('[data-test-dragon]') as HTMLElement;
    if (!dragonElement) return;
    
    const originalLeft = dragonElement.style.left;
    const originalTop = dragonElement.style.top;
    
    // 1. RISE
    playAnimation('rise');
    
    // 2. FLIGHT + Move right (start BEFORE rise finishes for seamless transition)
    setTimeout(() => {
      playAnimation('flight');
      if (dragonElement) {
        dragonElement.style.transition = 'left 2s ease-in-out, top 2s ease-in-out';
        dragonElement.style.left = '1200px'; // Move to center-right
        dragonElement.style.top = '400px';
      }
    }, 1000); // Start 260ms earlier for seamless transition
    
    // 3. SPECIAL (fire breath) - start before flight finishes
    setTimeout(() => {
      playAnimation('special');
    }, 2900); // Reduced from 3420
    
    // 4. FLIGHT back (flip) - start before special finishes
    setTimeout(() => {
      playAnimation('flight');
      if (dragonElement) {
        dragonElement.style.transform = 'scaleX(-1)'; // Just flip, don't scale!
        dragonElement.style.left = originalLeft;
        dragonElement.style.top = originalTop;
      }
    }, 4800); // Reduced from 5580
    
    // 5. LANDING (flip back) - start before flight finishes
    setTimeout(() => {
      if (dragonElement) {
        dragonElement.style.transform = 'scaleX(1)'; // Flip back to normal
      }
      playAnimation('landing');
    }, 6700); // Reduced from 7740
    
    // 6. IDLE - start right when landing finishes
    setTimeout(() => {
      playAnimation('idle');
    }, 7500); // Reduced from 8640
  };
  
  return (
    <div style={{
      width: '1920px',
      height: '1080px',
      backgroundColor: '#1a1a2e',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Title */}
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        color: 'white',
        fontSize: '32px',
        fontWeight: 'bold',
        textShadow: '2px 2px 4px rgba(0,0,0,0.8)'
      }}>
        🐉 Dragon Animation Test
      </div>
      
      {/* Animation Controls */}
      <div style={{
        position: 'absolute',
        top: '80px',
        left: '20px',
        backgroundColor: 'rgba(0,0,0,0.8)',
        padding: '15px',
        borderRadius: '8px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        maxWidth: '200px'
      }}>
        <div style={{ color: 'white', fontSize: '14px', fontWeight: 'bold', marginBottom: '5px' }}>
          Animation Controls:
        </div>
        
        {/* Current Animation Display */}
        <div style={{ color: '#10b981', fontSize: '12px', fontWeight: 'bold' }}>
          Current: {currentAnim}
        </div>
        
        {/* Scale Slider */}
        <div style={{ color: 'white', fontSize: '12px' }}>
          <div>Scale: {scale.toFixed(1)}x</div>
          <input
            type="range"
            min="1"
            max="15"
            step="0.5"
            value={scale}
            onChange={(e) => setScale(parseFloat(e.target.value))}
            style={{ width: '100%' }}
          />
        </div>
        
        {/* Facing Toggle */}
        <button
          onClick={() => setFacing(f => f === 'left' ? 'right' : 'left')}
          style={{
            backgroundColor: '#6366f1',
            color: 'white',
            border: 'none',
            padding: '8px',
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          Facing: {facing} (Click to flip)
        </button>
        
        <div style={{ borderTop: '1px solid #444', margin: '5px 0' }}></div>
        
        {/* Reset Button */}
        <button
          onClick={() => playAnimation('idle')}
          style={{
            backgroundColor: '#10b981',
            color: 'white',
            border: 'none',
            padding: '8px',
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          🔄 RESET
        </button>
        
        {/* Aerial Sequence Button */}
        <button
          onClick={playAerialSequence}
          style={{
            backgroundColor: '#f59e0b',
            color: 'white',
            border: 'none',
            padding: '8px',
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          ✨ AERIAL SEQUENCE
        </button>
        
        <div style={{ borderTop: '1px solid #444', margin: '5px 0' }}></div>
        
        {/* Individual Animation Buttons */}
        <div style={{ color: 'white', fontSize: '11px', marginBottom: '3px' }}>Individual Animations:</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
          {['idle', 'attack', 'attack2', 'special', 'hurt', 'death', 'walk', 'rise', 'flight', 'landing'].map(anim => (
            <button
              key={anim}
              onClick={() => playAnimation(anim)}
              style={{
                backgroundColor: '#4b5563',
                color: 'white',
                border: currentAnim === anim ? '2px solid #10b981' : 'none',
                padding: '4px',
                borderRadius: '4px',
                fontSize: '10px',
                cursor: 'pointer'
              }}
            >
              {anim}
            </button>
          ))}
        </div>
      </div>
      
      {/* Dragon Sprite */}
      <div
        data-test-dragon
        style={{
          position: 'absolute',
          left: '800px',
          top: '500px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}
      >
        {/* Dragon Name */}
        <div style={{
          color: '#fbbf24',
          fontSize: '24px',
          fontWeight: 'bold',
          marginBottom: '10px',
          textShadow: '2px 2px 4px rgba(0,0,0,0.9)'
        }}>
          Dragon Whelp (Dragon_1)
        </div>
        
        {/* Dragon Sprite */}
        <EnemySpriteJS
          ref={dragonRef}
          enemyId="test-dragon"
          enemyType="Dragon_1"
          enemyName="Dragon_1"
          facing={facing}
          scale={scale}
        />
      </div>
      
      {/* Info Panel */}
      <div style={{
        position: 'absolute',
        bottom: '20px',
        left: '20px',
        backgroundColor: 'rgba(0,0,0,0.8)',
        padding: '15px',
        borderRadius: '8px',
        color: 'white',
        fontSize: '12px',
        maxWidth: '400px'
      }}>
        <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>📋 Animation Info:</div>
        <div>• Attack 1: 4 frames</div>
        <div>• Attack 2: 10 frames</div>
        <div>• Special: 12 frames</div>
        <div>• Hurt: 4 frames</div>
        <div>• Death: 3 frames</div>
        <div>• Idle: 7 frames</div>
        <div>• Walk: 12 frames</div>
        <div>• Rise: 7 frames</div>
        <div>• Flight: 12 frames</div>
        <div>• Landing: 5 frames</div>
        <div style={{ marginTop: '10px', color: '#fbbf24' }}>
          ✨ Click "AERIAL SEQUENCE" to see full attack!
        </div>
      </div>
    </div>
  );
}
