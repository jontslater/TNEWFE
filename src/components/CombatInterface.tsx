import { useState, useEffect } from 'react';
import { formatNumber } from '../utils/format';

interface CombatParticipant {
  id: string;
  name: string;
  role: 'tank' | 'healer' | 'dps' | 'berserker' | 'sharpshooter' | 'shadow';
  level: number;
  hp: number;
  maxHp: number;
  isDead: boolean;
}

interface BossMechanic {
  name: string;
  description: string;
  cooldown?: number;
}

interface CombatLog {
  id: string;
  timestamp: number;
  type: 'damage' | 'heal' | 'mechanic' | 'death' | 'system';
  message: string;
  actor?: string;
  target?: string;
  amount?: number;
}

interface CombatInterfaceProps {
  bossName: string;
  bossHp: number;
  bossMaxHp: number;
  bossLevel: number;
  bossSprite?: string;
  mechanics: BossMechanic[];
  participants: CombatParticipant[];
  combatLogs: CombatLog[];
  duration: number; // in seconds
  elapsedTime: number; // in seconds
}

export default function CombatInterface({
  bossName,
  bossHp,
  bossMaxHp,
  bossLevel,
  bossSprite,
  mechanics,
  participants,
  combatLogs,
  duration,
  elapsedTime
}: CombatInterfaceProps) {
  const bossHpPercent = (bossHp / bossMaxHp) * 100;
  const remainingTime = duration - elapsedTime;
  const minutes = Math.floor(remainingTime / 60);
  const seconds = remainingTime % 60;

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'tank':
      case 'berserker':
        return 'bg-blue-600';
      case 'healer':
        return 'bg-green-600';
      case 'dps':
      case 'sharpshooter':
      case 'shadow':
        return 'bg-red-600';
      default:
        return 'bg-gray-600';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'tank':
      case 'berserker':
        return '🛡️';
      case 'healer':
        return '💚';
      default:
        return '⚔️';
    }
  };

  const getLogColor = (type: string) => {
    switch (type) {
      case 'damage':
        return 'text-red-400';
      case 'heal':
        return 'text-green-400';
      case 'mechanic':
        return 'text-yellow-400';
      case 'death':
        return 'text-gray-400';
      default:
        return 'text-white';
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-900">
      {/* Main Combat Area */}
      <div className="flex-1 relative bg-gradient-to-b from-gray-800 to-gray-900">
        {/* Timer - Top Left Corner */}
        <div className="absolute top-4 left-4 z-10">
          <div className="bg-black/70 px-4 py-2 rounded-lg border border-gray-600">
            <div className="text-2xl font-bold text-white font-mono">
              {minutes}:{seconds.toString().padStart(2, '0')}
            </div>
          </div>
        </div>

        {/* Boss Display - Center */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          {/* Boss Sprite/Avatar */}
          <div className="flex flex-col items-center">
            <div className="w-64 h-64 bg-gray-700 rounded-lg flex items-center justify-center text-8xl mb-4 border-4 border-red-600 shadow-2xl">
              {bossSprite || '👹'}
            </div>
            
            {/* Boss Healthbar & Name - Directly Over Boss */}
            <div className="w-80 -mt-8">
              <div className="bg-black/80 rounded-lg p-3 border-2 border-red-600">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xl font-bold text-white">{bossName}</span>
                  <span className="text-sm text-gray-400">Lv {bossLevel}</span>
                </div>
                {/* HP Bar */}
                <div className="relative h-6 bg-gray-900 rounded-full overflow-hidden border border-gray-700">
                  <div 
                    className="absolute inset-0 bg-gradient-to-r from-red-600 to-red-500 transition-all duration-300"
                    style={{ width: `${bossHpPercent}%` }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-white text-xs font-bold drop-shadow-lg">
                      {formatNumber(bossHp)} / {formatNumber(bossMaxHp)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom UI Panel */}
      <div className="h-80 bg-gray-800 border-t-2 border-gray-700 flex">
        {/* Combat Log + Mechanics */}
        <div className="flex-1 flex flex-col p-4">
          {/* Boss Mechanics - Top of Combat Log */}
          <div className="bg-yellow-900/30 rounded-lg p-3 mb-3 border border-yellow-600">
            <div className="text-yellow-400 font-semibold text-sm mb-2">⚠️ BOSS MECHANICS</div>
            <div className="flex flex-wrap gap-2">
              {mechanics.map((mechanic, idx) => (
                <div 
                  key={idx}
                  className="group relative"
                >
                  <div className="bg-yellow-800/50 px-3 py-1 rounded text-xs font-semibold text-yellow-200 cursor-help hover:bg-yellow-700/50 transition-colors">
                    {mechanic.name}
                  </div>
                  {/* Tooltip */}
                  <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block z-20">
                    <div className="bg-gray-900 text-white text-xs rounded-lg p-3 shadow-xl border border-gray-700 whitespace-nowrap max-w-xs">
                      <div className="font-bold text-yellow-400 mb-1">{mechanic.name}</div>
                      <div className="text-gray-300">{mechanic.description}</div>
                      {mechanic.cooldown && (
                        <div className="text-gray-500 mt-1">Cooldown: {mechanic.cooldown}s</div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Combat Log */}
          <div className="flex-1 bg-black/40 rounded-lg p-3 overflow-y-auto border border-gray-700">
            <div className="space-y-1 font-mono text-xs">
              {combatLogs.slice().reverse().map((log) => (
                <div key={log.id} className={`${getLogColor(log.type)}`}>
                  <span className="text-gray-500">
                    [{new Date(log.timestamp).toLocaleTimeString()}]
                  </span>{' '}
                  {log.message}
                  {log.amount && (
                    <span className="font-bold"> ({formatNumber(log.amount)})</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Raid Frames - Right Side Under Combat Log */}
        <div className="w-80 p-4 bg-gray-900/50">
          <div className="text-white font-semibold mb-3 text-sm">
            RAID MEMBERS ({participants.length})
          </div>
          <div className="space-y-2 overflow-y-auto max-h-full">
            {participants.map((participant) => {
              const hpPercent = (participant.hp / participant.maxHp) * 100;
              
              return (
                <div 
                  key={participant.id}
                  className={`bg-gray-800 rounded-lg p-2 border-2 ${
                    participant.isDead ? 'border-gray-600 opacity-50' : 'border-gray-700'
                  }`}
                >
                  {/* Name & Role */}
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm">{getRoleIcon(participant.role)}</span>
                      <span className="text-white text-sm font-semibold truncate">
                        {participant.name}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <span className={`text-xs px-2 py-0.5 rounded ${getRoleColor(participant.role)} text-white`}>
                        {participant.role}
                      </span>
                      <span className="text-xs text-gray-400">L{participant.level}</span>
                    </div>
                  </div>
                  
                  {/* HP Bar */}
                  <div className="relative h-4 bg-gray-900 rounded overflow-hidden">
                    <div 
                      className={`absolute inset-0 transition-all duration-300 ${
                        participant.isDead 
                          ? 'bg-gray-600' 
                          : hpPercent > 50 
                            ? 'bg-green-600' 
                            : hpPercent > 25 
                              ? 'bg-yellow-600' 
                              : 'bg-red-600'
                      }`}
                      style={{ width: `${hpPercent}%` }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-white text-xs font-bold drop-shadow">
                        {participant.isDead ? '💀 DEAD' : `${formatNumber(participant.hp)} / ${formatNumber(participant.maxHp)}`}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
