/** Unified active instance statuses (backend normalizing to one spelling). */
export const ACTIVE_INSTANCE_STATUSES = [
  'active',
  'in-progress',
  'in_progress',
  'starting',
] as const;

export type ActiveInstanceStatus = (typeof ACTIVE_INSTANCE_STATUSES)[number];

export function isActiveInstanceStatus(status: string | undefined | null): boolean {
  if (!status) return false;
  return (ACTIVE_INSTANCE_STATUSES as readonly string[]).includes(status);
}
