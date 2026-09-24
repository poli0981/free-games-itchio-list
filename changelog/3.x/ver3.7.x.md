# Changelog — 3.7.x

Release notes for 3.7.0 – 3.7.1, newest first. Every version: [CHANGELOG.md](../../CHANGELOG.md).

## [3.7.1] - 2026-06-14 (Hotfix — desktop build vs invalid Tauri NSIS license key)

### Fixed

- **v3.7.0's desktop installers never built.** The NSIS EULA was wired via
  `bundle.windows.nsis.license`, but `@tauri-apps/cli` 2.11.0's `NsisConfig`
  has no `license` key (it was added in a later release), so every platform
  failed config validation at the `Build Tauri app` step. Switched to the
  top-level `bundle.licenseFile` (valid in 2.11.0) pointing at an **RTF** EULA
  ([`webapp/src-tauri/installer/EULA.rtf`](../../webapp/src-tauri/installer/EULA.rtf)).
  RTF satisfies **both** Windows bundlers — WiX (`.msi`) requires RTF and NSIS
  (`.exe`) auto-detects it — so both installers show the "I Agree" page. The
  previous plain-text `EULA.txt` would also have broken the WiX/`.msi` build.

### Notes

- Web feature set is identical to v3.7.0 (which deployed fine); this tag exists
  to produce the desktop installers. `about.ts` version bump also busts the
  IndexedDB catalog cache, which is harmless. No Tauri version bump
  (`tauri.conf.json` stays `0.1.1`).

---

## [3.7.0] - 2026-06-14 (Legal-acceptance gates + per-tab chart lazy-loading)

### Added

- **First-launch legal-acceptance gate** — on first visit (and in every fresh
  incognito session, since `localStorage` starts empty there) the app shows a
  full-screen, non-dismissible gate before the main UI. It links the License,
  EULA, Privacy Policy, Disclaimer, Terms of Use, Code of Conduct, and Security
  Policy (reusing `LEGAL_LINKS`), and requires ticking a checkbox to continue.
  New component [`webapp/src/components/legal-gate.tsx`](../../webapp/src/components/legal-gate.tsx),
  built on raw Radix Dialog primitives (focus-trapped, no close-X, Esc /
  outside-click disabled). Acceptance persists as `acceptedLegalVersion` in the
  existing `webapp.prefs` localStorage blob — **no cookie** (consistent with the
  "no cookies" privacy stance). A `LEGAL_VERSION` constant
  ([`webapp/src/stores/prefs.ts`](../../webapp/src/stores/prefs.ts)) lets a future
  policy edit re-prompt every user with a one-line bump.
- **Windows installer EULA page** — both Windows installers (the NSIS `.exe`
  and the WiX `.msi`) now show an "I Agree" license step before installing,
  wired via the top-level `bundle.licenseFile` →
  [`webapp/src-tauri/installer/EULA.rtf`](../../webapp/src-tauri/installer/EULA.rtf).
  RTF is used so both bundlers render it (WiX requires RTF; NSIS auto-detects
  it). The in-app gate above covers first-run consent on macOS / Linux, whose
  installers have no equivalent step.

### Changed

- **Charts route split into four lazy per-tab chunks**
  ([`webapp/src/components/charts/tabs/`](../../webapp/src/components/charts/tabs)).
  Each tab imports its chart components directly (the `charts/index.ts` barrel
  was removed so the bundler keeps each tab's components in its own chunk).
  Result: only the default **Overview** tab's components load when `/charts`
  opens; the Reach / Quality / Discovery component code downloads on first
  click. Recharts itself (the ~380 KB `vendor-charts` chunk) still loads with
  Overview — unavoidable since the default tab renders charts — but it was
  already deferred to the lazy `/charts` route, so it never touches app startup.
- `about.ts` version → 3.7.0 (also busts the IndexedDB catalog cache, harmless);
  Claude Code co-author credit updated to Opus 4.8.

### Notes

- Images, routes, and OpenPGP were already lazy-loaded; this release closes the
  remaining gap (charts). No Tauri version bump (`tauri.conf.json` stays
  `0.1.1`) — the NSIS license is a bundler-config addition, not a binary change.
