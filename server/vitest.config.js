import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    include: ['tests/**/*.test.js'],
    env: {
      DATABASE_URL: 'postgresql://postgres:postgres@localhost:5434/opencode_crm',
      JWT_SECRET: 'test-secret-key-for-jwt-must-be-at-least-32-characters-long',
      JWT_REFRESH_SECRET: 'test-refresh-secret-key-must-be-at-least-32-characters-long',
      SESSION_SECRET: 'test-session-secret-must-be-at-least-32-characters-long',
      REDIS_URL: 'redis://localhost:6379',
    },
  },
})
