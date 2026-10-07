import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { migrateFromPrototype } from './lib/migrate';
import { load, save } from './lib/storage';
import './index.css';

// Bring over history saved by the original prototype (same domain), once.
migrateFromPrototype(load, save);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
