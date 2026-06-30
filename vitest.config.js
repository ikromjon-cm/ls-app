import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/tests/setup.js'],
    include: ['src/**/*.test.{js,jsx}', 'server/**/*.test.js'],
    env: {
      DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
      JWT_SECRET: 'test-secret-key-for-jwt-must-be-at-least-32-characters-long',
      JWT_REFRESH_SECRET: 'test-refresh-secret-key-must-be-at-least-32-characters-long',
      SESSION_SECRET: 'test-session-secret-must-be-at-least-32-characters-long',
      REDIS_URL: 'redis://localhost:6379',
    },
  },
})
