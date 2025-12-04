# Travel Animation Feature

**Priority:** Visual Polish  
**Time Estimate:** 30-45 minutes  
**Impact:** Makes peaceful travel visually engaging

---

## 🎯 **Feature Description**

### **Current State:**
- Peaceful travel events (30% chance)
- Heroes gain +3 XP
- Gathering happens
- **But:** Heroes just stand idle (boring!)

### **Desired State:**
- Heroes play **walk** or **run** animation
- "Travelling..." text displays on battlefield
- Lasts for ~5 seconds (until next adventure tick)
- Returns to idle after travel

---

## 🎨 **Visual Design**

### **Animation:**
```
[Peaceful Travel]
→ All hero sprites switch to 'walk' or 'run' animation
→ Text appears: "Travelling..." (center screen, fading)
→ Lasts 5 seconds
→ Sprites return to 'idle'
```

### **Text Display:**
```css
Position: Center of battlefield
Font: 32px, white, bold
Animation: Fade in → Hold → Fade out
Duration: 5 seconds
Shadow: Black glow for visibility
```

---

## 🔧 **Implementation Steps**

### **1. Check Available Animations** (5 min)
- Verify all hero sprites have 'walk' or 'run' animation
- Check sprite sheet configs
- Fallback to 'idle' if animation missing

### **2. Trigger Animation** (15 min)
```typescript
// During peaceful travel event:
allHeroes.forEach(hero => {
  const heroRef = getHeroSpriteRef(hero.id);
  if (heroRef.current) {
    // Try 'walk' first, fallback to 'run' or 'idle'
    const hasWalk = heroRef.current.hasAnimation?.('walk');
    const hasRun = heroRef.current.hasAnimation?.('run');
    
    if (hasWalk) {
      heroRef.current.playAnimation('walk');
    } else if (hasRun) {
      heroRef.current.playAnimation('run');
    }
  }
});

// After 5 seconds, return to idle
setTimeout(() => {
  allHeroes.forEach(hero => {
    const heroRef = getHeroSpriteRef(hero.id);
    if (heroRef.current) {
      heroRef.current.playAnimation('idle');
    }
  });
}, 5000);
```

### **3. Add "Travelling..." Text** (10 min)
```typescript
// Add to state
const [travelingText, setTravelingText] = useState(false);

// During travel:
setTravelingText(true);
setTimeout(() => setTravelingText(false), 5000);

// In JSX:
{travelingText && (
  <div style={{
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    color: 'white',
    fontSize: '48px',
    fontWeight: 'bold',
    textShadow: '3px 3px 6px rgba(0,0,0,0.9)',
    animation: 'fade-in-out 5s ease-in-out',
    zIndex: 9999
  }}>
    🚶 Travelling...
  </div>
)}
```

### **4. CSS Animation** (5 min)
```css
@keyframes fade-in-out {
  0% { opacity: 0; }
  20% { opacity: 1; }
  80% { opacity: 1; }
  100% { opacity: 0; }
}
```

---

## 🎯 **Expected Result**

### **Before (Boring):**
```
[Peaceful Travel]
→ Heroes stand idle
→ +3 XP appears
→ Nothing else happens
```

### **After (Engaging!):**
```
[Peaceful Travel]
→ "🚶 Travelling..." fades in (center screen)
→ All heroes start walking/running
→ +3 XP appears
→ +2 ore (gathering)
→ [5 seconds pass]
→ Heroes return to idle
→ Text fades out
→ Next event happens
```

---

## 💡 **Bonus Ideas**

### **Random Variation:**
- Some heroes walk, some run (randomize per hero)
- Different travel speeds (faster heroes move more)
- Occasionally face different directions

### **Travel Events:**
- "Exploring..." (when looking for treasure)
- "Resting..." (on auto-rest waves)
- "Approaching enemy..." (before combat)

---

## 📊 **Priority**

**When to Implement:**
- **After:** Viewer bonuses (last major feature)
- **Before:** Sound effects, chat integration
- **Category:** Visual polish

**Impact:**
- Makes idle time visually interesting
- Shows the game is "alive" even without combat
- Professional polish
- Enhances streaming appeal

---

**Estimated Time:** 30-45 minutes  
**Difficulty:** Easy  
**Fun Factor:** HIGH! 🎮✨



