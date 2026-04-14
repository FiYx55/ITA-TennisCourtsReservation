import path from 'path';
import dotenv from 'dotenv';
import { defineConfig } from 'vitest/config';

// Load env from config/.env.test for local development.
// In CI, env vars are set directly in the workflow.
dotenv.config({ path: 'config/.env.test', override: false });

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
