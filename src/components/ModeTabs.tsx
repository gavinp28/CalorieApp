import { NavLink } from 'react-router';

const TABS = [
  { to: '/', label: 'Single food', emoji: '🍎' },
  { to: '/plate', label: 'Full plate', emoji: '🍽️' },
];

export function ModeTabs() {
  return (
    <nav aria-label="Game mode" className="mx-auto mb-4 flex w-full max-w-md rounded-full bg-surface-2 p-1">
      {TABS.map((t) => (
        <NavLink
          key={t.to}
          to={t.to}
          end
          className={({ isActive }) =>
            `flex flex-1 items-center justify-center gap-2 rounded-full py-2.5 text-sm font-bold transition ${
              isActive ? 'bg-surface text-ink shadow-sm' : 'text-muted hover:text-ink'
            }`
          }
        >
          <span aria-hidden>{t.emoji}</span>
          {t.label}
        </NavLink>
      ))}
    </nav>
  );
}
