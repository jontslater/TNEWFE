import bundled from './data/skillDefinitions.json';

export type SkillDefinitionRecord = {
  id: string;
  name: string;
  class: string;
  className: string;
  category: string;
  unlockLevel: number;
  effect: string;
  stat: string | null;
  baseValuePerRank: number;
  maxPoints: number;
  description: string;
};

export type SkillDefinitionsPayload = typeof bundled;

let cachedRemote: SkillDefinitionsPayload | null = null;

export function getBundledSkillDefinitions(): SkillDefinitionsPayload {
  return bundled;
}

export function getSkillDefinitions(): SkillDefinitionsPayload {
  return cachedRemote ?? bundled;
}

export function setRemoteSkillDefinitions(payload: SkillDefinitionsPayload): void {
  cachedRemote = payload;
}

/** Fetch from API; falls back to bundled JSON on failure. */
export async function fetchSkillDefinitions(
  fetcher: () => Promise<SkillDefinitionsPayload>
): Promise<SkillDefinitionsPayload> {
  try {
    const payload = await fetcher();
    setRemoteSkillDefinitions(payload);
    return payload;
  } catch {
    return getBundledSkillDefinitions();
  }
}

export function getBalanceCaps() {
  return getSkillDefinitions().caps;
}
