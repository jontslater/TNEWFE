import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { loginWithTwitch } from '../utils/twitchOAuth';
import logo from '../Logos/TheNeverEndingWarLogo.png';
import { useHeroListener } from '../hooks/useHeroListener';
import { questAPI } from '../api/client';
import { getStoredSelectedHeroId } from '../utils/selectedHeroStorage';

const questCacheByHero = new Map<
  string,
  { daily: unknown; weekly: unknown; monthly: unknown; timestamp: number }
>();
const QUEST_CACHE_DURATION = 5 * 60 * 1000;

async function getCachedQuests(heroId: string | null) {
  if (!heroId) {
    return { daily: null, weekly: null, monthly: null };
  }

  const now = Date.now();
  const cached = questCacheByHero.get(heroId);
  if (cached && now - cached.timestamp < QUEST_CACHE_DURATION) {
    return { daily: cached.daily, weekly: cached.weekly, monthly: cached.monthly };
  }

  const [daily, weekly, monthly] = await Promise.all([
    questAPI.getDailyQuests(heroId),
    questAPI.getWeeklyQuests(heroId),
    questAPI.getMonthlyQuests(heroId),
  ]);

  questCacheByHero.set(heroId, { daily, weekly, monthly, timestamp: now });
  return { daily, weekly, monthly };
}

type NavLinkItem = {
  label: string;
  path: string;
  tone?: 'default' | 'cyan' | 'yellow' | 'purple';
  authRequired?: boolean;
  adminOnly?: boolean;
};

const PUBLIC_LINKS: NavLinkItem[] = [
  { label: 'Classes', path: '/classes' },
  { label: 'Professions', path: '/professions' },
  { label: 'Raids', path: '/raids' },
  { label: 'FAQ', path: '/faq', tone: 'cyan' },
  { label: 'Store', path: '/store', tone: 'yellow' },
  { label: 'Founders Pack', path: '/founders-pack', tone: 'purple' },
  { label: 'Founders Hall', path: '/founders-hall', tone: 'yellow' },
];

const AUTH_LINKS: NavLinkItem[] = [
  { label: 'Portal', path: '/portal', tone: 'purple' },
  { label: 'Leaderboards', path: '/leaderboards', tone: 'cyan' },
  { label: 'Reports', path: '/reports', tone: 'default', adminOnly: true },
];

function linkToneClasses(tone: NavLinkItem['tone'], active: boolean): string {
  if (active) return 'text-white bg-gray-800';
  switch (tone) {
    case 'cyan':
      return 'text-cyan-400 hover:text-cyan-300 hover:bg-gray-800/80';
    case 'yellow':
      return 'text-yellow-400 hover:text-yellow-300 hover:bg-gray-800/80';
    case 'purple':
      return 'text-purple-400 hover:text-purple-300 hover:bg-gray-800/80';
    default:
      return 'text-gray-300 hover:text-white hover:bg-gray-800/80';
  }
}

