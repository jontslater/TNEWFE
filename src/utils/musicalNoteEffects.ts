/**
 * Musical Note Effects for Bard Abilities
 * Visual effects that appear when bard uses Battle Hymn or Healing Melody
 */

/**
 * Create floating musical notes around a hero
 * @param heroElement - The hero sprite element
 * @param color - Color of the notes (default: gold for buffs, green for healing)
 * @param count - Number of notes to create (default: 5)
 */
export function createMusicalNoteEffect(
  heroElement: HTMLElement | null,
  color: string = '#ffd700',
  count: number = 5
): void {
  if (!heroElement) return;

  // Find the battlefield container
  let battlefieldContainer: HTMLElement | null = null;
  
  // Try to find the main container
  battlefieldContainer = document.querySelector('.browser-source-page') as HTMLElement;
  if (!battlefieldContainer) {
    battlefieldContainer = heroElement.closest('.browser-source-page') as HTMLElement;
  }
  
  // Fallback to parent container
  if (!battlefieldContainer) {
    let current: HTMLElement | null = heroElement.parentElement;
    while (current && current !== document.body) {
      const style = window.getComputedStyle(current);
      const position = style.position;
      if ((position === 'relative' || position === 'absolute' || position === 'fixed') && 
          current.offsetWidth > 200 && current.offsetHeight > 200) {
        battlefieldContainer = current;
        break;
      }
      current = current.parentElement;
    }
  }
  
  if (!battlefieldContainer) {
    battlefieldContainer = document.body;
  }

  const containerRect = battlefieldContainer.getBoundingClientRect();
  const heroRect = heroElement.getBoundingClientRect();
  
  // Calculate hero center position
  const heroCenterX = heroRect.left - containerRect.left + heroRect.width / 2;
  const heroCenterY = heroRect.top - containerRect.top + heroRect.height / 2;
  
  // Musical note characters
  const notes = ['♪', '♫', '♬', '♩', '♭', '♯', '𝄞', '𝄢'];
  
  // Create multiple notes
  for (let i = 0; i < count; i++) {
    const note = notes[Math.floor(Math.random() * notes.length)];
    
    // Create note element
    const noteElement = document.createElement('div');
    noteElement.textContent = note;
    noteElement.style.cssText = `
      position: absolute;
      color: ${color};
      font-size: ${20 + Math.random() * 12}px;
      font-weight: bold;
      pointer-events: none;
      z-index: 1000;
      left: ${heroCenterX}px;
      top: ${heroCenterY}px;
      transform: translate(-50%, -50%);
      opacity: 0;
      text-shadow: 0 0 10px ${color}, 0 0 20px ${color}40;
      font-family: Arial, sans-serif;
    `;
    
    battlefieldContainer.appendChild(noteElement);
    
    // Random direction and distance for each note
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5; // Spread evenly with some randomness
    const distance = 30 + Math.random() * 40; // 30-70px distance
    const endX = heroCenterX + Math.cos(angle) * distance;
    const endY = heroCenterY + Math.sin(angle) * distance - 40; // Float upward
    
    // Random delay for staggered appearance
    const delay = i * 50; // 50ms between each note
    
    // Animate note
    setTimeout(() => {
      // Fade in and float up
      noteElement.style.transition = 'opacity 0.2s ease-out, transform 1.5s ease-out';
      noteElement.style.opacity = '1';
      noteElement.style.transform = `translate(${endX - heroCenterX}px, ${endY - heroCenterY}px) scale(1.5)`;
      
      // Fade out after animation
      setTimeout(() => {
        noteElement.style.transition = 'opacity 0.3s ease-out';
        noteElement.style.opacity = '0';
        
        setTimeout(() => {
          if (noteElement.parentNode) {
            noteElement.parentNode.removeChild(noteElement);
          }
        }, 300);
      }, 1200);
    }, delay);
  }
}








