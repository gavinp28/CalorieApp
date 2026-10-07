import { useEffect, useState } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router';
import { applyBrand, initialBrand, type BrandId } from './brand';
import { AppShell } from './components/AppShell';
import { useTheme } from './lib/theme';
import { ComingSoon } from './pages/ComingSoon';
import { DailyPage } from './pages/DailyPage';

// Direction A is chosen for now. The others stay previewable with ?brand=basil / ?brand=neon.
const SHOW_BRAND_PICKER = new URLSearchParams(location.search).has('brand');

export function App() {
  const [brand, setBrand] = useState<BrandId>(initialBrand);
  const theme = useTheme();

  useEffect(() => applyBrand(brand), [brand]);

  return (
    <BrowserRouter>
      <AppShell brand={brand} onBrand={setBrand} theme={theme} showBrandPicker={SHOW_BRAND_PICKER}>
        <Routes>
          <Route path="/" element={<DailyPage mode="food" />} />
          <Route path="/plate" element={<DailyPage mode="plate" />} />
          <Route path="/endless" element={<ComingSoon emoji="♾️" title="Endless" phase={5}>Which has more calories? Three lives, unlimited rounds.</ComingSoon>} />
          <Route path="/archive" element={<ComingSoon emoji="🗂️" title="Archive" phase={3}>Every past puzzle in both modes, plus 40 bonus puzzles each.</ComingSoon>} />
          <Route path="/stats" element={<ComingSoon emoji="📊" title="Stats" phase={3}>Played, win %, streaks and your guess distribution.</ComingSoon>} />
          <Route path="*" element={<ComingSoon emoji="🤷" title="Nothing on this plate" phase={1}>That page doesn't exist.</ComingSoon>} />
        </Routes>
      </AppShell>
    </BrowserRouter>
  );
}
