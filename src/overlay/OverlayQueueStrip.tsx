import React, { useEffect, useState } from 'react';
import type { BattlefieldQueueSnapshot } from '../api/queueApi';
import { parseLaunchAtMs, queueDisplayName } from '../utils/queueSnapshot';

function roleLine(label: string, current: number, required: number): string {
  return `${label} ${current}/${required}`;
}

export interface OverlayQueueStripProps {
  queue: BattlefieldQueueSnapshot | null;
}

export const OverlayQueueStrip: React.FC<OverlayQueueStripProps> = ({ queue }) => {
  const [now, setNow] = useState(Date.now());

  const launchAtMs = queue ? parseLaunchAtMs(queue.launchAt) : null;

  useEffect(() => {
    if (!launchAtMs) return;
    const timer = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(timer);
  }, [launchAtMs]);

  if (!queue) return null;

  const code = queue.code || '----';
  const typeLabel = queue.type === 'dungeon' ? 'Dungeon' : 'Raid';

  const tank = queue.requirements?.roles?.tank;
  const healer = queue.requirements?.roles?.healer;
  const dps = queue.requirements?.roles?.dps;

  const tankCur = tank?.current ?? 0;
  const tankNeed = tank?.required ?? 1;
  const healerCur = healer?.current ?? 0;
  const healerNeed = healer?.required ?? 1;
  const dpsCur = dps?.current ?? 0;
  const dpsNeed = dps?.required ?? 3;

  const countdownSec =
    launchAtMs && launchAtMs > now ? Math.ceil((launchAtMs - now) / 1000) : null;

  const modeLabel = queueDisplayName(queue);

  return (
    <div
      style={{
        position: 'absolute',
        top: '12px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1001,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        border: '1px solid rgba(251, 191, 36, 0.5)',
        borderRadius: '8px',
        padding: '10px 18px',
        color: '#fff',
        fontFamily: 'monospace',
        fontSize: '15px',
        textAlign: 'center',
        pointerEvents: 'none',
        whiteSpace: 'nowrap',
      }}
    >
      <span style={{ color: '#fbbf24', fontWeight: 'bold' }}>{typeLabel} queue</span>
      <span> • code </span>
      <span style={{ color: '#a78bfa', fontWeight: 'bold' }}>{code}</span>
      <span>
        {' '}
        • {roleLine('T', tankCur, tankNeed)} | {roleLine('H', healerCur, healerNeed)} |{' '}
        {roleLine('D', dpsCur, dpsNeed)}
      </span>
      {countdownSec != null && (
        <span style={{ color: '#34d399', fontWeight: 'bold' }}> • starts in {countdownSec}s</span>
      )}
      {modeLabel && <span style={{ color: '#9ca3af' }}> • {modeLabel}</span>}
    </div>
  );
};
