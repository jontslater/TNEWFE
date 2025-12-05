# Founders Pack Cosmetics - Implementation Plans & Questions

**Date:** December 5, 2025

---

## 🎨 Implementation Plans & Questions

### **1. Name Colors** (Step 1.3.1)
**Status:** Ready to implement  
**Estimated:** 2-3 days

**My Plan:**
- Add `nameColor` field to Hero type (hex color string)
- Create color picker UI in HeroDashboard
  - Use HTML5 `<input type="color">` for easy picking
  - Show color preview
  - Validate hex format
- Load from Firebase in browser source
- Apply color to hero name text in browser source & portal

**Questions:**
- Should there be color restrictions/validation? (e.g., not too dark to read, not pure white)
- Should admins be able to set any color, or are there preset color options per tier?
- Should the color apply to just the name, or name + level?

---

### **2. Name Frames** (Step 1.3.2)
**Status:** Need to create assets  
**Estimated:** 3-4 days

**My Plan:**
- Create 4 frame variants (Bronze/Silver/Gold/Platinum)
  - Simple CSS border approach (faster)
  - OR Image sprites (more customizable)
- Add `nameFrame` field to Hero type
- Render frame around name in browser source
- Frame selection UI in portal

**Questions:**
- Do you have frame designs/assets, or should I create CSS-based frames?
- Should frames be:
  - Simple borders around the name?
  - Decorative corner brackets?
  - Full border with decorative elements?
- Preferred style: Modern/minimal or ornate/fantasy?

---

### **3. Aura Effects** (Step 1.3.3)
**Status:** Need to create particle system  
**Estimated:** 3-5 days

**My Plan:**
- Use CSS animations for simple auras (faster)
  - Glowing outline around hero sprite
  - Animated gradient rings
  - Particle-like effect with CSS
- OR Canvas-based particle system (more complex, better quality)
- Add `auraEffect` field to Hero type
- Render aura around hero sprite in browser source

**Questions:**
- Visual style preference:
  - Subtle glow/outline?
  - Swirling particles?
  - Pulsing energy field?
- Should aura be:
  - Static around the hero?
  - Animated (pulsing, rotating)?
- Complexity: Simple CSS or full particle system?

---

### **4. Spell Effects** (Step 1.3.4)
**Status:** Need to create effect variants  
**Estimated:** 2-3 days

**My Plan:**
- Create visual effect variants for attacks:
  - **Fireball variants:** Different colored fireballs, particle trails
  - **Shockwave variants:** Different colored shockwaves, impact effects
- Apply effects during combat animations
- Use CSS/Canvas overlays on attack animations

**Questions:**
- Should effects be:
  - Simple color variations (red fireball vs blue fireball)?
  - Completely different visual styles per tier?
  - Particle enhancements (sparks, trails, etc.)?
- Should effects apply to:
  - All attacks?
  - Only class abilities?
  - Special proc effects?

---

### **5. Founder Statue** (Step 1.3.5)
**Status:** Need to create statue system  
**Estimated:** 2-3 days

**My Plan:**
- Create statue sprite/asset
- Add statue placement system in browser source
- Display founder name on statue
- Show statue on battlefield (maybe near spawn point)

**Questions:**
- Where should statues appear?
  - Fixed location on battlefield?
  - Near spawn point?
  - Visible in browser source only?
- Should statues be:
  - Simple placeholder sprite?
  - Custom per founder (with nameplate)?
- Should all founders see all statues, or just their own?

---

### **6. Chat Badge** (Step 1.3.6)
**Status:** Need to determine chat system  
**Estimated:** 1-2 days

**My Plan:**
- Check if Twitch extension or web chat exists
- Display badge next to username in chat
- Or create web-based chat component

**Questions:**
- Do you have a chat system already?
  - Twitch extension?
  - Web-based chat component?
  - External chat integration?
- Where should badges appear?
  - In Twitch chat (via extension)?
  - In-game chat (if it exists)?
  - Browser source chat overlay?

---

### **7. Founder Title** (Step 1.3.7)
**Status:** Quick - just needs to be added  
**Estimated:** 0.5 day

**My Plan:**
- Add "Founder" title to achievements system
- Auto-assign on founders pack purchase
- Display in title selection (already exists)

**Questions:**
- Should the title be just "Founder" or tier-specific?
  - "Bronze Founder"
  - "Silver Founder"
  - "Gold Founder"
  - "Platinum Founder"
- Or just one "Founder" title for all tiers?

---

## 🎯 Priority Questions

1. **Which should we implement first?** (Name Colors seems like the easiest starting point)
2. **Visual style preference?** (Modern/minimal vs ornate/fantasy)
3. **Asset creation:** Do you have any existing assets, or should I create CSS-based solutions?
4. **Complexity level:** Simple CSS animations or full Canvas particle systems?

---

**Ready to start implementing once I have your feedback!** 🎨
