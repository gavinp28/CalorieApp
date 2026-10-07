import { useEffect, useState } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router';
import { applyBrand, initialBrand, type BrandId } from './brand';
import { AppShell } from './components/AppShell';
import { useTheme } from './lib/theme';
import { ComingSoon } from './pages/ComingSoon';
import { ToastProvider } from './components/Toast';
import { ArchivePage } from './pages/ArchivePage';
import { DailyPage } from './pages/DailyPage';
import { PlayPage } from './pages/PlayPage';
import { StatsPage } from './pages/StatsPage';

// Direction A is chosen for now. The others stay previewable with ?brand=basil / ?brand=neon.
const SHOW_BRAND_PICKER = new URLSearchParams(location.search).has('brand');

export function App() {
  const [brand, setBrand] = useState<BrandId>(initialBrand);
  const theme = useTheme();

  useEffect(() => applyBrand(brand), [brand]);

  return (
    <ToastProvider>
      <BrowserRouter>
        <AppShell brand={brand} onBrand={setBrand} theme={theme} showBrandPicker={SHOW_BRAND_PICKER}>
          <Routes>
            <Route path="/" element={<DailyPage mode="food" />} />
            <Route path="/plate" element={<DailyPage mode="plate" />} />
            <Route
              path="/endless"
              element={
                <ComingSoon emoji="♾️" title="Endless" phase={5}>
                  Which has more calories? Three lives, unlimited rounds.
                </ComingSoon>
              }
            />
            <Route path="/archive" element={<ArchivePage />} />
            <Route path="/play/:mode/:kind/:n" element={<PlayPage />} />
            <Route path="/stats" element={<StatsPage />} />
            <Route
              path="*"
              element={
                <ComingSoon emoji="🤷" title="Nothing on this plate" phase={1}>
                  That page doesn't exist.
                </ComingSoon>
              }
            />
          </Routes>
        </AppShell>
      </BrowserRouter>
    </ToastProvider>
  );
}
