# Changelog — 4.6.x

Release notes for 4.6.0, newest first. Every version: [CHANGELOG.md](../../CHANGELOG.md).

## [4.6.0] - 2026-11-09 (Accessibility)

The website and the apps work better with a keyboard, a screen reader, Windows contrast themes and
reduced motion, and the project now has an accessibility statement,
[ACCESSIBILITY.md](../../ACCESSIBILITY.md) (in Vietnamese:
[docs/i18n/vi/ACCESSIBILITY.md](../../docs/i18n/vi/ACCESSIBILITY.md)). It says what works, what
doesn't yet, and how to report a barrier. The Maintainer had already tested the website and the
Windows app with the keyboard only and Windows Narrator; this release fixes the gaps a review against
WCAG 2.2 AA found.

### Upgrade notes

- **Nothing to accept again**: no policy changed. The accessibility statement isn't a policy you
  accept, so the first-visit notice doesn't come back.
- **A new setting**: **Settings → Accessibility** turns off the "/" shortcut that jumps to the search
  box (useful with speech input, or when the key clashes with a screen reader or your browser's quick
  find).
- **Colours**: buttons and purple text are a shade darker, form fields have darker borders, and the
  selected tab, the current page and the highlighted search suggestion are marked with an outline, an
  underline or a bar. This brings the contrast up to WCAG 2.2 AA. The logo and the app icons are
  unchanged.
- **Desktop and Android apps**: install 4.6.0 over 4.5.0 as usual.

### Added

- **Accessibility statement** ([ACCESSIBILITY.md](../../ACCESSIBILITY.md), EN + VI): the WCAG 2.2
  AA target, what works, how it is tested, supported browsers and assistive technology, known
  limitations, and how to report a barrier, with severity levels and response targets. It is
  linked from the About page, the footer, Settings and the README.
- **Reporting a barrier**: an "Accessibility barrier" issue form (label `accessibility`), or email
  contact@poli0981.dev, no GitHub account needed.
- **Charts you can read**: every chart is named after its heading, reads each value aloud as you
  step through it with the left and right arrow keys, and has a **Data table** under it with the
  same numbers (plus each part's share for pie charts).
- **Settings → Accessibility**: the "/" shortcut switch and a link to the statement.
- **A contrast check in CI**: a test fails if a colour token or a chart colour drops below the
  WCAG 2.2 AA ratios.
- **A default pull request template** with an accessibility checklist.

### Changed

- **Focus follows the page**: after you follow a link inside the site, focus moves to the new page's
  heading, so a screen reader announces it and Tab continues from there. Back returns focus to the
  link you used, for example the game you opened from the list. Links to a section (About →
  Support) move focus there too.
- **Contrast**: white text on buttons goes from 4.35 to 5.44:1, purple text from 4.2 to 5.2:1 (6.6:1
  in dark mode), field borders and the off position of switches reach 3:1. Chart colours reach 3:1 on
  the light theme too, treemap labels pick a readable colour per cell, and axis labels are readable
  in dark mode. The Online/Offline chart is blue and orange, which colour-blind readers can tell
  apart.
- **Windows contrast themes**: the selected tab, pressed toggles, the current page, the active
  search suggestion and switches use the system's highlight colours, and chart text follows the
  system text colour.
- **Screen readers hear more**: the number of search suggestions, loading states, rating counts,
  filter counts ("Genre, 2 selected"), the reason and date of each removed game, and that a link
  opens a new tab (in the apps: your browser). Card titles on the About and Charts pages are real
  headings, and the game-not-found page and the 18+ notice have their own page titles.
- **Language**: text in the other language (the language names, the English-only names of the legal
  documents) is marked as such, the page's language switches to Vietnamese only once the Vietnamese
  text has loaded, and the Suggest page's anti-spam check uses the site's language.
- **Search box**: "See all results" can be reached with the arrow keys.
- **Suggest form**: the game link is checked when you leave the field or send the form, not at the
  first keystroke, and the Send button stays reachable and says what is missing.
- **First-visit notice**: "Accept & continue" can be reached with Tab before the box is ticked
  (pressing it moves you to the box), and focus moves to the page once you accept.
- **Links inside sentences are underlined.**

### Fixed

- **The 18+ dialog lost keyboard focus when it closed**; focus now returns to the button or switch
  that opened it.
- **The sticky header could cover the element that had keyboard focus.**
- **Focus was lost** when the control you used disappeared: clearing the search, removing a filter,
  "Clear" in a filter menu, "back to top".
- **Reduced motion**: looping loading animations now stop and "back to top" no longer scrolls
  smoothly when your system asks for less motion.
- **Short screens**: the 18+ dialog, the phone menu and the display menu scroll instead of being cut
  off.
- **Docs**: the catalog data license still listed the @freeitchgames.win addresses retired in 4.1.1;
  the About page's "Content removal" link opened the YAML source of the issue form; some "Last
  updated" dates, translation notes and library versions were behind.

### Dependencies

The two weekly updates since 4.5.0, which have been on the website since they were merged:

- **2026-11-02** (#176, Dependabot #171–#175 and a few more): React Router 8.5.1, TanStack Query
  5.105.0, lucide-react 1.64.0, knip 6.44.0, typescript-eslint 8.72.1, wrangler 4.156.0 (its
  generated Worker types refreshed), jose 6.2.14; the `undici` override dropped (wrangler's own
  version now has the fix); pytest 9.2.0 and Ruff 0.17.3 for the pipeline;
  `sonarqube-scan-action` 8.4.0; the Rust dependencies refreshed.
- **2026-11-09** (#182, Dependabot #177–#181 and a few more): TanStack Query 5.106.1, Vitest 5.1.0,
  Vite 8.3.6, @vitejs/plugin-react 6.2.1, Tailwind CSS 4.3.4, ESLint 10.14.0, knip 6.44.1,
  wrangler 4.158.0 (types refreshed), jose 6.2.15, globals 17.14.0, lucide-react 1.69.0;
  soupsieve 4.0.1, coverage 7.17.2 and Ruff 0.17.4 for the pipeline; `actions/setup-java` 6.2.0 and
  `sonarqube-scan-action` 8.4.1; the Rust dependencies refreshed (wasm-bindgen 0.2.130 and others).
