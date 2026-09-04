# template-web-sveltekit

Template base para aplicações SvelteKit da Desenrolai. Gerado pelo forge em
`forge.desenrol.ai`.

## Stack

- **SvelteKit 2** + **Svelte 5** (runes) + `adapter-node`
- **Vite 8** + **TypeScript 6** strict
- **Vitest 4** + Testing Library (Svelte)
- **ESLint 10** (flat config) + Prettier (com `prettier-plugin-svelte`)
- **Node 24 LTS**

## Começando

```bash
npm install
npm run dev
```

## Scripts

| Comando             | Descrição                                           |
| ------------------- | --------------------------------------------------- |
| `npm run dev`       | Servidor de desenvolvimento                         |
| `npm run build`     | Build de produção (`build/`)                        |
| `npm run preview`   | Preview do build                                    |
| `npm start`         | Serve o build na porta 3000                         |
| `npm run lint`      | ESLint                                              |
| `npm run format`    | Prettier (check) — `format:write` corrige           |
| `npm run typecheck` | `svelte-kit sync && svelte-check`                   |
| `npm test`          | Vitest — `test:watch` e `test:coverage` disponíveis |

## Rotas

- `/` — página inicial
- `/api/health` — health check, `{ "status": "ok" }`

## Onde os testes moram, e por quê

Config de Vitest dentro de `vite.config.ts` e helpers em `test/` **não é gosto**: o
`tsconfig.json` gerado pelo SvelteKit (`.svelte-kit/tsconfig.json`) inclui `src/`,
`test/`, `tests/` e `vite.config.ts` — e nada mais. Um `vitest.config.ts` na raiz ou um
diretório `tooling/` ficariam **fora do `svelte-check`**: código não tipado passando por um
gate verde.

`resolve.conditions: ['browser']` é obrigatório para o teste de componente: sem ele o
import de `svelte` resolve para o build de servidor, onde `mount()` — que o Testing
Library usa — não existe.

## Pool de teste dentro de container

`os.cpus()` reporta as CPUs do **host**, não o limite do cgroup. Dimensionar o pool do
Vitest por ele cria workers demais e o job morre por pressão de recurso **com todos os
testes passando**. `test/cgroup-cpus.ts` lê `/sys/fs/cgroup/cpu.max` (v2, com fallback
para `cpu.cfs_quota_us`/`cpu.cfs_period_us` do v1) e alimenta `maxWorkers` em
`vite.config.ts`.

## Deploy

Imagem multi-stage sobre `node:24-alpine`, rodando como **uid 1001** e compatível com
`readOnlyRootFilesystem: true` — que é como o forge sobe o pod. Porta **3000**, health
check em `/api/health`, batendo com o `forge.yaml`.

```
ghcr.io/desenrolai/<nome-do-repo>:main
```
