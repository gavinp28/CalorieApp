import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['shared/**/*.test.ts', 'netlify/**/*.test.ts', 'src/**/*.test.ts', 'data/**/*.test.ts'],
    environment: 'node',
  },
});
