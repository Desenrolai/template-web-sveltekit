import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

import { maxTestWorkers } from './test/cgroup-cpus.ts';

export default defineConfig({
  plugins: [sveltekit()],
  // Sem a condição `browser` o import de `svelte` resolve para o build de
  // servidor e `mount()` — que o Testing Library usa — não existe lá.
  resolve: { conditions: ['browser'] },
  test: {
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts'],
    include: ['{src,test}/**/*.test.ts'],
    pool: 'threads',
    // Sem isto o pool dimensiona por os.cpus() — as CPUs do HOST, não as do
    // cgroup — e estoura o limite do container. Ver test/cgroup-cpus.ts.
    maxWorkers: maxTestWorkers(),
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/**/*.{ts,svelte}', 'test/cgroup-cpus.ts'],
      exclude: ['**/*.test.*', 'src/app.d.ts', 'test/setup.ts'],
    },
  },
});
