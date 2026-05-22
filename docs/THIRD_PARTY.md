# Third-party development tooling

Runtime libraries the webapp + desktop app ship with are listed on the
[About page](https://poli0981.github.io/free-games-itchio-list/app/#/about)
and in [`webapp/src/lib/about.ts`](../webapp/src/lib/about.ts) (the
`THIRD_PARTY` array). This file covers the **dev-only** tooling — stuff that
never lands in a build but keeps the code honest.

## Dead-code detection

The tools that stop unused code from quietly piling up:

- **[knip](https://knip.dev)** — MIT. Finds unused files, exports, and
  dependencies across the React + TypeScript webapp.
  Config: [`webapp/knip.json`](../webapp/knip.json) · Run: `cd webapp && npm run knip`
- **[vulture](https://github.com/jendrikseipp/vulture)** — MIT. Finds dead
  code (unused functions, classes, attributes) in the Python pipeline.
  Config: `[tool.vulture]` in [`pyproject.toml`](../pyproject.toml) · Run: `vulture`

## Linting & types

Already on the job — and they catch a slice of dead code too:

- **[ruff](https://github.com/astral-sh/ruff)** — MIT. Python linter + import
  sorter; flags unused imports and variables.
  Config: `[tool.ruff]` in [`pyproject.toml`](../pyproject.toml) · Run: `ruff check scripts/`
- **[ESLint](https://eslint.org)** + **[typescript-eslint](https://typescript-eslint.io)**
  — MIT. Webapp linting.
  Config: [`webapp/eslint.config.js`](../webapp/eslint.config.js) · Run: `cd webapp && npm run lint`
- **[TypeScript](https://www.typescriptlang.org)** — Apache-2.0. `noUnusedLocals`
  and `noUnusedParameters` reject unused locals and parameters at build time.

The rest of the webapp build tooling (Vite, Tailwind, PostCSS, …) lives in
[`webapp/package.json`](../webapp/package.json) under `devDependencies`.

---

Adding a new dev tool? Drop it here so the next person — or AI buddy — knows
what's keeping an eye on the code.
