import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { mailAPI, MailItem } from '../api/client';
import { partyAPI } from '../api/client';
import { Hero } from '../types/Hero';
import { useHero } from '../hooks/useHero';

interface MailComposeModalProps {
  onClose: () => void;
  onSent: () => void;
}

export default function MailComposeModal({ onClose, onSent }: MailComposeModalProps) {
  const { user } = useAuth();
  const userId = user?.id || user?.twitchId || '';
  const { hero } = useHero(user?.twitchId || null);

  const [recipientSearch, setRecipientSearch] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{
    userId: string;
    username: string;
    heroId: string;
    heroName: string;
    heroRole: string;
    heroLevel: number;
  }>>([]);
  const [selectedRecipient, setSelectedRecipient] = useState<{
    userId: string;
    username: string;
  } | null>(null);
  
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [selectedItems, setSelectedItems] = useState<Array<{ item: any; quantity: number }>>([]);
  const [gold, setGold] = useState(0);
  const [tokens, setTokens] = useState(0);
  const [codEnabled, setCodEnabled] = useState(false);
  const [codAmount, setCodAmount] = useState(0);
  const [itemSearchTerm, setItemSearchTerm] = useState('');
  const [sending, setSending] = useState(false);

  // Load sender's inventory
  const [inventory, setInventory] = useState<any[]>([]);
  
  useEffect(() => {
    if (hero) {
      setInventory(hero.inventory || []);
    }
  }, [hero]);

  // Search for recipients
  useEffect(() => {
    const searchUsers = async () => {
      if (recipientSearch.trim().length < 2) {
        setSearchResults([]);
        return;
      }

      try {
        const response = await partyAPI.searchUsers(recipientSearch);
        if (response.success && response.matches) {
          setSearchResults(response.matches);
        }
      } catch (error) {
        console.error('Failed to search users:', error);
      }
    };

    const timeoutId = setTimeout(searchUsers, 300);
    return () => clearTimeout(timeoutId);
  }, [recipientSearch]);

  const handleAddItem = (item: any) => {
    const existingIndex = selectedItems.findIndex(si => si.item.id === item.id);
    if (existingIndex !== -1) {
      // Increase quantity
      const updated = [...selectedItems];
      const maxQuantity = item.quantity || 1;
      if (updated[existingIndex].quantity < maxQuantity) {
        updated[existingIndex].quantity += 1;
        setSelectedItems(updated);
      }
    } else {
      // Add new item
      setSelectedItems([...selectedItems, { item, quantity: 1 }]);
    }
  };

  const handleRemoveItem = (itemId: string) => {
    setSelectedItems(selectedItems.filter(si => si.item.id !== itemId));
  };

  const handleAdjustQuantity = (itemId: string, delta: number) => {
    const updated = selectedItems.map(si => {
      if (si.item.id === itemId) {
        const newQuantity = Math.max(1, Math.min(si.item.quantity || 1, si.quantity + delta));
        return { ...si, quantity: newQuantity };
      }
      return si;
    });
    setSelectedItems(updated);
  };

  const handleSend = async () => {
    if (!selectedRecipient || !subject.trim() || !message.trim()) {
      alert('Please fill in recipient, subject, and message');
      return;
    }

    if (!hero) {
      alert('No hero selected');
      return;
    }

    // Validate COD if enabled
    if (codEnabled && selectedItems.length > 0) {
      if (codAmount <= 0) {
        alert('COD amount must be greater than 0 when COD is enabled');
        return;
      }
    }

    setSending(true);
    try {
      const items: MailItem[] = selectedItems.map(si => ({
        id: si.item.id,
        itemId: si.item.id,
        quantity: si.quantity
      }));

      const response = await mailAPI.sendMail(
        userId,
        hero.id,
        selectedRecipient.userId,
        subject.trim(),
        message.trim(),
        items.length > 0 ? items : undefined,
        gold > 0 ? gold : undefined,
        tokens > 0 ? tokens : undefined,
        (codEnabled && selectedItems.length > 0) ? codAmount : 0
      );

      if (response.success) {
        onSent();
      }
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to send mail');
    } finally {
      setSending(false);
    }
  };

  const availableItems = inventory.filter(inv => {
    // Don't show already selected items (or show with remaining quantity)
    const selected = selectedItems.find(si => si.item.id === inv.id);
    if (selected) {
      return selected.quantity < (inv.quantity || 1);
    }
    return true;
  }).filter(inv => {
    // Filter by search term
    if (!itemSearchTerm.trim()) return true;
    const search = itemSearchTerm.toLowerCase();
    const name = (inv.name || '').toLowerCase();
    const type = (inv.type || '').toLowerCase();
    const rarity = (inv.rarity || '').toLowerCase();
    return name.includes(search) || type.includes(search) || rarity.includes(search);
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[9999] backdrop-blur-sm" onClick={onClose}>
      <div className="bg-gray-800 rounded-lg p-6 max-w-3xl w-full border-2 border-gray-600 shadow-2xl max-h-[90vh] overflow-y-auto relative z-[10000]" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-2xl font-bold text-white mb-4">📬 Compose Mail</h2>

        <div className="space-y-4">
          {/* Recipient Search */}
          <div>
            <label className="block text-sm text-gray-300 mb-2">To</label>
            {selectedRecipient ? (
              <div className="flex items-center justify-between bg-gray-700 rounded p-2">
                <span className="text-white">{selectedRecipient.username}</span>
                <button
                  onClick={() => setSelectedRecipient(null)}
                  className="text-red-400 hover:text-red-300"
                >
                  ✕
                </button>
              </div>
            ) : (
              <>
                <input
                  type="text"
                  value={recipientSearch}
                  onChange={(e) => setRecipientSearch(e.target.value)}
                  placeholder="Search by username or hero name..."
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                />
                {searchResults.length > 0 && (
                  <div className="mt-2 bg-gray-700 rounded border border-gray-600 max-h-40 overflow-y-auto">
                    {searchResults.map((result) => (
                      <button
                        key={result.userId}
                        onClick={() => {
                          setSelectedRecipient({
                            userId: result.userId,
                            username: result.username
                          });
                          setRecipientSearch('');
                          setSearchResults([]);
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-gray-600 transition-colors border-b border-gray-600 last:border-b-0"
                      >
                        <div className="text-white font-semibold">{result.username}</div>
                        <div className="text-xs text-gray-400">
                          {result.heroName} ({result.heroRole} Lv{result.heroLevel})
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Subject */}
          <div>
            <label className="block text-sm text-gray-300 mb-2">Subject</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Mail subject..."
              maxLength={100}
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Message */}
          <div>
            <label className="block text-sm text-gray-300 mb-2">Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Your message..."
              rows={4}
              maxLength={1000}
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500 resize-none"
            />
            <div className="text-xs text-gray-400 mt-1 text-right">
              {message.length} / 1000
            </div>
          </div>

          {/* Attachments Section */}
          <div className="border-t border-gray-600 pt-4">
            <h3 className="text-lg font-semibold text-white mb-3">Attachments</h3>

            {/* Selected Items */}
            {selectedItems.length > 0 && (
              <div className="mb-4 space-y-2">
                <div className="text-sm text-gray-300 font-semibold">Selected Items:</div>
                {selectedItems.map((si) => (
                  <div key={si.item.id} className="flex items-center justify-between bg-gray-700 rounded p-2">
                    <div className="flex-1">
                      <div className="text-white text-sm font-semibold">{si.item.name || 'Unknown Item'}</div>
                      <div className="text-xs text-gray-400">Quantity: {si.quantity}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleAdjustQuantity(si.item.id, -1)}
                        className="px-2 py-1 bg-gray-600 hover:bg-gray-500 rounded text-xs"
                      >
                        -
                      </button>
                      <button
                        onClick={() => handleAdjustQuantity(si.item.id, 1)}
                        className="px-2 py-1 bg-gray-600 hover:bg-gray-500 rounded text-xs"
                      >
                        +
                      </button>
                      <button
                        onClick={() => handleRemoveItem(si.item.id)}
                        className="px-2 py-1 bg-red-600 hover:bg-red-700 rounded text-xs"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* COD Checkbox and Amount (if items attached) */}
            {selectedItems.length > 0 && (
              <div className="mb-4 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={codEnabled}
                    onChange={(e) => {
                      setCodEnabled(e.target.checked);
                      if (!e.target.checked) {
                        setCodAmount(0);
                      }
                    }}
                    className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-300">COD (Cash on Delivery)</span>
                </label>
                {codEnabled && (
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">
                      COD Amount (Gold) - Recipient pays this when accepting mail
                    </label>
                    <input
                      type="number"
                      value={codAmount}
                      onChange={(e) => setCodAmount(Math.max(1, parseInt(e.target.value) || 1))}
                      min={1}
                      placeholder="Enter amount"
                      className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                    />
                    <div className="text-xs text-gray-400 mt-1">
                      Recipient will pay this amount when claiming the mail.
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Add Items */}
            <div className="mb-4">
              <label className="block text-sm text-gray-300 mb-2">Add Items from Inventory</label>
              <input
                type="text"
                value={itemSearchTerm}
                onChange={(e) => setItemSearchTerm(e.target.value)}
                placeholder="Search items by name, type, or rarity..."
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500 mb-2"
              />
              <div className="max-h-32 overflow-y-auto bg-gray-700 rounded border border-gray-600">
                {availableItems.length === 0 ? (
                  <div className="p-3 text-center text-gray-400 text-sm">No items available</div>
                ) : (
                  <div className="divide-y divide-gray-600">
                    {availableItems.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => handleAddItem(item)}
                        className="w-full text-left px-3 py-2 hover:bg-gray-600 transition-colors"
                      >
                        <div className="text-white text-sm">{item.name || 'Unknown Item'}</div>
                        <div className="text-xs text-gray-400">
                          Qty: {item.quantity || 1} • {item.rarity || 'common'}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Gold */}
            <div className="mb-4">
              <label className="block text-sm text-gray-300 mb-2">Gold</label>
              <input
                type="number"
                value={gold}
                onChange={(e) => setGold(Math.max(0, parseInt(e.target.value) || 0))}
                min={0}
                placeholder="0"
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Tokens */}
            <div>
              <label className="block text-sm text-gray-300 mb-2">Tokens</label>
              <input
                type="number"
                value={tokens}
                onChange={(e) => setTokens(Math.max(0, parseInt(e.target.value) || 0))}
                min={0}
                placeholder="0"
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={handleSend}
            disabled={sending || !selectedRecipient || !subject.trim() || !message.trim()}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {sending ? 'Sending...' : 'Send Mail'}
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded font-semibold transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
