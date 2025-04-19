import fs from 'node:fs/promises';
import path from 'node:path';
import dts from 'vite-plugin-dts';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src', 'index.ts'),
      fileName: (format, entryName) => {
        let directory = '';

        if (entryName.startsWith('recommended')) {
          directory = 'configs/';
        }

        return `${directory}${entryName}.${format === 'es' ? 'mjs' : 'js'}`;
      },
      formats: ['cjs', 'es'],
      name: 'eslint-plugin-sort-svelte-attributes'
    },
    minify: false,
    rollupOptions: {
      external: (id: string) => !id.startsWith('.') && !path.isAbsolute(id),
      output: {
        exports: 'auto',
        preserveModules: true
      }
    }
  },
  plugins: [
    dts({
      afterBuild: async () => {
        await fs.writeFile(
          'dist/index.d.ts',
          `${(await fs.readFile('dist/index.d.ts'))
            .toString()
            .replace(/\nexport .+/, '')}export = _default`
        );
      },
      include: [
        path.join(__dirname, 'src/index.ts'),
        path.join(__dirname, 'src/types'),
        path.join(__dirname, 'src/rules'),
        path.join(__dirname, 'src/utils')
      ],
      insertTypesEntry: true,
      rollupTypes: true,
      strictOutput: true
    })
  ],
  test: {
    coverage: { all: false },
    globals: true
  }
});
