# Economy System Design - IdleDnD Web

## Overview
Balanced economy system designed for monetization while maintaining fair free-to-play progression.

## Currency Types

### 🪙 Gold (Earned Currency)
- **Primary Use**: Shop items, equipment upgrades, auction house trading
- **Earning Methods**:
  - Enemy kills: `floor(enemy.xp / 10)` per kill
  - Treasure discovery: 2-7 gold (random event)
  - Auction house sales: Player-to-player trading
  - Quest rewards: Reduced by 50-75% from original
- **Target Daily Earnings**: 2,000-3,000 gold/day (active player)
- **Gold Sinks**: Shop items, upgrades, storage, convenience features

### 💎 Tokens (Premium Currency)
- **Primary Use**: Guaranteed rarity gear, XP/Gold boosts, convenience items
- **Earning Methods**:
  - Idle earning: 2 tokens/hour (active), 1 token/hour (idle)
  - Max accumulation: 24 hours (48-72 tokens)
  - Quest rewards: Reduced by 50% from original
  - **Purchasable**: Real money (primary monetization)
- **Target Monthly Earnings**: ~5,425 tokens/month (very active player)
- **Purpose**: Premium progression, convenience, guaranteed gear

## Earning Rates

### Gold Earning
```
Per Kill: floor(enemy.xp / 10)
- Level 1 enemy (18 XP): 1-2 gold
- Level 10 enemy (100 XP): 10 gold
- Level 40 enemy (300 XP): 30 gold

Treasure: 2-7 gold (random, ~every 5-10 min)
Quest Daily: 200-500 gold (reduced from 1000-5000)
Quest Weekly: 1000-2500 gold (reduced from 5000-25000)
Quest Monthly: 5000-10000 gold (reduced from 20000-100000)
```

### Token Earning
```
Idle Rate:
- Active (command in last 60 min): 2 tokens/hour
- Idle: 1 token/hour
- Max: 24 hours (48-72 tokens)

Quest Rewards (Reduced):
- Daily: 5-25 tokens (was 5-50)
- Daily completion: 50 tokens (was 100)
- Weekly: 30-50 tokens (was 50-75)
- Weekly completion: 250 tokens (was 500)
- Monthly: 125-200 tokens (was 200-300)
- Monthly completion: 1000 tokens (was 2000)

Monthly Total: ~5,425 tokens (was 10,100)
```

## Shop Prices

### Gold Shop
```
Health Potion: 10 gold (was 5)
- Auto-heal at 30% HP (if enabled)

XP Boost Scroll: 25 gold (was 10)
- +50% XP for 5 minutes

Sharpening Stone: 15 gold (was 15)
- +10% Attack for 10 minutes

Armor Polish: 15 gold (was 15)
- +10% Defense for 10 minutes
```

### Token Shop - Gear
```
Common: 50 tokens (was 25) - 2x increase
Rare: 200 tokens (was 100) - 2x increase
Epic: 600 tokens (was 300) - 2x increase
Legendary: 2500 tokens (was 1000) - 2.5x increase
Mythic: 10000 tokens (NEW - ultra-rare tier)
```

### Token Shop - Boosts
```
XP Boosts:
- 1-hour: 50 tokens (+100% XP)
- 3-hour: 120 tokens (20% discount)
- 8-hour: 280 tokens (30% discount)
- 24-hour: 750 tokens (38% discount)

Gold Boosts:
- 1-hour: 30 tokens (+50% gold from kills)
- 3-hour: 75 tokens
- 8-hour: 180 tokens
- 24-hour: 450 tokens

Token Boosts (Idle):
- Standard: 100 tokens (+50% idle token rate, 7 days)
- Premium: 250 tokens (+100% idle token rate, 7 days)
```

### Token Shop - Convenience
```
Inventory Expansion: 200 tokens (+50 slots)
Bank Expansion: 300 tokens (+100 slots)
Auto-Salvage: 500 tokens (permanent auto-sell common gear)
```

## Gold Sinks (Prevent Inflation)

### Equipment Upgrades
```
Level Upgrade: 100-1000 gold
- Upgrade item level by 1-5
- Scales with current item level

Stat Reforge: 500 gold
- Reroll secondary stats on item
- Keep primary stats, reroll secondary
```

### Storage
```
Bank Slot: 50 gold per slot (one-time)
- Expand storage for items
```

### Convenience
```
Auto-Buy Potions: 50 gold (one-time)
- Automatically buy and use potions when HP < 30%
```

## Auction House Design (Future)

### Purpose
- Primary gold sink/source
- Player-to-player trading
- Idle gold earning (sell items while offline)

### Mechanics
```
Listing Fee: 10% of listing price (gold sink)
Transaction Fee: 5% of sale price (gold sink)
Buyout: Instant purchase option
Auction Duration: 24-72 hours
```

### Gold Flow
```
Player A sells item → Gets 90% of sale price
Player B buys item → Pays 100% of listing price
System takes 10% listing + 5% transaction = 15% total (gold sink)
```

## Monetization Strategy

### Token Pricing
```
Starter Pack ($4.99): 100 tokens
Value Pack ($9.99): 250 tokens
Premium Pack ($19.99): 600 tokens
Ultimate Pack ($49.99): 2000 tokens

Bulk Discounts:
- 500 tokens: 10% off
- 1000 tokens: 20% off
- 5000 tokens: 30% off
```

### Value Proposition
```
Free Player (Active):
- 5,425 tokens/month
- Can buy 2-3 legendary items/month
- 14-21 days per legendary (idle)

Paying Player ($20/month):
- 5,425 + 600 = 6,025 tokens/month
- Can buy 2-3 legendary items/month
- Faster progression, convenience items

Whale ($100/month):
- 5,425 + 2,000 = 7,425 tokens/month
- Can buy 3-4 legendary items/month
- All convenience items, max boosts
```

## Implementation Priority

### Phase 1: Core Economy (Current)
1. ✅ Gold system (earn from kills, display, persistence)
2. ✅ Token system (idle earning, claim, display, persistence)
3. ✅ Gold shop (basic items)
4. ✅ Token shop (guaranteed gear)

### Phase 2: Gold Sinks (Next)
1. Equipment upgrades
2. Stat reforge
3. Storage expansion
4. Auto-buy potions

### Phase 3: Auction House (Future)
1. Listing system
2. Search/browse
3. Buyout/auction mechanics
4. Transaction fees

### Phase 4: Premium Features (Future)
1. XP/Gold/Token boosts
2. Convenience items
3. Character services
4. Mythic gear tier

## Balance Targets

### Gold Economy
- **Daily Earnings**: 2,000-3,000 gold (active player)
- **Daily Spending**: 500-1,000 gold (shop items, upgrades)
- **Net Accumulation**: 1,000-2,000 gold/day
- **Purpose**: Build up for auction house, major purchases

### Token Economy
- **Monthly Earnings**: ~5,425 tokens (very active)
- **Legendary Cost**: 2,500 tokens
- **Purchasing Power**: 2-3 legendary items/month
- **Purpose**: Premium progression, convenience, guaranteed gear

## Notes
- All rates are subject to balance testing
- Monitor player feedback and adjust accordingly
- Consider special events (double gold/token weekends)
- Auction house will be primary gold sink/source long-term










