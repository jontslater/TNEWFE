import React, { useEffect, useState } from 'react';
import type { BattlefieldQueueSnapshot } from '../api/queueApi';

function parseCountdownMs(value: unknown): number | null {
  if (value == null) return null;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? null : parsed;
  }
  if (typeof value === 'object' && value !== null && '_seconds' in value) {
    return (value as { _seconds: number })._seconds * 1000;
  }
  return null;
}

function roleLine(
  label: string,
  current: number,
  required: number
): string {
  return `${label} ${current}/${required}`;
}

export interface OverlayQueueStripProps {
  queue: BattlefieldQueueSnapshot | null;
}

export const OverlayQueueStrip: React.FC<OverlayQueueStripProps> = ({ queue }) => {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!queue) return;
    const endsAt = parseCountdownMs(queue.countdownEndsAt ?? queue.autoStartAt);
    if (!endsAt) return;
    const timer = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(timer);
  }, [queue]);

  if (!queue) return null;

  const code = queue.joinCode || queue.code || '----';
  const typeLabel = queue.type === 'dungeon' ? 'Dungeon' : 'Raid';

  const tankReq = queue.requirements?.roles?.tank;
  const healerReq = queue.requirements?.roles?.healer;
  const dpsReq = queue.requirements?.roles?.dps;

  const tankCur = tankReq?.current ?? queue.rolesFilled?.tank ?? 0;
  const tankNeed = tankReq?.required ?? queue.rolesRequired?.tank ?? 1;
  const healerCur = healerReq?.current ?? queue.rolesFilled?.healer ?? 0;
  const healerNeed = healerReq?.required ?? queue.rolesRequired?.healer ?? 1;
  const dpsCur = dpsReq?.current ?? queue.rolesFilled?.dps ?? 0;
  const dpsNeed = dpsReq?.required ?? queue.rolesRequired?.dps ?? 3;

  const endsAt = parseCountdownMs(queue.countdownEndsAt ?? queue.autoStartAt);
  const countdownSec =
    endsAt && endsAt > now ? Math.ceil((endsAt - now) / 1000) : null;

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
      {queue.name && <span style={{ color: '#9ca3af' }}> • {queue.name}</span>}
    </div>
  );
};
