import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { mailAPI, MailItem } from '../api/client';
import { partyAPI } from '../api/client';
import { useHero } from '../hooks/useHero';

interface MailComposeFormProps {
  onClose: () => void;
  onSent: () => void;
}

export default function MailComposeForm({ onClose, onSent }: MailComposeFormProps) {
  const { user } = useAuth();
  // Use twitchId for mail (consistent with recipient search which returns Twitch IDs)
  const userId = user?.twitchId || user?.id || '';
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
    // Stack items by name (same item type), not by individual item ID
    const itemName = item.name || '';
    const existingIndex = selectedItems.findIndex(si => (si.item.name || '') === itemName);
    
    // Calculate total available quantity for this item type across all inventory items
    const totalAvailable = inventory
      .filter(inv => (inv.name || '') === itemName)
      .reduce((sum, inv) => sum + (inv.quantity || 1), 0);
    
    if (existingIndex !== -1) {
      // Stack: increase quantity if possible
      const updated = [...selectedItems];
      const currentQuantity = updated[existingIndex].quantity;
      
      // Calculate total quantity we've already selected for this item type
      const totalSelected = selectedItems
        .filter(si => (si.item.name || '') === itemName)
        .reduce((sum, si) => sum + si.quantity, 0);
      
      if (totalSelected < totalAvailable) {
        // Can add one more
        updated[existingIndex].quantity = currentQuantity + 1;
        setSelectedItems(updated);
      }
    } else {
      // Add new item with quantity 1
      setSelectedItems([...selectedItems, { item, quantity: 1 }]);
    }
  };

  const handleRemoveItem = (itemId: string, index?: number) => {
    if (index !== undefined) {
      // Remove specific entry by index
      setSelectedItems(selectedItems.filter((_, i) => i !== index));
    } else {
      // Remove all entries of this item type (by name for stacking)
      // Find the item name first
      const itemToRemove = selectedItems.find(si => si.item.id === itemId);
      if (itemToRemove) {
        const itemName = itemToRemove.item.name || '';
        setSelectedItems(selectedItems.filter(si => (si.item.name || '') !== itemName));
      } else {
        // Fallback: remove by ID if not found
        setSelectedItems(selectedItems.filter(si => si.item.id !== itemId));
      }
    }
  };

  const handleAdjustQuantity = (itemId: string, index: number, delta: number) => {
    const currentEntry = selectedItems[index];
    if (!currentEntry) return;
    
    // Use item name for stacking instead of ID
    const itemName = currentEntry.item.name || '';
    
    // Calculate total available quantity for this item type across all inventory items
    const totalAvailable = inventory
      .filter(inv => (inv.name || '') === itemName)
      .reduce((sum, inv) => sum + (inv.quantity || 1), 0);
    
    // Calculate total quantity already selected for this item type (across all entries)
    const totalSelected = selectedItems
      .filter(si => (si.item.name || '') === itemName)
      .reduce((sum, si) => sum + si.quantity, 0);
    
    const currentQuantity = currentEntry.quantity;
    const newQuantity = currentQuantity + delta;
    
    // Check if we can adjust (must stay within available quantity)
    if (newQuantity < 1) {
      // Remove this entry if quantity goes to 0
      const updated = selectedItems.filter((_, i) => i !== index);
      setSelectedItems(updated);
      return;
    }
    
    // Check if total would exceed available
    const newTotal = totalSelected - currentQuantity + newQuantity;
    if (newTotal > totalAvailable) {
      // Can't increase beyond available
      return;
    }
    
    // Update quantity
    const updated = [...selectedItems];
    updated[index] = { ...currentEntry, quantity: newQuantity };
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
      // Stack items by name (item type) - combine quantities for same item types
      // When sending, we need to send specific item IDs from inventory, but combine quantities
      const itemMap = new Map<string, { itemId: string; quantity: number; itemName: string }>();
      
      selectedItems.forEach(si => {
        const itemName = si.item.name || '';
        const existing = itemMap.get(itemName);
        
        if (existing) {
          // Stack: add to existing quantity
          existing.quantity += si.quantity;
        } else {
          // New item type - use the first item's ID as the representative
          itemMap.set(itemName, {
            itemId: si.item.id,
            quantity: si.quantity,
            itemName: itemName
          });
        }
      });
      
      // Convert to MailItem format - backend will handle finding the actual items by type
      const items: MailItem[] = Array.from(itemMap.values()).map(entry => ({
        id: entry.itemId,
        itemId: entry.itemId,
        quantity: entry.quantity
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

  // Group items by name and calculate total quantities
  const groupedItems = inventory.reduce((acc, inv) => {
    const itemName = inv.name || '';
    if (!acc[itemName]) {
      acc[itemName] = {
        name: itemName,
        type: inv.type,
        rarity: inv.rarity,
        totalQuantity: 0,
        firstItem: inv // Keep first item for other properties
      };
    }
    acc[itemName].totalQuantity += (inv.quantity || 1);
    return acc;
  }, {} as Record<string, { name: string; type: string; rarity: string; totalQuantity: number; firstItem: any }>);

  const availableItems = Object.values(groupedItems).filter(grouped => {
    const itemName = grouped.name;
    
    // Calculate total quantity selected for this item type
    const totalSelected = selectedItems
      .filter(si => (si.item.name || '') === itemName)
      .reduce((sum, si) => sum + si.quantity, 0);
    
    // Show item if there's still quantity available for this item type
    return totalSelected < grouped.totalQuantity;
  }).filter(grouped => {
    // Filter by search term
    if (!itemSearchTerm.trim()) return true;
    const search = itemSearchTerm.toLowerCase();
    const name = (grouped.name || '').toLowerCase();
    const type = (grouped.type || '').toLowerCase();
    const rarity = (grouped.rarity || '').toLowerCase();
    return name.includes(search) || type.includes(search) || rarity.includes(search);
  }).map(grouped => ({
    ...grouped.firstItem,
    quantity: grouped.totalQuantity, // Override with total quantity
    _groupedQuantity: grouped.totalQuantity // Keep for display
  }));

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 p-4 max-h-[calc(100vh-200px)] overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-white">📬 Compose Mail</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white transition-colors text-xl"
        >
          ✕
        </button>
      </div>

      <div className="space-y-4">
        {/* Recipient Search */}
        <div>
          <label className="block text-sm text-gray-300 mb-2">To</label>
          {selectedRecipient ? (
            <div className="flex items-center justify-between bg-gray-700 rounded p-2">
              <span className="text-white text-sm">{selectedRecipient.username}</span>
              <button
                onClick={() => setSelectedRecipient(null)}
                className="text-red-400 hover:text-red-300 text-sm"
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
                <div className="mt-2 bg-gray-700 rounded border border-gray-600 max-h-32 overflow-y-auto">
                  {searchResults.map((result, index) => (
                    <button
                      key={`${result.userId}-${result.heroId}-${index}`}
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
                      <div className="text-white text-sm font-semibold">{result.username}</div>
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
            rows={3}
            maxLength={1000}
            className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500 resize-none"
          />
          <div className="text-xs text-gray-400 mt-1 text-right">
            {message.length} / 1000
          </div>
        </div>

        {/* Attachments Section */}
        <div className="border-t border-gray-600 pt-4">
          <h4 className="text-sm font-semibold text-white mb-3">Attachments</h4>

            {/* Selected Items */}
            {selectedItems.length > 0 && (
              <div className="mb-3 space-y-2">
                <div className="text-xs text-gray-300 font-semibold">Selected Items:</div>
                {selectedItems.map((si, index) => {
                  const itemName = si.item.name || '';
                  
                  // Calculate total available for this item type
                  const totalAvailable = inventory
                    .filter(inv => (inv.name || '') === itemName)
                    .reduce((sum, inv) => sum + (inv.quantity || 1), 0);
                  
                  // Calculate total selected for this item type
                  const totalSelected = selectedItems
                    .filter(s => (s.item.name || '') === itemName)
                    .reduce((sum, s) => sum + s.quantity, 0);
                  const remaining = totalAvailable - totalSelected;
                  
                  return (
                    <div key={`${si.item.name || si.item.id}-${index}`} className="flex items-center justify-between bg-gray-700 rounded p-2">
                      <div className="flex-1 min-w-0">
                        <div className="text-white text-xs font-semibold truncate">{si.item.name || 'Unknown Item'}</div>
                        <div className="text-xs text-gray-400">
                          Qty: {si.quantity} (Total: {totalSelected} / {totalAvailable} available)
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleAdjustQuantity(si.item.id, index, -1)}
                          className="px-2 py-1 bg-gray-600 hover:bg-gray-500 rounded text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={si.quantity <= 1}
                        >
                          -
                        </button>
                        <span className="text-xs text-white min-w-[2rem] text-center">{si.quantity}</span>
                        <button
                          onClick={() => handleAdjustQuantity(si.item.id, index, 1)}
                          className="px-2 py-1 bg-gray-600 hover:bg-gray-500 rounded text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={remaining <= 0}
                        >
                          +
                        </button>
                        <button
                          onClick={() => handleRemoveItem(si.item.id, index)}
                          className="px-2 py-1 bg-red-600 hover:bg-red-700 rounded text-xs ml-1"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

          {/* COD Checkbox and Amount (if items attached) */}
          {selectedItems.length > 0 && (
            <div className="mb-3 space-y-2">
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
                <span className="text-xs text-gray-300">COD (Cash on Delivery)</span>
              </label>
              {codEnabled && (
                <div>
                  <label className="block text-xs text-gray-300 mb-1">
                    COD Amount (Gold)
                  </label>
                  <input
                    type="number"
                    value={codAmount}
                    onChange={(e) => setCodAmount(Math.max(1, parseInt(e.target.value) || 1))}
                    min={1}
                    placeholder="Enter amount"
                    className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-xs focus:outline-none focus:border-blue-500"
                  />
                  <div className="text-xs text-gray-400 mt-0.5">
                    Recipient will pay this when claiming the mail.
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Add Items */}
          <div className="mb-3">
            <label className="block text-xs text-gray-300 mb-1">Add Items from Inventory</label>
            <input
              type="text"
              value={itemSearchTerm}
              onChange={(e) => setItemSearchTerm(e.target.value)}
              placeholder="Search items..."
              className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-xs focus:outline-none focus:border-blue-500 mb-1"
            />
            <div className="max-h-24 overflow-y-auto bg-gray-700 rounded border border-gray-600">
              {availableItems.length === 0 ? (
                <div className="p-2 text-center text-gray-400 text-xs">No items available</div>
              ) : (
                <div className="divide-y divide-gray-600">
                  {availableItems.map((item) => {
                    // Calculate remaining available (total - selected)
                    const itemName = item.name || '';
                    const totalSelected = selectedItems
                      .filter(si => (si.item.name || '') === itemName)
                      .reduce((sum, si) => sum + si.quantity, 0);
                    const totalAvailable = item.quantity || item._groupedQuantity || 1;
                    const remaining = totalAvailable - totalSelected;
                    
                    return (
                      <button
                        key={`${itemName}-${item.id || ''}`}
                        onClick={() => handleAddItem(item)}
                        className="w-full text-left px-2 py-1.5 hover:bg-gray-600 transition-colors"
                        disabled={remaining <= 0}
                      >
                        <div className="text-white text-xs">{item.name || 'Unknown Item'}</div>
                        <div className="text-xs text-gray-400">
                          Qty: {remaining} / {totalAvailable} available • {item.rarity || 'common'}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Gold */}
          <div className="mb-3">
            <label className="block text-xs text-gray-300 mb-1">Gold</label>
            <input
              type="number"
              value={gold}
              onChange={(e) => setGold(Math.max(0, parseInt(e.target.value) || 0))}
              min={0}
              placeholder="0"
              className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-xs focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Tokens */}
          <div>
            <label className="block text-xs text-gray-300 mb-1">Tokens</label>
            <input
              type="number"
              value={tokens}
              onChange={(e) => setTokens(Math.max(0, parseInt(e.target.value) || 0))}
              min={0}
              placeholder="0"
              className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-xs focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-4 pt-4 border-t border-gray-600">
        <button
          onClick={handleSend}
          disabled={sending || !selectedRecipient || !subject.trim() || !message.trim()}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {sending ? 'Sending...' : 'Send Mail'}
        </button>
        <button
          onClick={onClose}
          className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded text-sm font-semibold transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
