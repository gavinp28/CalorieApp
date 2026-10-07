import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { netlifyFunctions } from './dev/netlify-functions';

export default defineConfig({
  plugins: [react(), tailwindcss(), netlifyFunctions()],
});
