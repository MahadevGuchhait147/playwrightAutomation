import { defineConfig } from 'vitest/config';

const isStryker = Boolean(process.env.STRYKER_MUTATOR);

export default defineConfig({
  test: {
    include: ['unit/**/*.test.ts'],
    environment: 'node',
    reporters: isStryker ? ['dot'] : ['default', 'github-actions']
  }
});
