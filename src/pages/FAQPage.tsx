import Navigation from '../components/Navigation';

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-purple-900 to-gray-900">
      <Navigation />

      <div className="container mx-auto px-4 py-12 max-w-6xl">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">Frequently Asked Questions</h1>
          <p className="text-xl text-gray-400">
            Everything you need to know about The Never Ending War
          </p>
        </div>

        {/* Getting Started */}
        <div className="bg-gray-800 rounded-lg p-8 mb-8 border-2 border-purple-600">
          <h2 className="text-3xl font-bold text-purple-400 mb-6">🚀 Getting Started</h2>
          
          <div className="space-y-4 text-gray-300">
            <div>
              <h3 className="text-xl font-bold text-white mb-2">How do I join the game?</h3>
              <p>Type <code className="bg-gray-900 px-2 py-1 rounded text-green-400">!join [class]</code> in Twitch chat to create your first character and join the battlefield!</p>
            </div>

            <div>
              <h3 className="text-xl font-bold text-white mb-2">Available Classes</h3>
              <div className="grid md:grid-cols-3 gap-4 mt-3">
                <div className="bg-gray-900/50 rounded p-3">
                  <div className="font-semibold text-blue-400 mb-2">Tanks</div>
                  <div className="text-sm space-y-1">
                    <div>Guardian, Paladin, Warden</div>
                    <div>Blood Knight, Vanguard, Brewmaster</div>
                  </div>
                </div>
                <div className="bg-gray-900/50 rounded p-3">
                  <div className="font-semibold text-green-400 mb-2">Healers</div>
                  <div className="text-sm space-y-1">
                    <div>Cleric, Druid, Shaman</div>
                    <div>Monk, Bard, Priest</div>
                  </div>
                </div>
                <div className="bg-gray-900/50 rounded p-3">
                  <div className="font-semibold text-red-400 mb-2">DPS</div>
                  <div className="text-sm space-y-1">
                    <div>Warrior, Rogue, Mage</div>
                    <div>Ranger, Warlock, Necromancer</div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-bold text-white mb-2">Multiple Characters</h3>
              <p>You can create multiple characters! Use <code className="bg-gray-900 px-2 py-1 rounded text-green-400">!join [class]</code> again to create another character. Use <code className="bg-gray-900 px-2 py-1 rounded text-green-400">!heroes</code> to see all your characters and <code className="bg-gray-900 px-2 py-1 rounded text-green-400">!join [number]</code> to switch between them.</p>
            </div>
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-gray-800 rounded-lg p-8 mb-8 border-2 border-indigo-600">
          <h2 className="text-3xl font-bold text-indigo-400 mb-6">🎮 How It Works</h2>
          
          <div className="space-y-6 text-gray-300">
            <div>
              <h3 className="text-xl font-bold text-white mb-3">Core Gameplay</h3>
              <p className="mb-3">
                <strong className="text-indigo-400">The Never Ending War</strong> is an idle RPG where your character automatically fights enemies on the battlefield. 
                You control your character through chat commands to attack, heal, use abilities, and manage your gear.
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong className="text-yellow-400">Idle Adventure:</strong> Your character automatically fights enemies and gains XP/gold when you're not actively commanding</li>
                <li><strong className="text-yellow-400">Active Combat:</strong> Use chat commands to control your character in real-time during combat</li>
                <li><strong className="text-yellow-400">Progression:</strong> Level up, collect gear, and improve your character's power over time</li>
                <li><strong className="text-yellow-400">Persistence:</strong> Your character and progress are saved between streams</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-bold text-white mb-3">Combat System</h3>
              <div className="bg-gray-900/50 rounded-lg p-4 mb-3">
                <p className="mb-2">Combat happens automatically, but you can influence it with commands:</p>
                <ul className="list-disc list-inside space-y-1 ml-4 text-sm">
                  <li><strong className="text-red-400">Auto-Combat:</strong> Your character attacks enemies automatically every few seconds</li>
                  <li><strong className="text-red-400">Manual Commands:</strong> Use <code className="bg-gray-800 px-1 rounded">!attack</code>, <code className="bg-gray-800 px-1 rounded">!heal</code>, <code className="bg-gray-800 px-1 rounded">!ability</code> for strategic control</li>
                  <li><strong className="text-red-400">Cooldowns:</strong> Commands have cooldowns - use them wisely!</li>
                  <li><strong className="text-red-400">Role-Based:</strong> Tanks protect, Healers support, DPS deal damage</li>
                </ul>
              </div>
              <p className="text-sm text-gray-400">
                Enemies scale with your level and party size. The more heroes on the battlefield, the stronger enemies become, but you also get better loot!
              </p>
            </div>

            <div>
              <h3 className="text-xl font-bold text-white mb-3">Stats & Progression</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-gray-900/50 rounded-lg p-4">
                  <h4 className="font-bold text-cyan-400 mb-2">Core Stats</h4>
                  <ul className="space-y-1 text-sm">
                    <li><strong>HP:</strong> Health points - when it reaches 0, you die</li>
                    <li><strong>Attack:</strong> Damage you deal to enemies</li>
                    <li><strong>Defense:</strong> Reduces damage taken</li>
                    <li><strong>Level:</strong> Increases all stats and unlocks abilities</li>
                  </ul>
                </div>
                <div className="bg-gray-900/50 rounded-lg p-4">
                  <h4 className="font-bold text-purple-400 mb-2">Progression</h4>
                  <ul className="space-y-1 text-sm">
                    <li><strong>XP:</strong> Gain from defeating enemies</li>
                    <li><strong>Gold:</strong> Earned from selling items and combat</li>
                    <li><strong>Tokens:</strong> Earned from quests, used in shop</li>
                    <li><strong>Gear Score:</strong> Overall power level of your equipment</li>
                  </ul>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-bold text-white mb-3">Loot & Equipment</h3>
              <div className="bg-gray-900/50 rounded-lg p-4">
                <p className="mb-2">Items drop from defeated enemies with different rarities:</p>
                <div className="grid md:grid-cols-5 gap-2 text-sm">
                  <div><span className="text-gray-400">Common</span> - Basic stats</div>
                  <div><span className="text-green-400">Uncommon</span> - Better stats</div>
                  <div><span className="text-blue-400">Rare</span> - Good stats</div>
                  <div><span className="text-purple-400">Epic</span> - Great stats</div>
                  <div><span className="text-yellow-400">Legendary</span> - Best stats</div>
                </div>
                <p className="mt-3 text-sm text-gray-400">
                  Higher rarity items have better base stats and can be upgraded/enchanted more. 
                  Use the Portal to manage your inventory and equipment easily.
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-bold text-white mb-3">Viewer Bonuses & Engagement</h3>
              <div className="bg-gray-900/50 rounded-lg p-4">
                <p className="mb-2">The game rewards active chat participation:</p>
                <ul className="list-disc list-inside space-y-1 ml-4 text-sm">
                  <li><strong className="text-green-400">Active Chatters:</strong> +1% damage and healing per active chatter (users who chatted in last hour)</li>
                  <li><strong className="text-green-400">Defense Bonus:</strong> +0.5% defense per active chatter</li>
                  <li><strong className="text-green-400">Rested XP:</strong> Gain bonus XP when you chat (1.5x multiplier)</li>
                  <li><strong className="text-green-400">Loot Bonus:</strong> More active chatters = better loot chances</li>
                </ul>
                <p className="mt-3 text-xs text-gray-400">
                  The more active your chat is, the stronger your character becomes! Chatting in the stream helps everyone.
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-bold text-white mb-3">Professions & Crafting</h3>
              <div className="bg-gray-900/50 rounded-lg p-4">
                <p className="mb-2">Choose one profession to specialize in crafting:</p>
                <ul className="list-disc list-inside space-y-1 ml-4 text-sm">
                  <li><strong className="text-green-400">Herbalism:</strong> Craft consumable elixirs and potions for temporary buffs</li>
                  <li><strong className="text-orange-400">Mining:</strong> Upgrade gear permanently and add gem sockets for stat bonuses</li>
                  <li><strong className="text-purple-400">Enchanting:</strong> Apply unique enchantments to gear (fire damage, life steal, etc.)</li>
                </ul>
                <p className="mt-3 text-xs text-gray-400">
                  Professions are permanent - choose based on your playstyle. Level up by gathering materials and crafting items.
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-bold text-white mb-3">Raids & Dungeons</h3>
              <div className="bg-gray-900/50 rounded-lg p-4">
                <p className="mb-2">Team up with other players for challenging content:</p>
                <ul className="list-disc list-inside space-y-1 ml-4 text-sm">
                  <li><strong className="text-red-400">Raids:</strong> Multi-wave boss fights requiring coordination</li>
                  <li><strong className="text-red-400">Dungeons:</strong> Multi-room adventures with increasing difficulty</li>
                  <li><strong className="text-red-400">Rewards:</strong> Epic and legendary gear, tokens, and XP</li>
                  <li><strong className="text-red-400">Coordination:</strong> Use combat commands together with your team</li>
                </ul>
                <p className="mt-3 text-xs text-gray-400">
                  Raids and dungeons scale with party size and level. Work together to defeat powerful bosses!
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-bold text-white mb-3">Auto-Combat Mode</h3>
              <div className="bg-gray-900/50 rounded-lg p-4">
                <p className="mb-2">Enable auto-combat for hands-free gameplay:</p>
                <ul className="list-disc list-inside space-y-1 ml-4 text-sm">
                  <li>Use <code className="bg-gray-800 px-1 rounded">!auto</code> to toggle auto-combat on/off</li>
                  <li>Your character will automatically use attacks and abilities</li>
                  <li>You can still use manual commands for strategic moments</li>
                  <li>Perfect for when you're away but want to keep progressing</li>
                </ul>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-bold text-white mb-3">Tips for Success</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 rounded-lg p-4">
                  <h4 className="font-bold text-purple-400 mb-2">Early Game</h4>
                  <ul className="space-y-1 text-sm">
                    <li>• Join with <code className="bg-gray-800 px-1 rounded">!join [class]</code></li>
                    <li>• Let auto-combat do the work</li>
                    <li>• Equip better gear as it drops</li>
                    <li>• Complete daily quests for tokens</li>
                  </ul>
                </div>
                <div className="bg-gradient-to-br from-green-900/30 to-yellow-900/30 rounded-lg p-4">
                  <h4 className="font-bold text-green-400 mb-2">Mid/Late Game</h4>
                  <ul className="space-y-1 text-sm">
                    <li>• Choose a profession and level it up</li>
                    <li>• Upgrade and enchant your gear</li>
                    <li>• Join raids for epic loot</li>
                    <li>• Use the Portal for inventory management</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Combat Commands */}
        <div className="bg-gray-800 rounded-lg p-8 mb-8 border-2 border-red-600">
          <h2 className="text-3xl font-bold text-red-400 mb-6">⚔️ Combat Commands</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-bold text-white mb-2">Basic Combat</h3>
                <div className="space-y-2 text-gray-300">
                  <div><code className="bg-gray-900 px-2 py-1 rounded text-green-400">!attack</code> or <code className="bg-gray-900 px-2 py-1 rounded text-green-400">!a</code> - Attack the current target (2s cooldown)</div>
                  <div><code className="bg-gray-900 px-2 py-1 rounded text-green-400">!heal</code> or <code className="bg-gray-900 px-2 py-1 rounded text-green-400">!h</code> - Heal the lowest HP ally (Healers only, 3s cooldown)</div>
                  <div><code className="bg-gray-900 px-2 py-1 rounded text-green-400">!ability</code> or <code className="bg-gray-900 px-2 py-1 rounded text-green-400">!cast</code> - Use your class ability (5s cooldown)</div>
                  <div><code className="bg-gray-900 px-2 py-1 rounded text-green-400">!defend</code> - Enter defensive stance (Tanks only, 1s cooldown)</div>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-bold text-white mb-2">Support Commands</h3>
                <div className="space-y-2 text-gray-300">
                  <div><code className="bg-gray-900 px-2 py-1 rounded text-green-400">!dispel</code> - Remove debuffs from yourself or allies (5s cooldown)</div>
                  <div><code className="bg-gray-900 px-2 py-1 rounded text-green-400">!rest</code> - Rest to recover HP (5min cooldown)</div>
                  <div><code className="bg-gray-900 px-2 py-1 rounded text-green-400">!potion</code> - Use a health potion from inventory</div>
                </div>
              </div>
            </div>

            <div className="bg-gray-900/50 rounded-lg p-4">
              <h3 className="text-lg font-bold text-yellow-400 mb-3">Combat Tips</h3>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>• Commands have cooldowns - use them strategically!</li>
                <li>• Tanks should use !defend to protect the party</li>
                <li>• Healers should prioritize !heal for party survival</li>
                <li>• DPS should focus on !attack and !ability for damage</li>
                <li>• Use !rest when out of combat to recover HP</li>
                <li>• Keep health potions in your inventory for emergencies</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Character Management */}
        <div className="bg-gray-800 rounded-lg p-8 mb-8 border-2 border-blue-600">
          <h2 className="text-3xl font-bold text-blue-400 mb-6">👤 Character Management</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-bold text-white mb-2">Character Commands</h3>
                <div className="space-y-2 text-gray-300">
                  <div><code className="bg-gray-900 px-2 py-1 rounded text-green-400">!join [class]</code> - Create a new character or join with existing</div>
                  <div><code className="bg-gray-900 px-2 py-1 rounded text-green-400">!join [number]</code> - Switch to a different character (use !heroes to see numbers)</div>
                  <div><code className="bg-gray-900 px-2 py-1 rounded text-green-400">!leave</code> - Leave the battlefield (saves your progress)</div>
                  <div><code className="bg-gray-900 px-2 py-1 rounded text-green-400">!heroes</code> - List all your characters</div>
                  <div><code className="bg-gray-900 px-2 py-1 rounded text-green-400">!stats</code> or <code className="bg-gray-900 px-2 py-1 rounded text-green-400">!s</code> - View your character stats</div>
                  <div><code className="bg-gray-900 px-2 py-1 rounded text-green-400">!gear</code> or <code className="bg-gray-900 px-2 py-1 rounded text-green-400">!g</code> - View your equipped gear</div>
                  <div><code className="bg-gray-900 px-2 py-1 rounded text-green-400">!classes</code> - View all available classes</div>
                </div>
              </div>
            </div>

            <div className="bg-gray-900/50 rounded-lg p-4">
              <h3 className="text-lg font-bold text-cyan-400 mb-3">Character Info</h3>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>• Your character persists between streams</li>
                <li>• Gold and tokens are shared across all characters</li>
                <li>• Each character has separate inventory and equipment</li>
                <li>• Use the Portal on the website to manage your characters</li>
                <li>• Characters gain XP and level up automatically in combat</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Profession Commands */}
        <div className="bg-gray-800 rounded-lg p-8 mb-8 border-2 border-green-600">
          <h2 className="text-3xl font-bold text-green-400 mb-6">🌿 Profession Commands</h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-gray-900/50 rounded-lg p-4">
              <h3 className="text-lg font-bold text-green-400 mb-3">Herbalism</h3>
              <div className="space-y-2 text-sm text-gray-300">
                <div><code className="bg-gray-800 px-2 py-1 rounded text-green-300">!profession herbalism</code> - Choose Herbalism</div>
                <div><code className="bg-gray-800 px-2 py-1 rounded text-green-300">!gather</code> - Gather herbs (40% chance while traveling)</div>
                <div><code className="bg-gray-800 px-2 py-1 rounded text-green-300">!craft [item]</code> - Craft elixirs and potions</div>
                <div><code className="bg-gray-800 px-2 py-1 rounded text-green-300">!use [item]</code> - Use a consumable item</div>
                <div><code className="bg-gray-800 px-2 py-1 rounded text-green-300">!recipes</code> - View all available recipes</div>
              </div>
              <div className="mt-3 text-xs text-gray-400">
                Craft: Health Elixirs, Strength Elixirs, Defense Elixirs, Haste Elixirs, Clarity Elixirs, Flasks
              </div>
            </div>

            <div className="bg-gray-900/50 rounded-lg p-4">
              <h3 className="text-lg font-bold text-orange-400 mb-3">Mining</h3>
              <div className="space-y-2 text-sm text-gray-300">
                <div><code className="bg-gray-800 px-2 py-1 rounded text-orange-300">!profession mining</code> - Choose Mining</div>
                <div><code className="bg-gray-800 px-2 py-1 rounded text-orange-300">!mine</code> - Check ore and gems</div>
                <div><code className="bg-gray-800 px-2 py-1 rounded text-orange-300">!upgrade [slot]</code> - Apply upgrade to gear</div>
                <div><code className="bg-gray-800 px-2 py-1 rounded text-orange-300">!socket [slot]</code> - Add gem socket to gear</div>
                <div><code className="bg-gray-800 px-2 py-1 rounded text-orange-300">!gem [slot] [type]</code> - Insert gem into socket</div>
              </div>
              <div className="mt-3 text-xs text-gray-400">
                Craft: Weapon Upgrades, Armor Upgrades, Gem Sockets, Insert Gems
              </div>
            </div>

            <div className="bg-gray-900/50 rounded-lg p-4">
              <h3 className="text-lg font-bold text-purple-400 mb-3">Enchanting</h3>
              <div className="space-y-2 text-sm text-gray-300">
                <div><code className="bg-gray-800 px-2 py-1 rounded text-purple-300">!profession enchanting</code> - Choose Enchanting</div>
                <div><code className="bg-gray-800 px-2 py-1 rounded text-purple-300">!essence</code> - Check your enchanting essence</div>
                <div><code className="bg-gray-800 px-2 py-1 rounded text-purple-300">!enchant [slot] [type]</code> - Apply enchantment to gear</div>
                <div><code className="bg-gray-800 px-2 py-1 rounded text-purple-300">!rune [type]</code> - Apply temporary rune buff</div>
                <div><code className="bg-gray-800 px-2 py-1 rounded text-purple-300">!disenchant [item]</code> - Break down gear for essence</div>
              </div>
              <div className="mt-3 text-xs text-gray-400">
                Craft: Fiery Weapon, Frozen Armor, Vampiric Touch, Thorns, Swiftness, Resilience, Runes
              </div>
            </div>
          </div>

          <div className="mt-6 bg-gray-900/50 rounded-lg p-4">
            <h3 className="text-lg font-bold text-yellow-400 mb-3">Profession Tips</h3>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>• Choose your profession in the Portal or with <code className="bg-gray-800 px-2 py-1 rounded">!profession [type]</code></li>
              <li>• Professions are permanent - choose carefully!</li>
              <li>• Level up by gathering and crafting to unlock better recipes</li>
              <li>• Use the Portal's Crafting Station for easier crafting</li>
              <li>• Herbalism: Best for temporary buffs and consumables</li>
              <li>• Mining: Best for permanent gear upgrades</li>
              <li>• Enchanting: Best for unique effects and customization</li>
            </ul>
          </div>
        </div>

        {/* Inventory & Equipment */}
        <div className="bg-gray-800 rounded-lg p-8 mb-8 border-2 border-yellow-600">
          <h2 className="text-3xl font-bold text-yellow-400 mb-6">🎒 Inventory & Equipment</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-bold text-white mb-2">Inventory Commands</h3>
                <div className="space-y-2 text-gray-300">
                  <div><code className="bg-gray-900 px-2 py-1 rounded text-green-400">!inventory</code> - View your inventory</div>
                  <div><code className="bg-gray-900 px-2 py-1 rounded text-green-400">!equip [slot] [item]</code> - Equip an item</div>
                  <div><code className="bg-gray-900 px-2 py-1 rounded text-green-400">!sell [item]</code> - Sell an item for gold</div>
                  <div><code className="bg-gray-900 px-2 py-1 rounded text-green-400">!shop</code> - View the shop</div>
                  <div><code className="bg-gray-900 px-2 py-1 rounded text-green-400">!buy [item]</code> - Buy an item from shop</div>
                </div>
              </div>
            </div>

            <div className="bg-gray-900/50 rounded-lg p-4">
              <h3 className="text-lg font-bold text-cyan-400 mb-3">Equipment Tips</h3>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>• Items drop from defeated enemies</li>
                <li>• Higher rarity items have better stats</li>
                <li>• You can upgrade gear with Mining profession</li>
                <li>• Enchant gear with Enchanting profession</li>
                <li>• Add gem sockets to gear for stat bonuses</li>
                <li>• Use the Portal to manage inventory easily</li>
                <li>• Lock items to prevent accidental selling</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Quests & Progression */}
        <div className="bg-gray-800 rounded-lg p-8 mb-8 border-2 border-cyan-600">
          <h2 className="text-3xl font-bold text-cyan-400 mb-6">📜 Quests & Progression</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-bold text-white mb-2">Quest Commands</h3>
                <div className="space-y-2 text-gray-300">
                  <div><code className="bg-gray-900 px-2 py-1 rounded text-green-400">!quest</code> - View your current quests</div>
                  <div><code className="bg-gray-900 px-2 py-1 rounded text-green-400">!claim</code> - Claim completed quest rewards</div>
                  <div><code className="bg-gray-900 px-2 py-1 rounded text-green-400">!tokens</code> - Check your token balance</div>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-bold text-white mb-2">Quest Types</h3>
                <div className="space-y-2 text-sm text-gray-300">
                  <div><strong className="text-yellow-400">Daily Quests:</strong> Reset every day, smaller rewards</div>
                  <div><strong className="text-purple-400">Weekly Quests:</strong> Reset every week, better rewards</div>
                  <div><strong className="text-cyan-400">Monthly Quests:</strong> Reset every month, best rewards</div>
                </div>
              </div>
            </div>

            <div className="bg-gray-900/50 rounded-lg p-4">
              <h3 className="text-lg font-bold text-yellow-400 mb-3">Progression Tips</h3>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>• Complete quests to earn tokens and XP</li>
                <li>• Claim quest rewards in the Portal</li>
                <li>• Tokens can be used in the shop</li>
                <li>• Level up to unlock new abilities</li>
                <li>• Higher levels = better gear drops</li>
                <li>• Participate in raids for epic rewards</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Raids */}
        <div className="bg-gray-800 rounded-lg p-8 mb-8 border-2 border-red-600">
          <h2 className="text-3xl font-bold text-red-400 mb-6">🏰 Raids</h2>
          
          <div className="space-y-4 text-gray-300">
            <div>
              <h3 className="text-xl font-bold text-white mb-2">Raid Commands</h3>
              <div className="space-y-2">
                <div><code className="bg-gray-900 px-2 py-1 rounded text-green-400">!raid</code> - View available raids</div>
                <div><code className="bg-gray-900 px-2 py-1 rounded text-green-400">!joinraid [raid]</code> - Join a raid instance</div>
                <div>All combat commands work in raids: <code className="bg-gray-900 px-2 py-1 rounded text-green-400">!attack</code>, <code className="bg-gray-900 px-2 py-1 rounded text-green-400">!heal</code>, <code className="bg-gray-900 px-2 py-1 rounded text-green-400">!ability</code>, etc.</div>
              </div>
            </div>

            <div className="bg-gray-900/50 rounded-lg p-4">
              <h3 className="text-lg font-bold text-yellow-400 mb-3">Raid Tips</h3>
              <ul className="space-y-2 text-sm">
                <li>• Raids require coordination - work with your team!</li>
                <li>• Bosses have special mechanics - watch for warnings</li>
                <li>• Raids drop epic and legendary gear</li>
                <li>• Higher difficulty raids = better rewards</li>
                <li>• Use the Portal to view raid information</li>
              </ul>
            </div>
          </div>
        </div>

        {/* General Information */}
        <div className="bg-gray-800 rounded-lg p-8 mb-8 border-2 border-purple-600">
          <h2 className="text-3xl font-bold text-purple-400 mb-6">ℹ️ General Information</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-bold text-white mb-2">Utility Commands</h3>
                <div className="space-y-2 text-gray-300">
                  <div><code className="bg-gray-900 px-2 py-1 rounded text-green-400">!auto</code> - Toggle auto-combat mode</div>
                  <div><code className="bg-gray-900 px-2 py-1 rounded text-green-400">!skills</code> - View your character's skills</div>
                  <div><code className="bg-gray-900 px-2 py-1 rounded text-green-400">!leaderboard</code> - View top players</div>
                  <div><code className="bg-gray-900 px-2 py-1 rounded text-green-400">!help</code> - Show all available commands</div>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-bold text-white mb-2">Website Features</h3>
                <div className="space-y-2 text-sm text-gray-300">
                  <div>• <strong>Portal:</strong> Manage characters, inventory, equipment, and crafting</div>
                  <div>• <strong>Leaderboards:</strong> See top players by level, damage, and more</div>
                  <div>• <strong>Store:</strong> Purchase items with tokens</div>
                  <div>• <strong>Founders Pack:</strong> Support the game and get exclusive rewards</div>
                  <div>• <strong>Raids Info:</strong> Learn about raid mechanics and bosses</div>
                </div>
              </div>
            </div>

            <div className="bg-gray-900/50 rounded-lg p-4">
              <h3 className="text-lg font-bold text-cyan-400 mb-3">Getting Help</h3>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>• Use <code className="bg-gray-800 px-2 py-1 rounded">!help</code> in chat for command list</li>
                <li>• Visit the Portal for detailed character management</li>
                <li>• Check the Professions page for crafting info</li>
                <li>• Join the Discord for community support</li>
                <li>• Report issues using the Report button in Portal</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Quick Reference */}
        <div className="bg-gradient-to-r from-purple-900 to-green-900 rounded-lg p-8 border-2 border-yellow-500">
          <h2 className="text-3xl font-bold text-yellow-400 mb-6">⚡ Quick Command Reference</h2>
          
          <div className="grid md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="font-bold text-white mb-2">Combat</div>
              <div className="space-y-1 text-gray-300">
                <div>!attack (!a)</div>
                <div>!heal (!h)</div>
                <div>!ability</div>
                <div>!defend</div>
                <div>!dispel</div>
                <div>!rest</div>
              </div>
            </div>
            <div>
              <div className="font-bold text-white mb-2">Character</div>
              <div className="space-y-1 text-gray-300">
                <div>!join [class]</div>
                <div>!leave</div>
                <div>!stats (!s)</div>
                <div>!gear (!g)</div>
                <div>!heroes</div>
                <div>!classes</div>
              </div>
            </div>
            <div>
              <div className="font-bold text-white mb-2">Professions</div>
              <div className="space-y-1 text-gray-300">
                <div>!profession [type]</div>
                <div>!gather / !mine</div>
                <div>!craft [item]</div>
                <div>!enchant [slot]</div>
                <div>!disenchant</div>
                <div>!recipes</div>
              </div>
            </div>
            <div>
              <div className="font-bold text-white mb-2">Other</div>
              <div className="space-y-1 text-gray-300">
                <div>!quest</div>
                <div>!claim</div>
                <div>!shop</div>
                <div>!tokens</div>
                <div>!raid</div>
                <div>!help</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
