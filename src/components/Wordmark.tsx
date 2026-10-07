import { BRANDS, type BrandId } from '../brand';

/** Original logo marks: one per identity direction. */
function Mark({ brand }: { brand: BrandId }) {
  if (brand === 'tomato') {
    // A plate seen from above, with a higher/lower arrow pair standing in for a fork and knife.
    return (
      <svg viewBox="0 0 40 40" className="size-9" aria-hidden>
        <rect x="1.5" y="1.5" width="37" height="37" rx="11" fill="var(--primary)" stroke="var(--line)" strokeWidth="2.5" />
        <circle cx="20" cy="20" r="10.5" fill="var(--accent)" stroke="var(--line)" strokeWidth="2.5" />
        <path d="M16.5 24.5v-9m-3 3 3-3 3 3M23.5 15.5v9m-3-3 3 3 3-3" fill="none" stroke="var(--line)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (brand === 'basil') {
    // A plate rim with a flat-topped hill: a literal plateau.
    return (
      <svg viewBox="0 0 40 40" className="size-9" aria-hidden>
        <circle cx="20" cy="20" r="18" fill="var(--primary)" />
        <circle cx="20" cy="20" r="12.5" fill="none" stroke="var(--primary-ink)" strokeOpacity=".35" strokeWidth="1.5" />
        <path d="M9 25.5h4.5l4-7h5l4 7H31" fill="none" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  // A bullseye with a bite taken out of it.
  return (
    <svg viewBox="0 0 40 40" className="size-9" aria-hidden>
      <defs>
        <mask id="bite">
          <rect width="40" height="40" fill="#fff" />
          <circle cx="35" cy="7" r="7" fill="#000" />
          <circle cx="29" cy="3" r="4" fill="#000" />
          <circle cx="38.5" cy="14" r="4" fill="#000" />
        </mask>
      </defs>
      <g mask="url(#bite)">
        <circle cx="20" cy="20" r="18" fill="var(--primary)" />
        <circle cx="20" cy="20" r="12" fill="var(--surface)" />
        <circle cx="20" cy="20" r="6.5" fill="var(--accent)" />
      </g>
    </svg>
  );
}

export function Wordmark({ brand }: { brand: BrandId }) {
  return (
    <span className="flex items-center gap-2.5">
      <Mark brand={brand} />
      <span className="font-display text-[1.6rem] leading-none text-ink">
        {BRANDS[brand].name}
        {brand === 'tomato' && <span className="text-primary">.</span>}
      </span>
    </span>
  );
}
