import { openCleanBattlefield } from '../utils/battlefieldUrls';

type Props = {
  twitchId?: string | null;
  variant?: 'hero-tab' | 'nav';
};

/**
 * Primary entry to the idle combat overlay on small screens (Portal tabs hide "Browser Source" off-screen).
 */
export default function BattlefieldQuickAccess({ twitchId, variant = 'hero-tab' }: Props) {
  if (!twitchId) return null;

  const open = () => openCleanBattlefield(twitchId, { darkMode: true, newTab: variant === 'nav' });

  if (variant === 'nav') {
    return (
      <button
        type="button"
        onClick={open}
        className="w-full text-left font-semibold transition-colors rounded-lg px-4 py-3 min-h-[44px] flex items-center text-cyan-400 hover:text-cyan-300 hover:bg-gray-800/80"
      >
        Battlefield
      </button>
    );
  }

  return (
    <div className="rounded-xl border-2 border-cyan-700/50 bg-gradient-to-br from-gray-900 to-gray-800 p-4 shadow-lg lg:hidden">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-cyan-400">Live combat</div>
          <p className="text-sm text-gray-200 mt-1">
            Watch your hero fight on the Clean Battlefield overlay.
          </p>
        </div>
        <button
          type="button"
          onClick={open}
          className="min-h-[44px] shrink-0 rounded-lg bg-cyan-600 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-700"
        >
          Open battlefield
        </button>
      </div>
    </div>
  );
}
