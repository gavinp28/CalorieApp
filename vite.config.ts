import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';
import { netlifyFunctions } from './dev/netlify-functions';

export default defineConfig(({ mode }) => {
  // Make .env secrets (STRIPE_SECRET_KEY, UNLOCK_SECRET, ...) visible to the
  // functions served in dev, like Netlify does in production. Only VITE_*
  // variables ever reach the browser bundle.
  for (const [k, v] of Object.entries(loadEnv(mode, process.cwd(), ''))) process.env[k] ??= v;
  return { plugins: [react(), tailwindcss(), netlifyFunctions()] };
});
