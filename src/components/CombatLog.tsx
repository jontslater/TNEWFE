/**
 * Enhanced Combat Log Component
 * Displays combat log with filtering and search
 */

import React, { useState, useMemo, useRef, useEffect } from 'react';

export type LogType = 'damage' | 'healing' | 'ability' | 'mechanic' | 'phase' | 'system' | 'command' | 'chat' | 'all';

export interface CombatLogEntry {
  id: string;
  timestamp: number;
  message: string;
  type: LogType;
}

interface CombatLogProps {
  entries: CombatLogEntry[];
  maxEntries?: number;
  showFilters?: boolean;
  showSearch?: boolean;
  position?: 'left' | 'right' | 'top' | 'bottom';
  autoScroll?: boolean;
}

export default function CombatLog({
  entries,
  maxEntries = 200,
  showFilters = true,
  showSearch = true,
  position = 'left',
  autoScroll = true
}: CombatLogProps) {
  const [filter, setFilter] = useState<LogType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const logRef = useRef<HTMLDivElement>(null);

  // Filter and search entries
  const filteredEntries = useMemo(() => {
    let filtered = entries;

    // Apply type filter
    if (filter !== 'all') {
      filtered = filtered.filter(entry => entry.type === filter);
    }

    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(entry =>
        entry.message.toLowerCase().includes(query)
      );
    }

    // Limit entries
    return filtered.slice(-maxEntries);
  }, [entries, filter, searchQuery, maxEntries]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (autoScroll && logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [filteredEntries, autoScroll]);

  const getTypeColor = (type: LogType): string => {
    const colors: Record<LogType, string> = {
      damage: '#ef4444',
      healing: '#4caf50',
      ability: '#2196f3',
      mechanic: '#ff9800',
      phase: '#9c27b0',
      system: '#9e9e9e',
      command: '#ffd700',
      chat: '#ffffff',
      all: '#ffffff'
    };
    return colors[type] || '#ffffff';
  };

  const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  const positionStyles: Record<string, React.CSSProperties> = {
    left: { left: '20px', top: '20px', bottom: '20px' },
    right: { right: '20px', top: '20px', bottom: '20px' },
    top: { top: '20px', left: '50%', transform: 'translateX(-50%)', maxHeight: '300px' },
    bottom: { bottom: '20px', left: '50%', transform: 'translateX(-50%)', maxHeight: '300px' }
  };

  const logTypes: LogType[] = ['all', 'damage', 'healing', 'ability', 'mechanic', 'phase', 'system'];

  return (
    <div
      style={{
        position: 'absolute',
        ...positionStyles[position],
        width: position === 'left' || position === 'right' ? '400px' : '800px',
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        border: '2px solid #ffffff',
        borderRadius: '4px',
        padding: '12px',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.5)'
      }}
    >
      {/* Header */}
      <div style={{
        fontSize: '16px',
        fontWeight: 'bold',
        color: '#ffffff',
        marginBottom: '12px',
        textAlign: 'center',
        borderBottom: '1px solid #666',
        paddingBottom: '8px'
      }}>
        Combat Log
      </div>

      {/* Filters */}
      {showFilters && (
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '4px',
          marginBottom: '8px',
          paddingBottom: '8px',
          borderBottom: '1px solid #666'
        }}>
          {logTypes.map(type => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              style={{
                padding: '4px 8px',
                fontSize: '11px',
                backgroundColor: filter === type ? getTypeColor(type) : 'rgba(255, 255, 255, 0.1)',
                color: filter === type ? '#000' : '#fff',
                border: `1px solid ${filter === type ? getTypeColor(type) : '#666'}`,
                borderRadius: '3px',
                cursor: 'pointer',
                textTransform: 'capitalize',
                fontWeight: filter === type ? 'bold' : 'normal'
              }}
            >
              {type}
            </button>
          ))}
        </div>
      )}

      {/* Search */}
      {showSearch && (
        <div style={{ marginBottom: '8px' }}>
          <input
            type="text"
            placeholder="Search combat log..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '6px 8px',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid #666',
              borderRadius: '3px',
              color: '#fff',
              fontSize: '12px'
            }}
          />
        </div>
      )}

      {/* Log entries */}
      <div
        ref={logRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '2px',
          fontSize: '11px'
        }}
      >
        {filteredEntries.length === 0 ? (
          <div style={{
            color: '#666',
            textAlign: 'center',
            padding: '20px',
            fontSize: '12px'
          }}>
            No entries found
          </div>
        ) : (
          filteredEntries.map((entry) => (
            <div
              key={entry.id}
              style={{
                padding: '4px 6px',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '2px',
                borderLeft: `3px solid ${getTypeColor(entry.type)}`,
                display: 'flex',
                gap: '8px',
                alignItems: 'flex-start'
              }}
            >
              <span style={{
                color: '#666',
                fontSize: '10px',
                minWidth: '60px',
                flexShrink: 0
              }}>
                {formatTimestamp(entry.timestamp)}
              </span>
              <span style={{
                color: getTypeColor(entry.type),
                flex: 1,
                wordBreak: 'break-word'
              }}>
                {entry.message}
              </span>
            </div>
          ))
        )}
      </div>

      {/* Entry count */}
      <div style={{
        marginTop: '8px',
        paddingTop: '8px',
        borderTop: '1px solid #666',
        fontSize: '10px',
        color: '#666',
        textAlign: 'center'
      }}>
        Showing {filteredEntries.length} of {entries.length} entries
      </div>
    </div>
  );
}



