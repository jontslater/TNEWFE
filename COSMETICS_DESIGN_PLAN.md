# Founders Pack Cosmetics - Implementation Plans & Questions 🎨

**Date:** December 5, 2025

---

## 🎯 My Implementation Plans

### **1. Name Colors** (Step 1.3.1)
**Estimated:** 2-3 days | **Needed for:** All tiers (Bronze+)

**My Plan:**
- Add `nameColor` field to Hero type (hex string like "#FF5733")
- Create color picker in HeroDashboard using HTML5 `<input type="color">`
- Load from Firebase and apply to hero name text
- Display in browser source name tags and portal

**Questions for You:**
1. Should we restrict colors? (e.g., minimum brightness so names stay readable)
2. Should admins get any color, or preset options per tier?
3. Should the color apply to name only, or name + level number?

---

### **2. Name Frames** (Step 1.3.2)
**Estimated:** 3-4 days | **Needed for:** Silver+ tiers

**My Plan (Option A - CSS Borders):**
- Create CSS-based decorative borders
- Different styles per tier (Bronze/Silver/Gold/Platinum)
- Quick to implement, no assets needed

**My Plan (Option B - Image Sprites):**
- Create frame image assets
- More customizable, can have decorative elements
- Requires image creation/design

**Questions:**
1. **Style preference?**
   - Simple border outline?
   - Decorative corner brackets?
   - Full ornate frame with decorative elements?

2. **Implementation preference?**
   - CSS-based (faster, simpler)
   - Image sprites (more customizable)

3. **Visual style?**
   - Modern/minimal
   - Fantasy/ornate

---

### **3. Aura Effects** (Step 1.3.3)
**Estimated:** 3-5 days | **Needed for:** Gold+ tiers

**My Plan (Option A - CSS Glow):**
- Animated glowing outline around hero sprite
- Pulsing gradient rings
- Simple CSS animations

**My Plan (Option B - Canvas Particles):**
- Particle system with Canvas
- Swirling particles around hero
- More impressive but more complex

**Questions:**
1. **Visual style?**
   - Subtle glow/outline
   - Swirling particle effects
   - Pulsing energy field
   - Rotating rings

2. **Complexity?**
   - Simple CSS glow (easier)
   - Full particle system (more impressive)

3. **Color scheme?**
   - Gold for Gold tier
   - Purple for Platinum tier
   - Or customizable?

---

### **4. Spell Effects** (Step 1.3.4)
**Estimated:** 2-3 days | **Needed for:** Gold+ (or all tiers)

**My Plan:**
- Create visual variants for attacks:
  - **Fireball variants:** Different colored fireballs, particle trails
  - **Shockwave variants:** Different colored shockwaves, impact effects
- Apply as overlays during combat animations
- Use CSS/Canvas for visual effects

**Questions:**
1. **Effect style?**
   - Color variations (red vs blue fireball)?
   - Different visual styles per tier?
   - Particle enhancements (sparks, trails)?

2. **When to show?**
   - All attacks?
   - Only class abilities?
   - Only special attacks?

3. **Per tier differences?**
   - Should Gold get different effects than Platinum?
   - Or same effects for Gold+?

---

### **5. Founder Statue** (Step 1.3.5)
**Estimated:** 2-3 days | **Needed for:** Platinum tier only

**My Plan:**
- Create simple statue sprite/placeholder
- Add to browser source at fixed location
- Display founder name on statue

**Questions:**
1. **Statue placement?**
   - Fixed location on battlefield?
   - Near spawn point?
   - Only visible in browser source?

2. **Statue design?**
   - Simple placeholder sprite?
   - Hero-looking statue?
   - Generic pillar/statue?

3. **Visibility?**
   - Everyone sees all statues?
   - Only see your own?
   - Only streamer sees them?

---

### **6. Chat Badge** (Step 1.3.6)
**Estimated:** 1-2 days | **Needed for:** Platinum tier

**My Plan:**
- Need to check if chat system exists
- If Twitch extension: Display badge in Twitch chat
- If web chat: Display badge in web chat component

**Questions:**
1. **Do you have a chat system?**
   - Twitch extension?
   - Web-based chat component?
   - External chat integration?

2. **Where should badges appear?**
   - In Twitch chat (via extension)?
   - In-game chat overlay?
   - Separate chat component?

---

### **7. Founder Title** (Step 1.3.7)
**Estimated:** 0.5 day | **Needed for:** All tiers

**My Plan:**
- Add "Founder" title to achievements system
- Auto-assign on purchase
- Display in existing title selection

**Questions:**
1. **Title naming?**
   - Just "Founder" for all tiers?
   - Tier-specific: "Bronze Founder", "Silver Founder", etc.?
   - Or "Founder" with tier shown separately?

---

## 🎨 Overall Design Questions

1. **Visual Style Preference:**
   - Modern/minimal
   - Fantasy/ornate
   - Colorful/vibrant
   - Subtle/elegant

2. **Implementation Priority:**
   - Which should we start with? (Name Colors is easiest)
   - Any that are more important than others?

3. **Asset Creation:**
   - Do you have existing assets for frames/statues?
   - Should I create CSS-based solutions (faster)?
   - Or wait for custom assets?

4. **Complexity Level:**
   - Keep it simple (CSS animations)?
   - Go all out (Canvas particle systems)?

---

## 🚀 Recommended Starting Point

I suggest starting with **Name Colors** because:
- ✅ Easiest to implement
- ✅ High visibility
- ✅ No assets needed
- ✅ Quick win

**What do you think?** Share your preferences and I'll adjust the implementation plans! 🎨
