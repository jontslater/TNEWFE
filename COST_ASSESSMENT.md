# Cost Assessment - IdleDnD Deployment & Operations

**Date:** January 2025  
**Project:** The Never Ending War - IdleDnD Game

---

## 🏗️ INFRASTRUCTURE OVERVIEW

Based on codebase analysis:

**Backend:**
- Express.js REST API server
- WebSocket server (real-time chat, game events)
- Firebase Admin SDK (Firestore database)
- Node.js runtime

**Database:**
- Firebase Firestore (NoSQL database)
- Real-time listeners for game state

**Frontend:**
- React + Vite static site
- Hosted on Firebase Hosting (or similar)

**Third-Party Services:**
- Stripe (payment processing - pending integration)
- Twitch API (authentication, events)

---

## 💰 STARTUP/DEPLOYMENT COSTS

### One-Time Setup Costs

| Item | Cost | Notes |
|------|------|-------|
| **Domain Name** | $10-15/year | Optional, can use subdomain |
| **SSL Certificate** | $0 | Included with hosting |
| **Firebase Project Setup** | $0 | Free tier available |
| **Backend Hosting Setup** | $0 | No setup fees for most platforms |
| **Stripe Account Setup** | $0 | Free to create account |
| **Total One-Time** | **$10-15** | Minimal startup costs |

---

## 💸 MONTHLY OPERATIONAL COSTS

### 1. Backend Server Hosting

**Current Setup:** Express.js + WebSocket server (Node.js)

**Recommended Options:**

#### **Option A: Railway.app** (Recommended)
- **Starter Plan:** $5/month
  - 512 MB RAM, 1 vCPU
  - 5 GB storage
  - 100 GB egress bandwidth
  - Good for: 50-200 concurrent users
- **Pro Plan:** $20/month
  - 2 GB RAM, 2 vCPU
  - 10 GB storage
  - 500 GB egress bandwidth
  - Good for: 200-1000 concurrent users
- **Scaled Plan:** $100/month
  - 8 GB RAM, 4 vCPU
  - 50 GB storage
  - 2 TB egress bandwidth
  - Good for: 1000+ concurrent users

**Alternative Options:**
- **Heroku:** $7-25/month (Hobby/Basic dynos) - *Note: Heroku removed free tier*
- **Render:** $7-25/month (Web service)
- **DigitalOcean App Platform:** $5-12/month
- **AWS EC2:** $5-15/month (t3.micro/small instances)
- **Google Cloud Run:** Pay-per-use (scales to zero)

**Estimated Monthly:** **$5-20/month** (depending on player base)

---

### 2. Firebase Firestore Database

**Pricing Structure:**
- **Free Tier (Spark Plan):**
  - 50,000 reads/day
  - 20,000 writes/day
  - 20,000 deletes/day
  - 1 GB storage
  
- **Pay-as-you-go (Blaze Plan):**
  - **Reads:** $0.06 per 100,000 documents
  - **Writes:** $0.18 per 100,000 documents
  - **Deletes:** $0.02 per 100,000 documents
  - **Storage:** $0.18 per GB/month
  - **Network Egress:** First 10 GB/month free, then $0.12/GB

**Usage Estimates (Based on Game Features):**

#### **Low Traffic (50-100 active players/day):**
- Reads: ~500,000/month (hero data, inventory, mail, chat history, party queries)
- Writes: ~100,000/month (hero updates, combat logs, mail sends, chat messages)
- Deletes: ~10,000/month (expired mail, old chat messages)
- Storage: ~500 MB (heroes, inventory, mail, chat, auctions)

**Monthly Cost:** **$0-5** (likely stays in free tier or minimal usage)

#### **Medium Traffic (200-500 active players/day):**
- Reads: ~5,000,000/month
- Writes: ~1,000,000/month
- Deletes: ~100,000/month
- Storage: ~2-3 GB

**Monthly Cost:** 
- Reads: ~$3.00
- Writes: ~$1.80
- Deletes: ~$0.02
- Storage: ~$0.50
- **Total: ~$5-8/month**

#### **High Traffic (1000+ active players/day):**
- Reads: ~20,000,000/month
- Writes: ~5,000,000/month
- Deletes: ~500,000/month
- Storage: ~10-15 GB

