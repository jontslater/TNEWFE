import Navigation from '../components/Navigation';

export default function ProfessionsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-green-900 to-gray-900">
      <Navigation />

      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">Master Your Craft</h1>
          <p className="text-xl text-gray-400">
            Choose a profession to gather resources and craft powerful items
          </p>
        </div>

        {/* Herbalism */}
        <div className="mb-16">
          <div className="bg-gradient-to-br from-green-900 to-gray-800 rounded-lg p-8 border-2 border-green-600">
            <div className="flex items-center space-x-4 mb-6">
              <span className="text-5xl">🌿</span>
              <div>
                <h2 className="text-3xl font-bold text-green-400">Herbalism</h2>
                <p className="text-gray-300">Gather herbs and craft powerful elixirs, potions, and flasks</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Gathering */}
              <div className="bg-gray-900/50 rounded-lg p-4">
                <h3 className="text-xl font-bold text-white mb-3">What You Gather</h3>
                <ul className="space-y-2 text-gray-300">
                  <li>🌿 <span className="text-green-400">Common Herbs</span> - 70% drop rate</li>
                  <li>🍀 <span className="text-blue-400">Uncommon Herbs</span> - 20% drop rate</li>
                  <li>🌸 <span className="text-purple-400">Rare Herbs</span> - 8% drop rate</li>
                  <li>🌺 <span className="text-yellow-400">Epic Herbs</span> - 2% drop rate</li>
                </ul>
                <div className="mt-4 text-sm text-gray-400">
                  40% chance to gather while traveling (not in combat)
                </div>
              </div>

              {/* Crafting */}
              <div className="bg-gray-900/50 rounded-lg p-4">
                <h3 className="text-xl font-bold text-white mb-3">What You Craft</h3>
                <div className="space-y-3">
                  <div>
                    <div className="font-semibold text-green-400">Elixirs (15-30min duration)</div>
                    <ul className="text-sm text-gray-300 ml-4 mt-1">
                      <li>• Health Elixir: +10-30% max HP</li>
                      <li>• Strength Elixir: +10-30% attack</li>
                      <li>• Defense Elixir: +10-30% defense</li>
                      <li>• Haste Elixir: +25% combat speed</li>
                      <li>• Clarity Elixir: +40% XP gain</li>
                    </ul>
                  </div>
                  <div>
                    <div className="font-semibold text-purple-400">Flasks (60min, death-proof)</div>
                    <ul className="text-sm text-gray-300 ml-4 mt-1">
                      <li>• Flask of the Titan: +25% max HP</li>
                      <li>• Flask of Power: +15% all stats</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 bg-gray-900/50 rounded-lg p-4">
              <div className="text-sm font-semibold text-white mb-2">Best For:</div>
              <div className="text-gray-300">
                Players who want powerful temporary buffs, progression raiders, and solo players who need stat boosts
              </div>
            </div>
          </div>
        </div>

        {/* Mining */}
        <div className="mb-16">
          <div className="bg-gradient-to-br from-orange-900 to-gray-800 rounded-lg p-8 border-2 border-orange-600">
            <div className="flex items-center space-x-4 mb-6">
              <span className="text-5xl">⛏️</span>
              <div>
                <h2 className="text-3xl font-bold text-orange-400">Mining</h2>
                <p className="text-gray-300">Extract ore and gems to forge permanent equipment upgrades</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Gathering */}
              <div className="bg-gray-900/50 rounded-lg p-4">
                <h3 className="text-xl font-bold text-white mb-3">What You Gather</h3>
                <ul className="space-y-2 text-gray-300">
                  <li>⚙️ <span className="text-gray-400">Iron Ore</span> - Basic upgrades</li>
                  <li>🔩 <span className="text-blue-400">Steel</span> - Intermediate upgrades</li>
                  <li>✨ <span className="text-purple-400">Mithril</span> - Advanced upgrades</li>
                  <li>💎 <span className="text-yellow-400">Adamantite</span> - Master upgrades</li>
                </ul>
                <div className="mt-4 text-sm text-gray-400">
                  35% chance to gather while traveling<br />
                  5% chance for rare gems (Ruby, Sapphire, Emerald, Diamond)
                </div>
              </div>

              {/* Crafting */}
              <div className="bg-gray-900/50 rounded-lg p-4">
                <h3 className="text-xl font-bold text-white mb-3">What You Craft</h3>
                <div className="space-y-3">
                  <div>
                    <div className="font-semibold text-orange-400">Armor Upgrades (Permanent)</div>
                    <ul className="text-sm text-gray-300 ml-4 mt-1">
                      <li>• Iron Plating: +5% defense</li>
                      <li>• Steel Reinforcement: +8% def, +3% HP</li>
                      <li>• Mithril Enhancement: +12% def, +5% HP</li>
                      <li>• Adamantite Fortification: +20% def, +10% HP</li>
                    </ul>
                  </div>
                  <div>
                    <div className="font-semibold text-red-400">Weapon Sharpening</div>
                    <ul className="text-sm text-gray-300 ml-4 mt-1">
                      <li>• Basic Whetstone: +5% attack</li>
                      <li>• Refined Oil: +8% attack, +3% crit</li>
                      <li>• Elemental Core: +12% attack, elemental proc</li>
                      <li>• Legendary Edge: +20% attack, +10% crit damage</li>
                    </ul>
                  </div>
                  <div>
                    <div className="font-semibold text-purple-400">Socketing</div>
                    <ul className="text-sm text-gray-300 ml-4 mt-1">
                      <li>• Add gem slots to equipment</li>
                      <li>• Insert stat gems (Ruby/Sapphire/Emerald/Diamond)</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 bg-gray-900/50 rounded-lg p-4">
              <div className="text-sm font-semibold text-white mb-2">Best For:</div>
              <div className="text-gray-300">
                Players who want permanent character progression, min-maxers, and those focusing on long-term power gains
              </div>
            </div>
          </div>
        </div>

        {/* Enchanting */}
        <div className="mb-16">
          <div className="bg-gradient-to-br from-purple-900 to-gray-800 rounded-lg p-8 border-2 border-purple-600">
            <div className="flex items-center space-x-4 mb-6">
              <span className="text-5xl">✨</span>
              <div>
                <h2 className="text-3xl font-bold text-purple-400">Enchanting</h2>
                <p className="text-gray-300">Imbue gear with magical effects and craft powerful runes</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Gathering */}
              <div className="bg-gray-900/50 rounded-lg p-4">
                <h3 className="text-xl font-bold text-white mb-3">What You Gather</h3>
                <ul className="space-y-2 text-gray-300">
                  <li>✨ <span className="text-purple-400">Essence</span> - From defeated enemies</li>
                  <li>🔮 More essence from stronger enemies</li>
                  <li>💫 Bonus essence from rare/epic/legendary mobs</li>
                </ul>
                <div className="mt-4 text-sm text-gray-400">
                  Automatically gathered when enemies die
                </div>
              </div>

              {/* Crafting */}
              <div className="bg-gray-900/50 rounded-lg p-4">
                <h3 className="text-xl font-bold text-white mb-3">What You Craft</h3>
                <div className="space-y-3">
                  <div>
                    <div className="font-semibold text-purple-400">Enchantments (Permanent)</div>
                    <ul className="text-sm text-gray-300 ml-4 mt-1">
                      <li>• Fiery Weapon: +50% fire damage proc</li>
                      <li>• Frozen Armor: Freeze attacker proc</li>
                      <li>• Vampiric Touch: 5% lifesteal</li>
                      <li>• Thorns of Nature: Reflect damage</li>
                      <li>• Swiftness: -10% cooldowns</li>
                      <li>• Resilience: +15% debuff resistance</li>
                    </ul>
                  </div>
                  <div>
                    <div className="font-semibold text-yellow-400">Runes (20min duration)</div>
                    <ul className="text-sm text-gray-300 ml-4 mt-1">
                      <li>• Rune of Power: +30% damage</li>
                      <li>• Rune of Warding: +30% damage reduction</li>
                      <li>• Rune of Vitality: Revive at 25% HP once</li>
                    </ul>
                  </div>
                  <div>
                    <div className="font-semibold text-blue-400">Disenchanting</div>
                    <ul className="text-sm text-gray-300 ml-4 mt-1">
                      <li>• Break down unwanted gear for essence</li>
                      <li>• Higher rarity = more essence</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 bg-gray-900/50 rounded-lg p-4">
              <div className="text-sm font-semibold text-white mb-2">Best For:</div>
              <div className="text-gray-300">
                Players who want to customize their playstyle with unique effects, raiders needing edge in difficult content
              </div>
            </div>
          </div>
        </div>

        {/* Profession Mechanics */}
        <div className="bg-gray-800 rounded-lg p-8 border border-gray-700">
          <h2 className="text-2xl font-bold text-white mb-6">How Professions Work</h2>
          
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="text-lg font-bold text-purple-400 mb-3">Choosing Your Profession</h3>
              <ul className="space-y-2 text-gray-300">
                <li>• Pick one profession per hero (permanent choice)</li>
                <li>• Use !profession [type] in Twitch chat or choose in Portal</li>
                <li>• Level up by gathering and crafting</li>
                <li>• Unlock better recipes as you level</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-bold text-purple-400 mb-3">Leveling & Progression</h3>
              <ul className="space-y-2 text-gray-300">
                <li>• Gain XP from gathering resources</li>
                <li>• Gain XP from crafting items</li>
                <li>• Higher levels unlock better recipes</li>
                <li>• Max level: 100 (Grandmaster)</li>
              </ul>
            </div>
          </div>

          <div className="bg-gray-900 rounded-lg p-6">
            <h3 className="text-lg font-bold text-white mb-3">Profession Commands</h3>
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div>
                <div className="font-semibold text-green-400 mb-2">Herbalism</div>
                <div className="text-gray-300 space-y-1">
                  <div>!gather - Check herbs</div>
                  <div>!craft [item] - Craft elixir</div>
                  <div>!use [item] - Use consumable</div>
                  <div>!recipes - View all recipes</div>
                </div>
              </div>
              <div>
                <div className="font-semibold text-orange-400 mb-2">Mining</div>
                <div className="text-gray-300 space-y-1">
                  <div>!mine - Check ore/gems</div>
                  <div>!upgrade [slot] - Upgrade gear</div>
                  <div>!socket [slot] - Add gem slot</div>
                  <div>!gem [slot] [type] - Insert gem</div>
                </div>
              </div>
              <div>
                <div className="font-semibold text-purple-400 mb-2">Enchanting</div>
                <div className="text-gray-300 space-y-1">
                  <div>!essence - Check essence</div>
                  <div>!enchant [slot] [type] - Add enchantment</div>
                  <div>!rune [type] - Apply rune</div>
                  <div>!disenchant [item] - Break for essence</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-12 bg-gradient-to-r from-green-900 to-purple-900 rounded-lg p-12 text-center">
          <h3 className="text-3xl font-bold text-white mb-4">Start Crafting Today</h3>
          <p className="text-gray-300 mb-6">
            Choose your profession and begin your journey to becoming a Grandmaster crafter
          </p>
          <button
            onClick={() => window.open('https://twitch.tv/theneverendingwar', '_blank')}
            className="bg-white hover:bg-gray-100 text-purple-900 px-8 py-3 rounded-lg font-bold transition-colors"
          >
            Join the Stream
          </button>
        </div>
      </div>
    </div>
  );
}
