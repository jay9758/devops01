import { defineConfig } from 'vitest/config';

// Unit tests: fast, isolated, no database required.
export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    globals: true,
    root: './',
    include: ['src/**/*.spec.ts'],
    coverage: {
      include: ['src/**/*.ts'],
      exclude: ['src/generated/**', 'src/main.ts', 'src/**/*.spec.ts'],
    },
  },
});
