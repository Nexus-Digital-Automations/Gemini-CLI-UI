import { defineConfig } from 'vitest/config';

export default defineConfig({
  css: {
    postcss: false,
  },
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./src/test/setup.ts'],
    pool: 'forks', // Run tests sequentially to avoid database conflicts
    poolOptions: {
      forks: {
        singleFork: true, // Use single fork for sequential execution
      },
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.test.ts',
        '**/*.spec.ts',
      ],
    },
  },
});
