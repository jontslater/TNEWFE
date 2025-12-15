import { useState } from 'react';
import { Item } from '../types/Hero';
import { getMaxSockets } from '../utils/format';
import { heroAPI } from '../api/client';

interface SocketModalProps {
  item: Item | null;
  heroId: string;
  userId: string;
  location: 'equipment' | 'inventory';
  slot?: string;
  socketItems: Item[]; // Available socket items from inventory
  onClose: () => void;
  onUpdate: () => void;
}

export default function SocketModal({
  item,
  heroId,
  userId,
  location,
  slot,
  socketItems,
  onClose,
  onUpdate
}: SocketModalProps) {
  const [selectedSocketItemId, setSelectedSocketItemId] = useState<string | null>(null);
  const [isApplying, setIsApplying] = useState(false);

  if (!item || !item.slot) return null;

  const maxSockets = item.maxSockets !== undefined ? item.maxSockets : getMaxSockets(item.rarity || 'common', item.slot);
  const currentSockets = item.sockets || [];
  const socketCount = currentSockets.length;
  const canAddSocket = socketCount < maxSockets;

  const handleApplySocket = async () => {
    if (!selectedSocketItemId || !item.id) return;

    setIsApplying(true);
    try {
      await heroAPI.applySocket(userId, heroId, item.id, selectedSocketItemId, slot);
      onUpdate();
      onClose();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to apply socket');
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full border border-gray-700">
        <h2 className="text-2xl font-bold text-white mb-4">Apply Socket</h2>
        
        <div className="mb-4">
          <div className="text-gray-300 mb-2">
            <span className="font-semibold">{item.name}</span>
            <span className="text-gray-400 text-sm ml-2">({item.slot})</span>
          </div>
          <div className="text-sm text-gray-400">
            Sockets: {socketCount}/{maxSockets}
          </div>
        </div>

        {!canAddSocket ? (
          <div className="text-red-400 mb-4">
            This item has reached its maximum socket capacity ({maxSockets} sockets).
          </div>
        ) : (
          <>
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Select Socket Item:
              </label>
              {socketItems.length === 0 ? (
                <div className="text-gray-400 text-sm">
                  No socket items found in inventory. Craft a "Gem Socket" item using Mining profession (requires Mining level 50+, 5 Mithril + 2 Adamantite, 500g).
                </div>
              ) : (
                <select
                  value={selectedSocketItemId || ''}
                  onChange={(e) => setSelectedSocketItemId(e.target.value)}
                  className="w-full bg-gray-700 text-white rounded px-3 py-2 border border-gray-600"
                >
                  <option value="">Select a socket item...</option>
                  {socketItems.map((socketItem) => (
                    <option key={socketItem.id} value={socketItem.id}>
                      {socketItem.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 rounded transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleApplySocket}
                disabled={!selectedSocketItemId || isApplying}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:text-gray-400 text-white py-2 rounded transition-colors"
              >
                {isApplying ? 'Applying...' : 'Apply Socket'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}








