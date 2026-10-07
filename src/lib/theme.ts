import { useCallback, useEffect, useState } from 'react';
import { load, save } from './storage';

export type ThemePref = 'light' | 'dark' | 'system';

const media = () => window.matchMedia('(prefers-color-scheme: dark)');

function resolve(pref: ThemePref): 'light' | 'dark' {
  return pref === 'system' ? (media().matches ? 'dark' : 'light') : pref;
}

export function applyTheme(pref: ThemePref) {
  const theme = resolve(pref);
  document.documentElement.dataset.theme = theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', getComputedStyle(document.documentElement).getPropertyValue('--bg').trim());
}

export function useTheme() {
  const [pref, setPref] = useState<ThemePref>(() => load<ThemePref>('theme', 'system'));

  useEffect(() => {
    applyTheme(pref);
    save('theme', pref);
    if (pref !== 'system') return;
    const m = media();
    const onChange = () => applyTheme('system');
    m.addEventListener('change', onChange);
    return () => m.removeEventListener('change', onChange);
  }, [pref]);

  /** Flips between light and dark (leaving "system" once the player chooses). */
  const toggle = useCallback(() => setPref((p) => (resolve(p) === 'dark' ? 'light' : 'dark')), []);
  return { pref, theme: resolve(pref), setPref, toggle };
}
