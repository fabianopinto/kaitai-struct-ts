import { defineConfig } from 'tsup'

export default defineConfig([
  // Library build (Node.js)
  {
    entry: ['src/index.ts'],
    format: ['cjs', 'esm'],
    dts: true,
    splitting: false,
    sourcemap: true,
    clean: true,
    minify: false,
    target: 'es2020',
    outDir: 'dist',
  },
  // Browser build (optimized)
  {
    entry: ['src/index.ts'],
    format: ['esm'],
    dts: false,
    splitting: true,
    sourcemap: true,
    clean: false,
    minify: true,
    target: 'es2020',
    outDir: 'dist/browser',
    platform: 'browser',
    treeshake: true,
    external: ['fs', 'path', 'util'],
    esbuildOptions(options) {
      options.mangleProps = /^_/
      options.drop = ['console', 'debugger']
    },
  },
  // CLI build (CommonJS only, shebang in source file)
  {
    entry: ['src/cli.ts'],
    format: ['cjs'],
    dts: false,
    splitting: false,
    sourcemap: false,
    clean: false,
    minify: false,
    target: 'es2020',
    outDir: 'dist',
    // Note: shebang is already in src/cli.ts, no need to add via banner
  },
])