**Monthly Cost:**
- Reads: ~$12.00
- Writes: ~$9.00
- Deletes: ~$0.10
- Storage: ~$2.00
- **Total: ~$25-30/month**

---

### 3. Firebase Hosting (Frontend)

**Pricing:**
- **Free Tier:**
  - 10 GB storage
  - 360 MB/day bandwidth
  
- **Pay-as-you-go:**
  - Storage: $0.026/GB/month
  - Bandwidth: $0.15/GB (after free tier)

**Usage Estimates:**
- Static site: ~50-100 MB (React build)
- Bandwidth: ~5-50 GB/month (depends on player count)

**Monthly Cost:** **$0-10/month** (usually free tier is sufficient)

---

### 4. WebSocket Connections

**Backend Hosting Includes:**
- WebSocket connections are part of backend server hosting
- No additional cost beyond server hosting
- **Cost:** Included in backend hosting ($5-20/month)

---

### 5. Stripe Payment Processing

**Pricing:**
- **No monthly fee**
- **Transaction fees:**
  - 2.9% + $0.30 per successful charge (online payments)
  - Only charged on successful transactions

**Cost:** $0/month base fee, only pay per transaction

**Example:**
- 10 Founder Pack sales/month at $15 average = $150 revenue
- Stripe fee: $4.35 + $3.00 = $7.35 in fees
- Net revenue: $142.65

---

### 6. Additional Services

| Service | Monthly Cost | Notes |
|---------|--------------|-------|
| **Domain Name** | $1-2 | If using custom domain |
| **Email Service** | $0-5 | For notifications (optional) |
| **Monitoring/Logging** | $0-10 | Optional (Railway includes basic monitoring) |
| **CDN** | $0-5 | Optional (Firebase Hosting includes CDN) |
| **Backup Service** | $0-5 | Optional (Firestore has automatic backups) |

---

## 📊 TOTAL COST BREAKDOWN BY SCALE

### **Scenario 1: Small Launch (50-100 players)**
- Backend Hosting (Railway Starter): $5/month
- Firestore Database: $0/month (free tier)
- Firebase Hosting: $0/month (free tier)
- Stripe: $0/month (pay-per-transaction)
- **Total: ~$5-10/month**

### **Scenario 2: Medium Growth (200-500 players)**
- Backend Hosting (Railway Pro): $20/month
- Firestore Database: $5-8/month
- Firebase Hosting: $0-5/month
- Stripe: $0/month (pay-per-transaction)
- **Total: ~$25-35/month**

### **Scenario 3: High Traffic (1000+ players)**
- Backend Hosting (Railway Scaled): $100/month
- Firestore Database: $25-30/month
- Firebase Hosting: $5-10/month
- Stripe: $0/month (pay-per-transaction)
- **Total: ~$130-150/month**

---

## 🚀 STARTUP COST SUMMARY

### Minimal Setup (MVP Launch)
- **One-Time:** $10-15 (domain, if desired)
- **Monthly:** $5-10
- **Year 1 Total:** ~$70-135

### Recommended Setup (Growth Ready)
- **One-Time:** $15 (domain)
- **Monthly:** $25-35
- **Year 1 Total:** ~$315-435

---

## ⚠️ COST OPTIMIZATION STRATEGIES

### 1. **Firestore Optimization**
- Use composite indexes efficiently (already implemented)
- Batch operations where possible
- Cache frequently accessed data
- Delete expired data regularly (mail expiration already implemented)
- **Potential Savings:** 20-30% reduction in database costs

### 2. **Backend Hosting**
- Start with Railway Starter ($5/month)
- Scale up only when needed
- Use auto-scaling if available
- Monitor resource usage
- **Potential Savings:** Stay on lower tier longer

### 3. **Caching Strategy**
- Cache hero data on frontend (already implemented)
- Cache static game data (raids, dungeons)
- Reduce Firestore reads
- **Potential Savings:** 40-50% reduction in database reads

### 4. **Free Tier Maximization**
- Use Firebase free tier limits efficiently
- Monitor usage to stay within free tier as long as possible
- **Potential Savings:** $5-25/month in early stages

---

## 📈 COST PROJECTION BY PLAYER COUNT

