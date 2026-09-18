# Third-party components

Last updated: 2026-09-18

Applies from: the release of version 4.0.0.

The website <https://freeitchgames.win>, its Worker, the desktop and Android apps and the data pipeline are
built on open-source software. This file lists the direct dependencies and the licenses they are published
under. Each component keeps its own license; the project's licenses ([`NOTICE.md`](../NOTICE.md)) do not
change them.

- Versions are the ranges declared in [`webapp/package.json`](../webapp/package.json),
  [`webapp/src-tauri/Cargo.toml`](../webapp/src-tauri/Cargo.toml),
  [`requirements.txt`](../requirements.txt) and [`requirements-dev.txt`](../requirements-dev.txt).
  Exact versions, including dependencies of dependencies, are pinned in
  [`webapp/package-lock.json`](../webapp/package-lock.json) (npm) and resolved at build time for Rust and
  Python (`npm ls`, `cargo tree` and `pip list` show the full trees).
- The runtime libraries are also listed on the [About page](https://freeitchgames.win/about), which reads
  the `THIRD_PARTY` array in [`webapp/src/lib/about.ts`](../webapp/src/lib/about.ts).

## 1. Website and apps (shipped in the browser bundle)

These libraries are bundled into the public website and the desktop / Android apps, which reuse the
website's code. The `/admin` app uses a subset of them (React, React Router, TanStack Query and some of the
shared UI components).

