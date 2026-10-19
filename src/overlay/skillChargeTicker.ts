type Listener = () => void;

let listeners = new Set<Listener>();
let intervalId: ReturnType<typeof setInterval> | null = null;

function ensureInterval(): void {
  if (intervalId != null) return;
  intervalId = setInterval(() => {
    listeners.forEach((fn) => fn());
  }, 250);
}

export function subscribeSkillChargeTicker(listener: Listener): () => void {
  listeners.add(listener);
  ensureInterval();
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && intervalId != null) {
      clearInterval(intervalId);
      intervalId = null;
    }
  };
}

export function getSkillChargeNow(): number {
  return Date.now();
}
