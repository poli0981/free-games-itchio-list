# Accessibility

Last updated: 2026-11-09

Applies from: the release of version 4.6.0 (the website and the desktop and Android apps).

This is a hobby project run by one person, poli0981 (SkullMute), called "the Maintainer" below: a catalog of free itch.io games, on the website https://freeitchgames.win and in desktop and Android apps that show the same pages. Everyone should be able to use it, whether with a keyboard alone, a screen reader, zoom, a high-contrast theme, speech input or anything else. This statement says what works, how it is checked, what doesn't work yet, and how to tell the Maintainer when something gets in your way.

A Vietnamese translation is available at [`docs/i18n/vi/ACCESSIBILITY.md`](docs/i18n/vi/ACCESSIBILITY.md). If the two differ, this English version prevails.

> **TL;DR**
>
> - The goal is [WCAG 2.2](https://www.w3.org/TR/WCAG22/) Level AA for the website and the apps. That is a target, not a certificate: nobody outside the project has audited it.
> - Every page works with the keyboard alone and with a screen reader. The Maintainer tests with the keyboard only, Windows Narrator, and VoiceOver on an iPhone.
> - Colours meet the WCAG contrast ratios in the light and dark themes, and a test checks them on every change. Windows contrast themes are supported, and the site follows your system's "reduce motion" setting.
> - Every chart comes with a data table.
> - Known gaps are listed in [§6](#6-known-limitations).
> - Something in your way? Open an [accessibility issue](https://github.com/poli0981/free-games-itchio-list/issues/new?template=accessibility.yml) or email **contact@poli0981.dev**.

## 1. Scope

This statement covers:

- **the website** https://freeitchgames.win: every public page (Home, Games, the game pages, Charts, Removed, Suggest, Settings, About, the error pages) and the verification page shown before them;
- **the desktop apps** (Windows, macOS, Linux) **and the Android app**, which show the same pages in the system's web view.

It doesn't cover:

- the games themselves, their itch.io pages, and what their creators wrote or made (titles, descriptions, tags, cover images);
- Cloudflare Turnstile, the third-party check on the verification page and on the Suggest form (Cloudflare is responsible for its accessibility);
- the Maintainer's admin page, which has one user;
- other sites the pages link to, GitHub included.

## 2. Goals and priorities

- **Target**: [WCAG 2.2](https://www.w3.org/TR/WCAG22/) Level AA, as far as a one-person hobby project can get.
- **First**: the main tasks with a keyboard and a screen reader: find a game, read its details, open it on itch.io, change your settings, suggest a game.
- **Then**: readable text and controls (contrast, zoom, reflow), no motion you didn't ask for, and the right language for screen readers (English or Vietnamese).
- **Always**: new features keep all of this working (see [§8](#8-for-contributors)).

## 3. What works today

### Moving around

- "Skip to content" is the first thing the Tab key reaches.
- Each page has named landmarks (header, main navigation, search, main content, pager, footer), one level-1 heading, and its own title.
- After you follow a link inside the site, focus moves to the new page's heading, so a screen reader announces the page and Tab continues from there. Going back returns focus to the link you used, for example the game you opened from the list.
- The sticky header never covers what has keyboard focus.

### Keyboard

- Everything works with the keyboard alone: menus, filters, dialogs and charts.
- Focus is always visible: a purple outline, or the system highlight in a contrast theme.
- Dialogs keep focus inside while they are open and return it to where you were when they close.
- "/" jumps to the search box. You can switch this shortcut off in **Settings → Accessibility**, which helps with speech input or if the key clashes with your screen reader or your browser's quick find.
- When a control disappears after you use it (clearing a search, removing a filter), focus moves to the next sensible place instead of getting lost.

### Screen readers

- Every control has a name, in English or Vietnamese. Icons are hidden from screen readers.
- The number of results, search suggestions, loading states and form messages are announced.
- On wide screens the game list is a table with column headers; on phones it is a simple list.
- Links that open a new tab (in the apps: your browser) say so.
- Text in the other language, such as the language names and the English-only names of the legal documents, is marked with its language.

### Seeing the content

- Text and controls meet the WCAG 2.2 AA contrast ratios in both themes: 4.5:1 for text, 3:1 for field borders, the focus outline and chart colours. The test [`webapp/scripts/check-contrast.test.mjs`](webapp/scripts/check-contrast.test.mjs) checks the colours on every change.
- Light, dark or system theme, compact or normal rows, and hidden scrollbars: all in Settings.
- Windows contrast themes (forced colours): the selected tab, pressed toggles, the current page and switches use the system's highlight colours.
- Zoom is never blocked. At 400 % zoom or in a 320-pixel-wide window the phone layout takes over, and the page doesn't scroll sideways.
- Links inside sentences are underlined. Nothing is shown by colour alone: states also change the text, an outline or an underline.

### Motion

- With "reduce motion" switched on in your system, animations, chart entrances and smooth scrolling are off.
- On the website, covers are normally shown as still images (animated covers are turned into stills).
- Apart from loading placeholders, nothing moves on its own.

### Charts

- Each chart is named after its heading. Focus it and use the left and right arrow keys: the value you move to is read out.
- Under every chart, **Data table** opens the same numbers as a table, with each part's share for the pie charts.

### Language

- The pages are in English or Vietnamese (Settings), and the page language follows your choice, so screen readers pick the right voice. Numbers and dates follow it too.

## 4. How it is tested

- **By the Maintainer, by hand** (November 2026): the website on Windows 11 and the Windows desktop app, with the keyboard only (mouse switched off) and Windows Narrator. No blocking problems were found.
- **On a real phone** (November 2026, version 4.6.0): the website on an iPhone 14 Pro with VoiceOver, in Safari, Chrome and Brave. It passed.
- **For 4.6.0**: the main pages and dialogs were walked through with the keyboard, and their accessibility tree was checked (names, roles, headings, landmarks, announcements) in English and Vietnamese, on a desktop and a phone-sized screen.
- **Automatically, on every change**: the contrast test above and the app's unit tests (where focus goes after a page change, the chart tables).
- **Before each release**: a short smoke test. That means a keyboard pass through the main tasks, a screen reader spot check, 200 % zoom and a narrow window, reduced motion, and a Windows contrast theme.
- **Not yet**: automated browser scans (such as axe or Lighthouse) in CI, and testing by people who use a wide range of assistive technology every day. Help is welcome.

## 5. Supported environments

| | Versions |
|---|---|
| Website | Current Chrome, Edge, Firefox and Safari on computers and phones. The oldest versions the site is built for are Chrome and Edge 111, Firefox 114, and Safari and iOS 15.4. |
| Desktop apps | Windows 10 and 11 (Microsoft Edge WebView2), macOS (WebKit 16.4 or newer), Linux (WebKitGTK 4.1) |
| Android app | Android 11 or newer |

Assistive technology:

- **Tested**: Windows Narrator on Windows 11, VoiceOver on iOS (iPhone 14 Pro: Safari, Chrome and Brave), and keyboard-only use.
- **Expected to work, not regularly tested**: NVDA and JAWS on Windows, VoiceOver on macOS, TalkBack on Android, browser zoom, Windows contrast themes, speech input. They rely on the same standard markup.
- **Limited**: Orca in the Linux desktop app, because WebKitGTK supports screen readers less well than the browsers do.

## 6. Known limitations

- **Creators' text isn't marked with its language.** Game titles, descriptions and tags come from itch.io in many languages, and a screen reader reads them in the page's language.
- **Cover images have a generic description** ("Game name cover"). What the image shows isn't described.
- **Charts**: the arrow keys only move left and right. The genre treemap can't be stepped through, but its numbers are in its data table and in the Genres chart. Chart text has a fixed pixel size, so a larger default font size in your browser doesn't change it (page zoom does).
- **Desktop apps**: there are no zoom keys inside the app, the window can't be maximized, and it can't be made smaller than 900 × 600. If you need larger text, use your system's display scaling or the website in a browser.
- **Android app**: pinch-to-zoom is off. The website can be zoomed in your phone's browser.
- **Animated covers in the apps**: the apps load covers straight from itch.io, so an animated cover keeps playing there.
- **Cloudflare's checks**: the verification check (website only) and the anti-spam check on the Suggest form are Cloudflare Turnstile widgets. They usually pass without anything to do. If one ever asks for something you can't do, email the Maintainer.
- **GitHub pages**: the policies, this statement and the issue forms live on GitHub, so GitHub's own accessibility applies there.
- **No external audit**, and one maintainer.

## 7. Reporting an accessibility barrier

If something stops you or slows you down, please say so. Partial reports help too.

- **GitHub**: open an [Accessibility barrier issue](https://github.com/poli0981/free-games-itchio-list/issues/new?template=accessibility.yml).
- **Email**: **contact@poli0981.dev**. No GitHub account needed; English or Vietnamese both work.

Details that help, as far as you're comfortable sharing them (never send health information):

- what you were trying to do, and what happened instead;
- the page (its address) or the app and its version, shown on the About page;
- your device, operating system and browser;
- the assistive technology you use and its version, if any;
- a screenshot or a recording, if you can.

How much it gets in your way:

| Severity | Meaning |
|---|---|
| Critical | You can't do a main task at all, for example open a game or read its details. |
| Serious | You can, but only with great effort or a workaround. |
| Moderate | It's annoying or inconsistent, but you get there. |
| Minor | A small polish issue. |

What happens next. These are targets, not guarantees, since this is a solo hobby project:

- **Acknowledgement** within 7 days, often sooner.
- **A fix or a workaround**: Critical within 30 days, Serious within 60 days, Moderate and Minor in a later release.
- **Website fixes** go live when they are deployed; **app fixes** come with the next release.
- You'll be asked whether the fix works for you, and credited in the release notes if you want.

Security vulnerabilities don't belong in a public issue: see [SECURITY.md](SECURITY.md).

## 8. For contributors

Changes to the interface must keep [§3](#3-what-works-today) true:

- **Keyboard**: every control can be reached and used, focus stays visible and never gets lost.
- **Names**: every control has a label, with its text in both `webapp/src/lib/i18n/en.ts` and `vi.ts`.
- **Colour**: use the theme tokens. `npm test` checks contrast (4.5:1 for text, 3:1 for borders, focus and chart colours), and colour is never the only signal.
- **Motion**: respect `prefers-reduced-motion`; the shared CSS rule and `SERIES_ANIMATION` already do.
- **Screen reader**: check the change once with one (Narrator, NVDA, VoiceOver or TalkBack).
- **Markup**: prefer native elements and the Radix / shadcn components already in use, and add ARIA only when it's needed.

Documentation: headings in order, link text that says where it goes, alt text for images, header cells in tables, and the Vietnamese translation updated (or say in the pull request that it isn't).

The [pull request template](.github/pull_request_template.md) has the checklist.

## 9. Finding accessible games

The catalog shows the accessibility features that creators list on their itch.io pages, such as subtitles, configurable controls or colour-blind modes:

- on each game's page, under "Accessibility";
- as the Accessibility filter on the Games page, for example https://freeitchgames.win/games?access=Subtitles;
- in the "Accessibility Features" chart (Charts → Discovery).

Creators declare these features themselves, and the project doesn't verify them. If a game's information is wrong, report it with the "Bug Report" issue template.

## 10. References

- [Open Source Guides: Accessibility best practices for your project](https://opensource.guide/accessibility-best-practices-for-your-project/)
- [Open Source Accessibility toolkit](https://github.com/open-source-accessibility/accessibility-toolkit): this statement follows the outline of its ACCESSIBILITY.md example, in its own words.
- [Web Content Accessibility Guidelines (WCAG) 2.2](https://www.w3.org/TR/WCAG22/)
- [W3C: Developing an accessibility statement](https://www.w3.org/WAI/planning/statements/)

## 11. Contact

- **Accessibility barriers**: the [issue form](https://github.com/poli0981/free-games-itchio-list/issues/new?template=accessibility.yml) or **contact@poli0981.dev**.
- **Everything else**: see the addresses in [README → Legal](README.md#legal).

## 12. Final vibes

One person, one catalog, every way of browsing it. If something here doesn't work the way you use the web, the Maintainer would really like to hear it — that's how this list gets better. 🚀