| Component | Version | Used for | License |
|---|---|---|---|
| [React](https://react.dev) (`react`, `react-dom`) | 19.3 | UI framework | MIT |
| [React Router](https://reactrouter.com) (`react-router`) | 8.4 | Routing | MIT |
| [Zustand](https://github.com/pmndrs/zustand) | 5.0 | Preference and theme stores | MIT |
| [TanStack Query](https://tanstack.com/query) (`@tanstack/react-query`, `react-query-persist-client`, `query-async-storage-persister`) | 5.103 | Data fetching and the local catalog cache | MIT |
| [idb-keyval](https://github.com/jakearchibald/idb-keyval) | 6.3 | IndexedDB storage for the catalog cache | Apache-2.0 |
| [Recharts](https://recharts.org) | 3.10 | Charts | MIT |
| [Radix UI](https://www.radix-ui.com) primitives (`@radix-ui/react-checkbox`, `-dialog`, `-label`, `-popover`, `-separator`, `-slot`, `-switch`, `-tabs`) | 1.x / 2.x | Accessible UI building blocks | MIT |
| [shadcn/ui](https://ui.shadcn.com) | pattern | Component patterns copied into `webapp/src/components/ui/` | MIT |
| [lucide-react](https://lucide.dev) | 1.47 | Icons | ISC |
| [class-variance-authority](https://cva.style) | 0.7 | Component variants | Apache-2.0 |
| [clsx](https://github.com/lukeed/clsx) | 2.1 | Class-name helper | MIT |
| [tailwind-merge](https://github.com/dcastil/tailwind-merge) | 3.7 | Class-name merging | MIT |
| [Tailwind CSS](https://tailwindcss.com) (`tailwindcss`, `@tailwindcss/vite`) and [tw-animate-css](https://github.com/Wombosvideo/tw-animate-css) | 4.3 / 1.4 | Generate the site's CSS at build time | MIT |
| [Geist and Geist Mono](https://vercel.com/font) (`@fontsource-variable/geist`, `@fontsource-variable/geist-mono`) | 5.3 | The site's typefaces | OFL-1.1 (fonts), MIT (Fontsource packaging) |
| [`@tauri-apps/api`](https://github.com/tauri-apps/tauri/tree/dev/packages/api) | 2.11 | App-only bridge to the native shell | Apache-2.0 OR MIT |
| [`@tauri-apps/plugin-opener`](https://github.com/tauri-apps/plugins-workspace/tree/v2/plugins/opener) | 2.5 | App-only: opens itch.io links in the system browser | Apache-2.0 OR MIT |

`@tanstack/react-query-devtools` (MIT) is listed as a dependency but only renders in development builds.

The Geist fonts are bundled into the site and served from it (never from a font CDN), so pages make no
requests to third-party font services. The fonts are licensed under the SIL Open Font License 1.1.

## 2. Worker (server code on Cloudflare)

| Component | Version | Used for | License |
|---|---|---|---|
| [jose](https://github.com/panva/jose) | 6.2 | Verifying Cloudflare Access tokens and signing the GitHub App token | MIT |

The Worker runs on Cloudflare's Workers runtime and uses Cloudflare services (R2, D1, Images, Rate
Limiting, Access). Two scripts come from Cloudflare instead of the site's own bundle: the Web Analytics
beacon (`static.cloudflareinsights.com`) and, on the Suggest page only, the Turnstile widget
(`challenges.cloudflare.com`). These are Cloudflare services under Cloudflare's own terms, not open-source
components. Section 7 lists every service the project uses.

## 3. Desktop and Android apps (Rust crates)

| Crate | Version | Used for | License |
|---|---|---|---|
| [tauri](https://tauri.app), `tauri-build` | 2 | App shell and build helper | Apache-2.0 OR MIT |
| [tauri-plugin-opener](https://github.com/tauri-apps/plugins-workspace/tree/v2/plugins/opener) | 2 | Opening links in the system browser | Apache-2.0 OR MIT |
| [tauri-plugin-single-instance](https://github.com/tauri-apps/plugins-workspace/tree/v2/plugins/single-instance) | 2 | Desktop only: focuses the running window instead of starting a second copy | Apache-2.0 OR MIT |
| [serde](https://serde.rs), [serde_json](https://github.com/serde-rs/json) | 1 | Serialization | MIT OR Apache-2.0 |

The apps render with the system web view that the operating system provides: WebView2 on Windows,
WKWebView on macOS (Safari/WebKit 16.4 or later), WebKitGTK on Linux and Android System WebView on Android.

## 4. Data pipeline (Python 3.14)

| Package | Version | Used for | License |
|---|---|---|---|
| [requests](https://requests.readthedocs.io) | 2.34+ | HTTP requests to public itch.io pages | Apache-2.0 |
| [beautifulsoup4](https://www.crummy.com/software/BeautifulSoup/) | 4.15+ | Parsing itch.io pages | MIT |

These pull in `urllib3` (MIT), `certifi` (MPL-2.0), `charset-normalizer` (MIT), `idna` (BSD-3-Clause) and
`soupsieve` (MIT).

## 5. Development and test tooling (never shipped)

These tools never end up in a build, but they keep the code honest.

### Dead-code detection

- **[knip](https://knip.dev)** (ISC) finds unused files, exports and dependencies in the webapp and the
  Worker. Config: [`webapp/knip.json`](../webapp/knip.json). Run: `cd webapp && npm run knip`
- **[vulture](https://github.com/jendrikseipp/vulture)** (MIT) finds dead code (unused functions, classes,
  attributes) in the Python pipeline. Config: `[tool.vulture]` in [`pyproject.toml`](../pyproject.toml).
  Run: `vulture`

### Linting and types

- **[ruff](https://github.com/astral-sh/ruff)** (MIT): Python linter, formatter and import sorter; flags
  unused imports and variables. Config: `[tool.ruff]` in [`pyproject.toml`](../pyproject.toml).
  Run: `ruff check scripts tests webapp/scripts` and `ruff format`
- **[ESLint](https://eslint.org)** with `@eslint/js`, **[typescript-eslint](https://typescript-eslint.io)**,
  `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh` and `globals` (all MIT): webapp linting.
  Config: [`webapp/eslint.config.js`](../webapp/eslint.config.js). Run: `cd webapp && npm run lint`
- **[TypeScript](https://www.typescriptlang.org)** 6.0 (Apache-2.0): `noUnusedLocals` and
  `noUnusedParameters` reject unused code at build time. Run: `cd webapp && npx tsc -b`

### Build, test and deploy

| Tool | Used for | License |
|---|---|---|
| [Vite](https://vite.dev) 8 and `@vitejs/plugin-react` | Bundling the site, the admin app and the apps' front end | MIT |
| [Vitest](https://vitest.dev) 5 | Tests (`npm test`) | MIT |
| [Wrangler](https://developers.cloudflare.com/workers/wrangler/) 4 | Local Worker dev, D1 migrations, deploys | MIT OR Apache-2.0 |
| [`@tauri-apps/cli`](https://tauri.app) 2 | Building the desktop and Android apps | Apache-2.0 OR MIT |
| `@types/node`, `@types/react`, `@types/react-dom` | Type definitions | MIT |
| [pytest](https://pytest.org) | Python tests (network blocked) | MIT |
| [Pillow](https://python-pillow.github.io) | [`webapp/scripts/gen_assets.py`](../webapp/scripts/gen_assets.py), which generates the icons and the social preview image | MIT-CMU |

## 6. GitHub Actions

The workflows in [`.github/workflows/`](../.github/workflows/) use `actions/checkout`, `actions/setup-node`,
`actions/setup-python`, `actions/setup-java`, `actions/cache`, `actions/upload-artifact`,
`actions/download-artifact`, `android-actions/setup-android`, `dtolnay/rust-toolchain`,
`tauri-apps/tauri-action` and reusable workflows from [poli0981/.github](https://github.com/poli0981/.github).
Every external action is pinned to a commit SHA. The actions run on GitHub's runners and are not
distributed with the project; each one is under the license in its own repository.

## 7. Services (not software the project distributes)

| Service | What it does for the project |
|---|---|
| **Cloudflare** | DNS, CDN, WAF, TLS; Workers and static assets (the website); R2 (resized cover images); D1 (the review queue); Images (resizing); Turnstile (Suggest page); Web Analytics (cookieless, aggregate); Workers Logs; Access (admin login); Rate Limiting; Email Routing (the project's contact addresses) |
| **GitHub** | Code, catalog data, issues and discussions, Actions (the pipeline), release downloads |
| **itch.io** | Where the games live; the pipeline and RSS discovery read public itch.io pages and feeds |
| **Discord** | Receives automated CI and release notifications only |

What each service receives is described in the [Privacy Policy](PrivacyPolicy.md).

## 8. Keeping this list current

- [`.github/dependabot.yml`](../.github/dependabot.yml) keeps npm, pip, GitHub Actions and Cargo
  dependencies up to date.
- When you add an npm dependency, add it to the `THIRD_PARTY` array in
  [`webapp/src/lib/about.ts`](../webapp/src/lib/about.ts) (so the About page lists it) **and** to this file.
  The house rules are in [CONTRIBUTING.md](../CONTRIBUTING.md).
- Adding a new dev tool? Drop it here too, so the next person (or AI buddy) knows what is keeping an eye on
  the code.
