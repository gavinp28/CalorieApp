// Visual identity directions. All three ship while we choose; once one is picked,
// the others get deleted and BRAND becomes a constant.

export type BrandId = 'tomato' | 'basil' | 'neon';

export interface Brand {
  id: BrandId;
  name: string;
  tagline: string;
  direction: string;
}

export const BRANDS: Record<BrandId, Brand> = {
  tomato: {
    id: 'tomato',
    name: 'Forkcast',
    tagline: 'Call the calories.',
    direction: 'Diner Pop: tomato, butter & ink. Chunky type, sticker cards.',
  },
  basil: {
    id: 'basil',
    name: 'Plateau',
    tagline: 'A daily calorie puzzle.',
    direction: 'Market Fresh: basil, lime & oat. Editorial serif, soft cards.',
  },
  neon: {
    id: 'neon',
    name: 'Snackuracy',
    tagline: 'How sharp is your calorie sense?',
    direction: 'Late-Night Snack: grape, coral & mint. Geometric type, glowing cards.',
  },
};

export const DEFAULT_BRAND: BrandId = 'tomato';
const KEY = 'cd1:brand';

export function initialBrand(): BrandId {
  const fromUrl = new URLSearchParams(location.search).get('brand');
  if (fromUrl && fromUrl in BRANDS) return fromUrl as BrandId;
  try {
    const saved = localStorage.getItem(KEY);
    if (saved && saved in BRANDS) return saved as BrandId;
  } catch {
    /* storage unavailable */
  }
  return DEFAULT_BRAND;
}

export function applyBrand(id: BrandId) {
  document.documentElement.dataset.brand = id;
  document.title = `${BRANDS[id].name} · ${BRANDS[id].tagline}`;
  try {
    localStorage.setItem(KEY, id);
  } catch {
    /* ignore */
  }
}
