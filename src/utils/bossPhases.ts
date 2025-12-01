/**
 * Boss Phase System
 * Handles phase detection, transitions, and phase-based mechanics
 */

import { BossPhase, BossMechanic } from '../types/BossMechanics';
import { BossMechanicsState } from './bossMechanics';

export interface PhaseTransition {
  fromPhase: number;
  toPhase: number;
  timestamp: number;
  hpPercent: number;
}

/**
 * Detect current phase based on HP percentage
 */
export function detectCurrentPhase(
  phases: BossPhase[],
  currentHpPercent: number
): number {
  // Sort phases by HP threshold (highest to lowest)
  const sortedPhases = [...phases].sort((a, b) => b.hpThreshold - a.hpThreshold);

  // Find the phase that matches current HP
  for (let i = 0; i < sortedPhases.length; i++) {
    const phase = sortedPhases[i];
    if (currentHpPercent >= phase.hpThreshold) {
      return i + 1; // Phase numbers are 1-based
    }
  }

  // If HP is below all thresholds, we're in the last phase
  return sortedPhases.length;
}

/**
 * Check if a phase transition occurred
 */
export function checkPhaseTransition(
  currentPhase: number,
  previousHpPercent: number,
  currentHpPercent: number,
  phases: BossPhase[]
): PhaseTransition | null {
  const sortedPhases = [...phases].sort((a, b) => b.hpThreshold - a.hpThreshold);
  
  // Check if we crossed any phase threshold
  for (let i = 0; i < sortedPhases.length; i++) {
    const phase = sortedPhases[i];
    const threshold = phase.hpThreshold;
    
    // Check if we crossed this threshold (going down)
    if (previousHpPercent > threshold && currentHpPercent <= threshold) {
      return {
        fromPhase: currentPhase,
        toPhase: i + 1,
        timestamp: Date.now(),
        hpPercent: currentHpPercent
      };
    }
  }

  return null;
}

/**
 * Get mechanics for a specific phase
 */
export function getPhaseMechanics(
  phase: BossPhase,
  allMechanics: BossMechanic[]
): BossMechanic[] {
  return allMechanics.filter(mechanic => 
    phase.mechanics.includes(mechanic.name)
  );
}

/**
 * Update boss mechanics state with phase transition
 */
export function applyPhaseTransition(
  state: BossMechanicsState,
  transition: PhaseTransition
): BossMechanicsState {
  const newTransitions = new Map(state.phaseTransitions);
  newTransitions.set(transition.toPhase, transition.timestamp);

  return {
    ...state,
    currentPhase: transition.toPhase,
    phaseTransitions: newTransitions
  };
}

/**
 * Get phase announcement message
 */
export function getPhaseAnnouncement(
  phase: BossPhase,
  phaseNumber: number,
  bossName: string
): string {
  const hpPercent = Math.round(phase.hpThreshold * 100);
  return `${bossName} enters Phase ${phaseNumber} (${hpPercent}% HP)!`;
}

/**
 * Create default phases from HP thresholds
 * If phases aren't explicitly defined, create them from mechanics
 */
export function createDefaultPhases(
  mechanics: BossMechanic[],
  defaultThresholds: number[] = [1.0, 0.75, 0.5, 0.25]
): BossPhase[] {
  const phases: BossPhase[] = [];

  for (let i = 0; i < defaultThresholds.length; i++) {
    const threshold = defaultThresholds[i];
    const phaseNumber = i + 1;

    // Get mechanics for this phase (mechanics with matching phase numbers or no phase restriction)
    const phaseMechanics = mechanics
      .filter(m => !m.phases || m.phases.includes(phaseNumber))
      .map(m => m.name);

    phases.push({
      hpThreshold: threshold,
      mechanics: phaseMechanics,
      adds: undefined,
      enrageTimer: undefined
    });
  }

  return phases;
}

/**
 * Check if boss should spawn adds in current phase
 */
export function shouldSpawnAdds(
  phase: BossPhase,
  currentHpPercent: number,
  previousHpPercent: number
): boolean {
  if (!phase.adds) {
    return false;
  }

  const spawnAt = phase.adds.spawnAt || phase.hpThreshold;
  
  // Check if we crossed the spawn threshold
  return previousHpPercent > spawnAt && currentHpPercent <= spawnAt;
}



