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

## Validação de cookies

O Kit 2.70.3 ainda declara `cookie ^0.6.0`, afetado por
[GHSA-pxg6-pf52-xh8x](https://github.com/advisories/GHSA-pxg6-pf52-xh8x).
O override limitado à dependência do Kit usa `cookie 0.7.2`: mantém `parse` e
`serialize`, mas rejeita nomes, paths e domínios capazes de injetar atributos.
Não há downgrade nem atualização major de Kit, Svelte ou adapter.

`test/cookie-security.test.ts` resolve a cópia efetivamente consumida pelo Kit e
cobre os três vetores de injeção, sessão válida, exclusão, parsing e encode/decode.
Antes da correção: 3 testes falhavam e 4 passavam. Após a correção: os mesmos 7
passam. Execute `npm test -- test/cookie-security.test.ts` e
`npm audit --package-lock-only` ao atualizar dependências; retire o override
quando o Kit declarar uma versão corrigida e esses checks permanecerem verdes.

## Pool de teste dentro de container

`os.cpus()` reporta as CPUs do **host**, não o limite do cgroup. Dimensionar o pool do
Vitest por ele cria workers demais e o job morre por pressão de recurso **com todos os
testes passando**. `test/cgroup-cpus.ts` lê `/sys/fs/cgroup/cpu.max` (v2, com fallback
para `cpu.cfs_quota_us`/`cpu.cfs_period_us` do v1) e alimenta `maxWorkers` em
`vite.config.ts`.

## Repo privado: o CI nasce morto sem estas variáveis

Este template é um repositório **público**, onde o GitHub Actions em runner hospedado é
gratuito e ilimitado — por isso o CI daqui está verde. O repo que você gera a partir dele
é **privado**, e lá a cota de minutos hospedados está esgotada. Antes do primeiro push,
defina duas _repository variables_ (Settings → Secrets and variables → Actions →
Variables):

| Variável           | Valor                              |
| ------------------ | ---------------------------------- |
| `CI_RUNNER`        | `["self-hosted","desenrolai"]`     |
| `CI_RUNNER_DOCKER` | `["self-hosted","docker-builder"]` |

O `runs-on` lê essas variáveis e cai em `ubuntu-latest` quando elas não existem — é o que
mantém o CI deste template rodando em runner hospedado. O `fromJSON` não é enfeite: um
runner self-hosted da casa é um **conjunto de labels**, e `self-hosted,desenrolai` como
string simples viraria um único label com vírgula no nome, que não casa com runner nenhum.

> ⚠️ **O sintoma de não fazer isto não parece falta de runner.** O job morre em ~2
> segundos com **`steps: 0`** — nenhum step aparece, nenhum log de erro, nada que aponte
> para billing. Parece YAML quebrado, e a pessoa perde meia hora procurando erro de
> sintaxe. É cota.
>
> O que separa esse caso de um job legitimamente `skipped` — que **também** reporta zero
> steps — é a conclusão: aqui ela é `failure`, não `skipped`.

## Deploy

Imagem multi-stage sobre `node:24-alpine`, rodando como **uid 1001** e compatível com
`readOnlyRootFilesystem: true` — que é como o forge sobe o pod. Porta **3000**, health
check em `/api/health`, batendo com o `forge.yaml`.

```
ghcr.io/desenrolai/<nome-do-repo>:main
```

Em **pull request** a imagem é construída e descartada — sem login no GHCR e sem
`packages: write`. É o que impede um `Dockerfile` quebrado de atravessar o PR verde.
