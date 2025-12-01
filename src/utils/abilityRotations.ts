/**
 * Ability Rotation System
 * Handles scripted boss ability rotations for predictable patterns
 */

import { BossMechanic } from '../types/BossMechanics';

export interface RotationStep {
  mechanicName: string;
  delay: number; // Delay after previous ability (milliseconds)
  condition?: (currentHpPercent: number, phase: number) => boolean; // Optional condition
}

export interface AbilityRotation {
  name: string;
  steps: RotationStep[];
  loop: boolean; // Whether to loop the rotation
  phase?: number; // Which phase this rotation is for (optional)
}

/**
 * Create a rotation from mechanics
 */
export function createRotation(
  name: string,
  mechanics: BossMechanic[],
  delays: number[],
  loop: boolean = true,
  phase?: number
): AbilityRotation {
  const steps: RotationStep[] = mechanics.map((mechanic, index) => ({
    mechanicName: mechanic.name,
    delay: delays[index] || mechanic.cooldown || 0
  }));

  return {
    name,
    steps,
    loop,
    phase
  };
}

/**
 * Get next ability in rotation
 */
export function getNextRotationAbility(
  rotation: AbilityRotation,
  currentStep: number,
  lastAbilityTime: number,
  currentTime: number,
  currentHpPercent: number,
  currentPhase: number
): { mechanicName: string | null; stepIndex: number } | null {
  if (rotation.steps.length === 0) {
    return null;
  }

  // Check if we should use this rotation (phase check)
  if (rotation.phase !== undefined && rotation.phase !== currentPhase) {
    return null;
  }

  // Get current step
  const step = rotation.steps[currentStep % rotation.steps.length];
  
  // Check condition if present
  if (step.condition && !step.condition(currentHpPercent, currentPhase)) {
    // Skip to next step
    const nextStep = (currentStep + 1) % rotation.steps.length;
    return getNextRotationAbility(
      rotation,
      nextStep,
      lastAbilityTime,
      currentTime,
      currentHpPercent,
      currentPhase
    );
  }

  // Check if delay has passed
  const timeSinceLastAbility = currentTime - lastAbilityTime;
  if (timeSinceLastAbility >= step.delay) {
    return {
      mechanicName: step.mechanicName,
      stepIndex: currentStep
    };
  }

  return null;
}

/**
 * Advance rotation step
 */
export function advanceRotation(
  rotation: AbilityRotation,
  currentStep: number
): number {
  if (!rotation.loop && currentStep >= rotation.steps.length - 1) {
    return currentStep; // Don't advance past last step if not looping
  }
  return (currentStep + 1) % rotation.steps.length;
}

/**
 * Create default rotation from mechanics (uses cooldowns as delays)
 */
export function createDefaultRotation(
  mechanics: BossMechanic[],
  phase?: number
): AbilityRotation {
  const steps: RotationStep[] = mechanics.map(mechanic => ({
    mechanicName: mechanic.name,
    delay: mechanic.cooldown || 5000
  }));

  return {
    name: `Default Rotation ${phase ? `(Phase ${phase})` : ''}`,
    steps,
    loop: true,
    phase
  };
}