| Players/Day | Backend | Database | Hosting | Stripe | **Total/Month** |
|-------------|---------|----------|---------|--------|-----------------|
| 50-100 | $5 | $0 | $0 | $0 | **$5-10** |
| 200-500 | $20 | $5-8 | $0-5 | $0 | **$25-35** |
| 1000+ | $100 | $25-30 | $5-10 | $0 | **$130-150** |
| 5000+ | $500+ | $100-150 | $20-30 | $0 | **$620-680** |

*Note: Stripe costs are transaction-based, not per-player*

---

## 🎯 RECOMMENDED LAUNCH BUDGET

### **Phase 1: Initial Launch (Month 1-3)**
- **Budget:** $10-15/month
- **Allocation:**
  - Backend: $5/month (Railway Starter)
  - Database: $0 (free tier)
  - Hosting: $0 (free tier)
  - Domain: $1-2/month
- **Expected Players:** 50-200

### **Phase 2: Growth Phase (Month 4-12)**
- **Budget:** $30-50/month
- **Allocation:**
  - Backend: $20/month (Railway Pro)
  - Database: $5-10/month
  - Hosting: $0-5/month
  - Domain: $1-2/month
- **Expected Players:** 200-1000

### **Phase 3: Scale Phase (Year 2+)**
- **Budget:** $150-300/month
- **Allocation:**
  - Backend: $100/month (Railway Scaled or custom)
  - Database: $25-50/month
  - Hosting: $10-20/month
  - Monitoring: $10/month
  - Domain: $1-2/month
- **Expected Players:** 1000+

---

## 💡 COST-SAVING RECOMMENDATIONS

1. **Start Small:** Begin with Railway Starter + Firebase free tier
2. **Monitor Usage:** Set up billing alerts at $10, $25, $50 thresholds
3. **Optimize Queries:** Review Firestore usage monthly, optimize expensive queries
4. **Batch Operations:** Combine multiple database operations where possible
5. **Cache Aggressively:** Cache static data (raids, achievements, quest templates)
6. **Archive Old Data:** Move old chat messages, completed raids to cold storage
7. **Use Free Tier:** Maximize Firebase free tier before upgrading

---

## 📋 MONTHLY COST CHECKLIST

**To Monitor:**
- [ ] Firestore read/write counts (check Firebase Console)
- [ ] Backend server CPU/RAM usage (check Railway dashboard)
- [ ] Bandwidth usage (backend + Firebase Hosting)
- [ ] Storage growth (Firestore + hosting)
- [ ] Stripe transaction fees (check Stripe dashboard)
- [ ] Set billing alerts for all services

**Optimization Opportunities:**
- [ ] Review Firestore queries monthly
- [ ] Check for inefficient database calls
- [ ] Monitor WebSocket connection counts
- [ ] Review caching strategies
- [ ] Archive/delete old data regularly

---

## 🎮 REVENUE vs. COSTS

### Break-Even Analysis

**Monthly Costs:** $25-35 (medium traffic)

**Revenue Needed to Break Even:**
- Founder Pack sales: ~2-3 packs/month at $15 average
- Or: ~$25-35 in Stripe transactions/month

**Example Revenue Scenarios:**
- 10 Founder Packs/month at $15 = $150 revenue - $7.35 fees = **$142.65 profit**
- 20 Founder Packs/month at $15 = $300 revenue - $14.70 fees = **$285.30 profit**
- **Break-even:** ~2-3 Founder Pack sales/month

---

## 📝 NOTES

1. **Backend Hosting:** Railway.app is recommended due to ease of deployment and WebSocket support
2. **Database:** Firestore scales well but can get expensive at high volume - monitor closely
3. **Frontend:** Firebase Hosting free tier should be sufficient for most scenarios
4. **WebSocket:** Included in backend hosting cost - no additional charges
5. **Stripe:** Only pay per transaction - no monthly fees
6. **Scaling:** Costs scale linearly with player count - predictable growth

---

## ✅ LAUNCH READINESS

**Minimum Viable Costs:** $5-10/month  
**Recommended Launch Budget:** $25-35/month  
**Growth Phase Budget:** $150-300/month

**Conclusion:** The game can launch with minimal costs ($5-10/month) and scale as player base grows. Revenue from Founder Pack sales can easily cover operational costs with just 2-3 sales per month.






