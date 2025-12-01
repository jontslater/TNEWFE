import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { enchantingAPI, heroAPI } from '../api/client';

export default function EnchantingPage() {
  const { user } = useAuth();
  const [hero, setHero] = useState<any>(null);
  const [enchantments, setEnchantments] = useState<any[]>([]);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [enchantmentType, setEnchantmentType] = useState('attack');
  const [enchantmentLevel, setEnchantmentLevel] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [heroData, enchantData] = await Promise.all([
        heroAPI.getHero(user!.id),
        enchantingAPI.getEnchantments(user!.id)
      ]);
      setHero(heroData);
      setEnchantments(enchantData || []);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEnchant = async () => {
    if (!selectedItem) {
      alert('Please select an item');
      return;
    }

    try {
      await enchantingAPI.applyEnchantment(
        user!.id,
        selectedItem.id,
        enchantmentType,
        enchantmentLevel
      );
      alert('Enchantment applied!');
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to apply enchantment');
    }
  };

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  if (!hero || hero.profession?.type !== 'enchanting') {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Enchanting Station</h1>
        <div className="p-4 bg-yellow-100 rounded">
          <p>You need to have the Enchanting profession to use this feature.</p>
        </div>
      </div>
    );
  }

  const equipment = hero.equipment || {};
  const equippedItems = Object.values(equipment).filter((item: any) => item !== null);

  const enchantmentTypes = [
    { id: 'attack', name: 'Attack Boost' },
    { id: 'defense', name: 'Defense Boost' },
    { id: 'hp', name: 'HP Boost' },
    { id: 'crit', name: 'Critical Strike' },
    { id: 'haste', name: 'Haste' }
  ];

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Enchanting Station</h1>

      <div className="mb-6 p-4 bg-gray-100 rounded">
        <div className="font-bold mb-2">Enchanting Profession</div>
        <div>Level: {hero.profession?.level || 0}</div>
        <div>Essence: {hero.profession?.materials?.essence || 0}</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h2 className="text-xl font-bold mb-4">Enchant Item</h2>
          
          <div className="mb-4">
            <label className="block mb-2">Select Item</label>
            <select
              value={selectedItem?.id || ''}
              onChange={(e) => {
                const item = equippedItems.find((i: any) => i.id === e.target.value);
                setSelectedItem(item || null);
              }}
              className="w-full p-2 border rounded"
            >
              <option value="">Select an equipped item...</option>
              {equippedItems.map((item: any) => (
                <option key={item.id} value={item.id}>
                  {item.name} ({item.slot})
                </option>
              ))}
            </select>
          </div>

          {selectedItem && (
            <>
              <div className="mb-4">
                <label className="block mb-2">Enchantment Type</label>
                <select
                  value={enchantmentType}
                  onChange={(e) => setEnchantmentType(e.target.value)}
                  className="w-full p-2 border rounded"
                >
                  {enchantmentTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label className="block mb-2">Enchantment Level (1-10)</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={enchantmentLevel}
                  onChange={(e) => setEnchantmentLevel(Number(e.target.value))}
                  className="w-full p-2 border rounded"
                />
                <div className="text-sm text-gray-600 mt-1">
                  Cost: {enchantmentLevel * 10} essence
                </div>
              </div>

              <button
                onClick={handleEnchant}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Apply Enchantment
              </button>
            </>
          )}
        </div>

        <div>
          <h2 className="text-xl font-bold mb-4">Enchanted Items</h2>
          {enchantments.length === 0 ? (
            <p className="text-gray-600">No enchanted items yet</p>
          ) : (
            <div className="space-y-2">
              {enchantments.map((enchanted: any) => {
                const item = equippedItems.find((i: any) => i.id === enchanted.itemId);
                return (
                  <div key={enchanted.itemId} className="p-3 bg-gray-100 rounded">
                    <div className="font-bold">{item?.name || 'Unknown Item'}</div>
                    <div className="text-sm">
                      Enchantments: {enchanted.enchantments?.length || 0}/3
                    </div>
                    {enchanted.enchantments?.map((ench: any, idx: number) => (
                      <div key={idx} className="text-xs text-gray-600">
                        {ench.type} Lv{ench.level}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
