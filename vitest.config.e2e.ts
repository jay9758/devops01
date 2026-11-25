import { defineConfig } from 'vitest/config';

// End-to-end tests: boot the full app against the database in DATABASE_URL.
export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    globals: true,
    root: './',
    include: ['test/**/*.e2e-spec.ts'],
    testTimeout: 15_000,
  },
});
