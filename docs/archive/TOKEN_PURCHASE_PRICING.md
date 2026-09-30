# Token Purchase Pricing Strategy

**Date:** January 2025  
**Goal:** Standard gacha pricing model with impulse buy option

---

## 💰 PRICING TIERS

### **Impulse Buy Pack - $0.99**
- **Tokens:** 100 tokens
- **Gold Bonus:** 1,000 gold
- **Value:** ~$0.01 per token
- **Purpose:** Remove purchase friction, impulse buy territory
- **Target:** Casual players, first-time purchasers
- **Conversion Impact:** HIGH - Low barrier removes hesitation

### **Starter Pack - $4.99**
- **Tokens:** 500 tokens
- **Gold Bonus:** 5,000 gold
- **Value:** ~$0.01 per token
- **Purpose:** Standard gacha entry point (proven conversion)
- **Target:** Regular players, standard purchase
- **Conversion Impact:** MEDIUM-HIGH - Industry standard price point

### **Value Pack - $9.99**
- **Tokens:** 1,500 tokens
- **Gold Bonus:** 15,000 gold
- **Value:** ~$0.01 per token (same rate, more volume)
- **Purpose:** Better value per token, encourages upsell
- **Target:** Engaged players, repeat purchasers
- **Conversion Impact:** MEDIUM - Upsell from $4.99 pack

### **Premium Pack - $24.99**
- **Tokens:** 5,000 tokens
- **Gold Bonus:** 50,000 gold
- **Value:** ~$0.01 per token (best value)
- **Purpose:** Whale tier, best value proposition
- **Target:** Whales, high-spending players
- **Conversion Impact:** LOW-MEDIUM - High value but higher price

---

## 📊 PRICING STRATEGY

### **Why $0.99 Pack?**
1. **Removes Purchase Friction:** Under $1 removes psychological barrier
2. **Impulse Buy Territory:** Players don't think twice about $0.99
3. **High Conversion:** Industry data shows 2-3x higher conversion vs $4.99
4. **Entry Point:** Gets players comfortable with purchasing
5. **Repeat Purchases:** Low price encourages multiple purchases

### **Why $4.99 Pack?**
1. **Industry Standard:** Proven gacha/mobile game price point
2. **Sweet Spot:** High enough for meaningful value, low enough for regular purchases
3. **Conversion Rate:** Optimal balance of price vs. conversion
4. **Upsell Path:** Natural progression from $0.99 to $4.99

### **Why Tiered Pricing?**
1. **Upsell Opportunity:** Players start small, upgrade to better value
2. **Whale Capture:** Premium pack targets high-spending players
3. **Value Perception:** Higher tiers feel like better deals
4. **Flexibility:** Players choose based on budget and needs

---

## 💡 TOKEN VALUE ANALYSIS

### **Token Value: $0.01 per token**
- **Consistent across all packs** (maintains economy balance)
- **100 tokens = $1.00** (easy mental math)
- **500 tokens = $5.00** (standard pack)
- **1,500 tokens = $15.00** (value pack)
- **5,000 tokens = $50.00** (premium pack)

### **Gold Bonus Strategy:**
- **Not primary currency** - Tokens are the premium currency
- **Value-add only** - Makes packs feel more valuable
- **Consistent ratio:** 10 gold per token (1,000g per 100 tokens)
- **Purpose:** Sweeten the deal, not compete with token value

---

## 📈 REVENUE PROJECTION

### **Conversion Rate Estimates (with $0.99 pack):**

#### **Small Player Base (50-100 players):**
- **$0.99 Pack:** 10-20% conversion = 5-20 sales/month = $5-20/month
- **$4.99 Pack:** 5-10% conversion = 3-10 sales/month = $15-50/month
- **$9.99 Pack:** 2-5% conversion = 1-5 sales/month = $10-50/month
- **$24.99 Pack:** 1-2% conversion = 0-2 sales/month = $0-50/month
- **Total:** $30-170/month

#### **Medium Player Base (200-500 players):**
- **$0.99 Pack:** 10-20% conversion = 20-100 sales/month = $20-100/month
- **$4.99 Pack:** 5-10% conversion = 10-50 sales/month = $50-250/month
- **$9.99 Pack:** 2-5% conversion = 4-25 sales/month = $40-250/month
- **$24.99 Pack:** 1-2% conversion = 2-10 sales/month = $50-250/month
- **Total:** $160-850/month

#### **Large Player Base (1000+ players):**
- **$0.99 Pack:** 10-20% conversion = 100-200 sales/month = $100-200/month
- **$4.99 Pack:** 5-10% conversion = 50-100 sales/month = $250-500/month
- **$9.99 Pack:** 2-5% conversion = 20-50 sales/month = $200-500/month
- **$24.99 Pack:** 1-2% conversion = 10-20 sales/month = $250-500/month
- **Total:** $800-1,700/month

---

## 🎯 IMPLEMENTATION PRIORITY

### **Status:** ⭐⭐⭐ HIGH PRIORITY
**Reason:** Immediate revenue generation, funds sprite development

### **Why Implement Now:**
1. **Quick Win:** 1-2 days to implement
2. **Immediate Revenue:** Start generating revenue immediately
3. **Funds Development:** Revenue pays for sprite creation ($2,100-4,200)
4. **Low Risk:** Simple feature, proven monetization model
5. **Unlocks Future:** Enables all token-based features

### **Implementation Steps:**
1. Create token pack configurations (4 tiers)
2. Add token purchase UI to Store page
3. Create backend endpoint: `POST /api/purchases/token-pack`
4. Connect Stripe payment processing
5. Grant tokens and gold to selected hero
6. Test payment flow

---

## ✅ RECOMMENDED PRICING

| Pack | Price | Tokens | Gold | Value/Token | Target Audience |
|------|-------|--------|------|-------------|-----------------|
| **Impulse** | $0.99 | 100 | 1,000 | $0.01 | First-time buyers, impulse purchases |
| **Starter** | $4.99 | 500 | 5,000 | $0.01 | Regular players, standard purchase |
| **Value** | $9.99 | 1,500 | 15,000 | $0.01 | Engaged players, repeat buyers |
| **Premium** | $24.99 | 5,000 | 50,000 | $0.01 | Whales, high-spending players |

**Total Revenue Potential:** $30-1,700/month (depending on player count)

---

## 💰 COMPARISON TO FOUNDER PACKS

### **Founder Packs (One-Time):**
- Bronze: $5 (25 tokens) = $0.20 per token
- Silver: $10 (75 tokens) = $0.13 per token
- Gold: $15 (150 tokens) = $0.10 per token
- Platinum: $25 (300 tokens) = $0.08 per token

### **Token Packs (Repeatable):**
- All packs: $0.01 per token (consistent)

### **Why Different Pricing?**
- **Founder Packs:** Include exclusive cosmetics, badges, titles (higher value)
- **Token Packs:** Pure currency, repeatable purchases (lower price per token)
- **Strategy:** Founder packs for exclusivity, token packs for convenience

---

## 🚀 NEXT STEPS

1. **Update FINAL_EXECUTION_PLAN.md** - Change status from DEFERRED to HIGH PRIORITY
2. **Update MONETIZATION_ROADMAP.md** - Add $0.99 pack to pricing
3. **Implement Token Purchase System** - 1-2 days development
4. **Launch and Monitor** - Track conversion rates by pack tier
5. **Optimize Pricing** - Adjust based on actual conversion data