export default function Navigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user, logout } = useAuth();
  const twitchUserId = user?.twitchId || user?.id || null;
  const [selectedHeroDocId, setSelectedHeroDocId] = useState<string | null>(() =>
    getStoredSelectedHeroId(twitchUserId)
  );
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setSelectedHeroDocId(getStoredSelectedHeroId(twitchUserId));
  }, [twitchUserId]);

  useEffect(() => {
    if (!twitchUserId) return;

    const onStorage = (event: StorageEvent) => {
      if (event.key === `selectedHeroId_${twitchUserId}`) {
        setSelectedHeroDocId(event.newValue);
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [twitchUserId]);

  useEffect(() => {
    if (!twitchUserId) return;
    const interval = setInterval(() => {
      const stored = getStoredSelectedHeroId(twitchUserId);
      setSelectedHeroDocId((prev) => (prev === stored ? prev : stored));
    }, 2000);
    return () => clearInterval(interval);
  }, [twitchUserId]);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  const { questProgress, getUnclaimedQuestCount } = useHeroListener(selectedHeroDocId);
  const [unclaimedQuestsCount, setUnclaimedQuestsCount] = useState(0);
  const [questTemplates, setQuestTemplates] = useState<{
    daily: unknown;
    weekly: unknown;
    monthly: unknown;
  } | null>(null);

  const loadQuestTemplates = useCallback(async (heroId: string | null) => {
    if (!heroId) {
      setQuestTemplates(null);
      return;
    }
    try {
      const quests = await getCachedQuests(heroId);
      setQuestTemplates(quests);
    } catch (err) {
      console.error('[Navigation] Failed to load quest templates:', err);
      setQuestTemplates(null);
    }
  }, []);

  useEffect(() => {
    loadQuestTemplates(selectedHeroDocId);
  }, [selectedHeroDocId, loadQuestTemplates]);

  useEffect(() => {
    if (!questProgress || !questTemplates) {
      setUnclaimedQuestsCount(0);
      return;
    }

    const count = getUnclaimedQuestCount(
      questTemplates.daily,
      questTemplates.weekly,
      questTemplates.monthly
    );
    setUnclaimedQuestsCount(count);
  }, [questProgress, questTemplates, getUnclaimedQuestCount]);

  const isAdmin = user?.twitchUsername?.toLowerCase() === 'theneverendingwar';

  const visibleAuthLinks = AUTH_LINKS.filter(
    (link) => !link.adminOnly || isAdmin
  );

  const goTo = (path: string) => {
    setMobileOpen(false);
    navigate(path);
  };

  const renderNavButton = (item: NavLinkItem, variant: 'desktop' | 'mobile') => {
    const active = location.pathname === item.path;
    const base =
      variant === 'desktop'
        ? 'text-sm font-semibold transition-colors rounded-md px-2 py-1.5 whitespace-nowrap'
        : 'w-full text-left font-semibold transition-colors rounded-lg px-4 py-3 min-h-[44px] flex items-center justify-between';

    return (
      <button
        key={item.path}
        type="button"
        onClick={() => goTo(item.path)}
        className={`${base} ${linkToneClasses(item.tone, active)}`}
      >
        <span>{item.label}</span>
        {item.path === '/portal' && unclaimedQuestsCount > 0 && (
          <span className="ml-2 inline-flex min-h-[22px] min-w-[22px] items-center justify-center rounded-full bg-orange-600 px-1.5 text-xs font-bold text-white">
            {unclaimedQuestsCount > 9 ? '9+' : unclaimedQuestsCount}
          </span>
        )}
      </button>
    );
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-gray-800 bg-gray-900/95 shadow-lg backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-4 py-3 sm:py-4">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => goTo('/')}
            className="flex min-h-[44px] shrink-0 items-center gap-2 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
            aria-label="The Never Ending War home"
          >
            <img src={logo} alt="" className="h-10 w-auto sm:h-12" />
            <span className="rounded-md border border-orange-500 bg-orange-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white sm:text-xs">
              Beta
            </span>
          </button>

          <div className="hidden lg:flex lg:flex-1 lg:items-center lg:justify-between lg:gap-6 lg:pl-4">
            <div className="flex flex-wrap items-center gap-x-1 gap-y-1">
              {PUBLIC_LINKS.map((item) => renderNavButton(item, 'desktop'))}
              {isAuthenticated &&
                visibleAuthLinks.map((item) => renderNavButton(item, 'desktop'))}
            </div>

            <div className="flex shrink-0 items-center gap-3">
              {isAuthenticated ? (
                <>
                  <span className="max-w-[140px] truncate text-sm text-gray-300 xl:max-w-none">
                    {user?.twitchUsername}
                  </span>
                  <button
                    type="button"
                    onClick={logout}
                    className="min-h-[44px] rounded-lg bg-gray-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-gray-600"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={loginWithTwitch}
                  className="min-h-[44px] rounded-lg bg-purple-600 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-purple-700"
                >
                  Log in with Twitch
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 lg:hidden">
            {isAuthenticated && (
              <span className="max-w-[96px] truncate text-xs text-gray-400 sm:max-w-[140px] sm:text-sm">
                {user?.twitchUsername}
              </span>
            )}
            <button
              type="button"
              className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-gray-700 bg-gray-800 text-white hover:bg-gray-700"
              aria-expanded={mobileOpen}
              aria-controls="mobile-nav-panel"
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              onClick={() => setMobileOpen((open) => !open)}
            >
              <span className="sr-only">{mobileOpen ? 'Close' : 'Menu'}</span>
              {mobileOpen ? (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {mobileOpen && (
        <div
          id="mobile-nav-panel"
          className="border-t border-gray-800 bg-gray-900 lg:hidden"
        >
          <div className="mx-auto max-w-7xl space-y-1 px-4 py-3">
            {PUBLIC_LINKS.map((item) => renderNavButton(item, 'mobile'))}
            {isAuthenticated &&
              visibleAuthLinks.map((item) => renderNavButton(item, 'mobile'))}
            <div className="mt-3 border-t border-gray-800 pt-3">
              {isAuthenticated ? (
                <button
                  type="button"
                  onClick={() => {
                    setMobileOpen(false);
                    logout();
                  }}
                  className="flex min-h-[44px] w-full items-center justify-center rounded-lg bg-gray-700 px-4 py-3 font-semibold text-white hover:bg-gray-600"
                >
                  Logout
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setMobileOpen(false);
                    loginWithTwitch();
                  }}
                  className="flex min-h-[44px] w-full items-center justify-center rounded-lg bg-purple-600 px-4 py-3 font-bold text-white hover:bg-purple-700"
                >
                  Log in with Twitch
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
