import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/runtime.ts'],
  format: ['iife'],
  globalName: 'PantheraBlackBox',
  minify: true,
  sourcemap: true,
  clean: true,
  outDir: 'dist',
  target: 'es2020',
  banner: {
    js: '/* Panthera Black Box Runtime v1.0.0 - Safe, Declarative Website Control */',
  },
});
