import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./vitest.setup.ts'],
  },
  resolve: {
    alias: [
      { find: '@', replacement: path.resolve(__dirname, './src') },
      { find: /^@gpto\/database$/, replacement: path.resolve(__dirname, '../../packages/database/src/index.ts') },
      { find: /^@gpto\/database\/src\/schema$/, replacement: path.resolve(__dirname, '../../packages/database/src/schema.ts') },
      { find: /^@gpto\/api$/, replacement: path.resolve(__dirname, '../../packages/api/src/index.ts') },
      { find: /^@gpto\/api\/src\/errors$/, replacement: path.resolve(__dirname, '../../packages/api/src/errors.ts') },
      { find: /^@gpto\/schemas$/, replacement: path.resolve(__dirname, '../../packages/schemas/src/index.ts') },
      { find: /^@gpto\/audit$/, replacement: path.resolve(__dirname, '../../packages/audit/src/index.ts') },
    ],
  },
});
