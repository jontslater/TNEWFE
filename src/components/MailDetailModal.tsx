import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { mailAPI, Mail } from '../api/client';
import { useHero } from '../hooks/useHero';

interface MailDetailModalProps {
  mail: Mail;
  onClose: () => void;
  onClaimed: () => void;
}

export default function MailDetailModal({ mail, onClose, onClaimed }: MailDetailModalProps) {
  const { user } = useAuth();
  const userId = user?.id || user?.twitchId || '';
  const { hero } = useHero(user?.twitchId || null);
  
  const [claiming, setClaiming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasAttachments = (mail.items && mail.items.length > 0) || 
                         (mail.gold && mail.gold > 0) || 
                         (mail.tokens && mail.tokens > 0);

  const handleClaim = async () => {
    if (!hero) {
      alert('No hero selected');
      return;
    }

    // Check COD payment
    if (mail.codAmount && mail.codAmount > 0) {
      const heroGold = hero.gold || 0;
      if (heroGold < mail.codAmount) {
        setError(`Insufficient gold. COD amount: ${mail.codAmount}g, you have: ${heroGold}g`);
        return;
      }

      if (!confirm(`This mail requires payment of ${mail.codAmount}g (COD). Do you want to claim it?`)) {
        return;
      }
    }

    setClaiming(true);
    setError(null);

    try {
      const response = await mailAPI.claimMail(mail.id, userId, hero.id);
      if (response.success) {
        if (response.codPaid > 0) {
          alert(`Mail claimed successfully! Paid ${response.codPaid}g COD.`);
        } else {
          alert('Mail claimed successfully!');
        }
        onClaimed();
      }
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to claim mail');
    } finally {
      setClaiming(false);
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[9999] backdrop-blur-sm" onClick={onClose}>
      <div className="bg-gray-800 rounded-lg p-6 max-w-2xl w-full border-2 border-gray-600 shadow-2xl max-h-[90vh] overflow-y-auto relative z-[10000]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-white">{mail.subject}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          {/* From */}
          <div>
            <span className="text-sm text-gray-400">From: </span>
            <span className="text-white font-semibold">{mail.senderName}</span>
          </div>

          {/* Date */}
          <div>
            <span className="text-sm text-gray-400">Date: </span>
            <span className="text-white">{formatDate(mail.createdAt)}</span>
          </div>

          {/* COD Warning */}
          {mail.codAmount && mail.codAmount > 0 && !mail.claimed && (
            <div className="p-3 bg-yellow-900/30 border border-yellow-600 rounded">
              <div className="text-yellow-300 font-semibold mb-1">⚠️ COD Payment Required</div>
              <div className="text-yellow-200 text-sm">
                This mail requires payment of <strong>{mail.codAmount}g</strong> when claiming.
                {hero && (hero.gold || 0) < mail.codAmount && (
                  <div className="text-red-300 mt-1">
                    ⚠️ You don't have enough gold! (You have: {hero.gold || 0}g)
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Message */}
          <div className="p-4 bg-gray-700 rounded border border-gray-600">
            <div className="text-white whitespace-pre-wrap break-words">{mail.message}</div>
          </div>

          {/* Attachments */}
          {hasAttachments && (
            <div className="border-t border-gray-600 pt-4">
              <h3 className="text-lg font-semibold text-white mb-3">Attachments</h3>

              {/* Items */}
              {mail.items && mail.items.length > 0 && (
                <div className="mb-4">
                  <div className="text-sm text-gray-300 font-semibold mb-2">Items ({mail.items.length}):</div>
                  <div className="space-y-2">
                    {mail.items.map((item, idx) => (
                      <div key={idx} className="bg-gray-700 rounded p-3 border border-gray-600">
                        <div className="text-white font-semibold">{item.name || 'Unknown Item'}</div>
                        {item.quantity && item.quantity > 1 && (
                          <div className="text-xs text-gray-400">Quantity: {item.quantity}</div>
                        )}
                        {item.rarity && (
                          <div className="text-xs text-gray-400">Rarity: {item.rarity}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Gold */}
              {mail.gold && mail.gold > 0 && (
                <div className="mb-2">
                  <span className="text-white font-semibold">💰 Gold: </span>
                  <span className="text-yellow-400">{mail.gold.toLocaleString()}g</span>
                </div>
              )}

              {/* Tokens */}
              {mail.tokens && mail.tokens > 0 && (
                <div>
                  <span className="text-white font-semibold">💎 Tokens: </span>
                  <span className="text-purple-400">{mail.tokens.toLocaleString()}t</span>
                </div>
              )}
            </div>
          )}

          {/* Expiration Warning */}
          {mail.daysUntilExpiry !== undefined && mail.daysUntilExpiry > 0 && (
            <div className={`p-3 rounded border ${
              mail.daysUntilExpiry <= 7 
                ? 'bg-yellow-900/30 border-yellow-600 text-yellow-300' 
                : 'bg-gray-700 border-gray-600 text-gray-300'
            }`}>
              <div className="text-sm">
                This mail expires in <strong>{mail.daysUntilExpiry} day{mail.daysUntilExpiry !== 1 ? 's' : ''}</strong>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-900/30 border border-red-600 rounded text-red-300">
              {error}
            </div>
          )}

          {/* Status */}
          {mail.claimed && (
            <div className="p-3 bg-green-900/30 border border-green-600 rounded text-green-300">
              ✓ This mail has been claimed
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          {!mail.claimed && hasAttachments && (
            <button
              onClick={handleClaim}
              disabled={claiming || (mail.codAmount && mail.codAmount > 0 && hero && (hero.gold || 0) < mail.codAmount)}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {claiming ? 'Claiming...' : mail.codAmount && mail.codAmount > 0 
                ? `Claim & Pay ${mail.codAmount}g COD` 
                : 'Claim Attachments'}
            </button>
          )}
          <button
            onClick={onClose}
            className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
