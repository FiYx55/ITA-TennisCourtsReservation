import path from 'path';
import dotenv from 'dotenv';
import { defineConfig } from 'vitest/config';

dotenv.config({ path: 'config/.env.test' });

const config = defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/support/agent.ts'],
    isolate: true,
  },
  resolve: {
    alias: {
      '@src': path.resolve(__dirname, './src'),
    },
  },
});

export default config;
