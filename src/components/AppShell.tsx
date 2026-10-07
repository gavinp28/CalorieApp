import type { ReactNode } from 'react';
import { Link, NavLink, useLocation } from 'react-router';
import { BRANDS, type BrandId } from '../brand';
import type { useTheme } from '../lib/theme';
import { ArchiveIcon, CalendarIcon, HelpIcon, InfinityIcon, MoonIcon, StatsIcon, SunIcon } from './Icons';
import { Wordmark } from './Wordmark';

const NAV = [
  { to: '/', label: 'Daily', Icon: CalendarIcon, match: (p: string) => p === '/' || p.startsWith('/plate') },
  { to: '/endless', label: 'Endless', Icon: InfinityIcon },
  { to: '/archive', label: 'Archive', Icon: ArchiveIcon },
  { to: '/stats', label: 'Stats', Icon: StatsIcon },
];

interface Props {
  brand: BrandId;
  onBrand: (b: BrandId) => void;
  theme: ReturnType<typeof useTheme>;
  showBrandPicker: boolean;
  children: ReactNode;
}

export function AppShell({ brand, onBrand, theme, showBrandPicker, children }: Props) {
  const { pathname } = useLocation();
  const iconBtn =
    'grid size-11 place-items-center rounded-full text-ink transition hover:bg-surface-2 active:scale-95';
  return (
    <div className="flex min-h-dvh flex-col overflow-x-clip">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-surface focus:px-4 focus:py-2">
        Skip to game
      </a>

      <header className="sticky top-0 z-30 border-b border-line/0 bg-bg/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-4 px-4">
          <Link to="/" aria-label={`${BRANDS[brand].name} home`} className="rounded-xl">
            <Wordmark brand={brand} />
          </Link>

          <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
            {NAV.map(({ to, label, Icon, match }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) => {
                  const active = match ? match(pathname) : isActive;
                  return `flex items-center gap-2 rounded-full px-4 py-2 text-[0.95rem] font-semibold transition ${
                    active ? 'bg-ink text-bg' : 'text-muted hover:bg-surface-2 hover:text-ink'
                  }`;
                }}
              >
                <Icon className="size-[1.15rem]" />
                {label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-1">
            <button type="button" className={iconBtn} aria-label="How to play" title="How to play (coming in Phase 5)">
              <HelpIcon />
            </button>
            <button
              type="button"
              className={iconBtn}
              onClick={theme.toggle}
              aria-label={theme.theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
            >
              {theme.theme === 'dark' ? <SunIcon /> : <MoonIcon />}
            </button>
          </div>
        </div>
      </header>

      <main id="main" className="mx-auto w-full max-w-5xl flex-1 px-4 pb-32 pt-4 md:pb-16">
        {showBrandPicker && <BrandPicker brand={brand} onBrand={onBrand} />}
        {children}
      </main>

      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
        style={{ borderTopColor: 'color-mix(in srgb, var(--ink) 10%, transparent)' }}
      >
        <ul className="mx-auto grid max-w-md grid-cols-4">
          {NAV.map(({ to, label, Icon, match }) => (
            <li key={to}>
              <NavLink to={to} className="group flex flex-col items-center gap-1 py-2.5 text-[0.7rem] font-semibold">
                {({ isActive }) => {
                  const active = match ? match(pathname) : isActive;
                  return (
                    <>
                      <span
                        className={`grid h-8 w-14 place-items-center rounded-full transition ${
                          active ? 'bg-primary text-primary-ink' : 'text-muted group-hover:text-ink'
                        }`}
                      >
                        <Icon className="size-5" />
                      </span>
                      <span className={active ? 'text-ink' : 'text-muted'}>{label}</span>
                    </>
                  );
                }}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}

/** Temporary: lets you flip between identity directions while we choose. */
function BrandPicker({ brand, onBrand }: { brand: BrandId; onBrand: (b: BrandId) => void }) {
  return (
    <div className="mb-4 flex flex-col items-center gap-1.5">
      <p className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-muted">Preview identity</p>
      <div role="radiogroup" aria-label="Identity direction preview" className="flex max-w-full gap-0.5 rounded-full border border-dashed border-muted/50 p-1 text-xs font-semibold">
        {(Object.keys(BRANDS) as BrandId[]).map((id, i) => (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={brand === id}
            onClick={() => onBrand(id)}
            className={`whitespace-nowrap rounded-full px-2.5 py-1.5 transition ${brand === id ? 'bg-ink text-bg' : 'text-muted hover:text-ink'}`}
          >
            <span className="hidden sm:inline">{String.fromCharCode(65 + i)} · </span>{BRANDS[id].name}
          </button>
        ))}
      </div>
    </div>
  );
}
