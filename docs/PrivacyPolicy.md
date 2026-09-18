# Privacy Policy

Last updated: 2026-09-18

Applies from: the release of version 4.0.0.

This Privacy Policy explains what personal data the `free-games-itchio-list` project processes, why, who helps process it, how long it is kept, and what rights you have. It covers the website **https://freeitchgames.win**, the desktop and Android apps, the public catalog data and the repository. The short version: there are no accounts, no ads and no tracking cookies. The Project keeps as little as it can, and most of what exists stays in your own browser.

A Vietnamese translation is available at [`docs/i18n/vi/PrivacyPolicy.md`](i18n/vi/PrivacyPolicy.md). If the two differ, this English version prevails.

> **TL;DR**
>
> - No accounts, no sign-in, no ads, no selling of data, no profiling. The Apps have no telemetry.
> - The Website runs on Cloudflare, which processes standard request data (IP address, browser, URL, time) to deliver and protect the site and to count visits in aggregate, without cookies. The Project's own code never saves your IP address.
> - Your settings (theme, language, 18+ choice, accepted terms) and a cache of the public catalog stay in your browser and are never sent to the Project.
> - If you use the Suggest page, the Maintainer receives the game link, your optional note (deleted after 180 days) and the time. Please don't put personal data in the note.
> - Questions or requests: **privacy@freeitchgames.win**.

## 1. Who is responsible, and what this Policy covers

### 1.1 Controller

The controller of the personal data described in this Policy is **the Maintainer**: poli0981 (SkullMute), an individual in Vietnam who runs the Project as a solo hobby. Contact: **privacy@freeitchgames.win** (see section 12).

### 1.2 Definitions

- **"The Website"**: https://freeitchgames.win, including its pages and endpoints (such as `/data`, `/img`, `/suggest`, `/admin` and `/api/…`). The old address https://poli0981.github.io/free-games-itchio-list/ only redirects to it.
- **"The Apps"**: the desktop apps (Windows, macOS, Linux) and the Android APK, built from the same code as the Website and distributed on GitHub Releases. They are read-only viewers of the Catalog.
- **"The Catalog"**: the list of games and their data: `data_game/`, `scripts/deleted_games.json`, and the files derived from them and served under https://freeitchgames.win/data.
- **"The Repository"**: https://github.com/poli0981/free-games-itchio-list, including the data pipeline that runs in its GitHub Actions.
- **"The Project"**: the Website, the Apps, the Catalog and the Repository together.
- **"The Maintainer"**: poli0981 (SkullMute), as described in section 1.1.
- **"Personal data"**: any information about an identified or identifiable person.
- **"You"**: anyone who uses the Project, including game creators whose games are listed in the Catalog.

### 1.3 What this Policy does not cover

This Policy does not cover services that handle data on their own account: itch.io (every game link and every download goes there), GitHub for your GitHub account and your activity on github.com, Cloudflare's use of data for its own purposes as described in its privacy policy, the games themselves, or the Maintainer's browser extension, which is a separate project with its own documentation. Their own policies apply (links in section 4).

## 2. What is processed and why

### 2.1 Visiting the Website

- **Request data.** The Website is hosted on Cloudflare. When your browser loads a page, a file or an image, Cloudflare processes standard request data: your IP address, user agent (browser and device type), the requested URL, the referrer and the time. This is needed to deliver the site, to protect it (TLS, firewall, bot and denial-of-service protection) and to limit abuse.
- **Aggregate statistics.** The Website uses Cloudflare Web Analytics, which loads a small script from Cloudflare and counts visits in aggregate, without cookies and, according to Cloudflare, without fingerprinting. The Maintainer sees only totals (such as page views), not individual visitors. The Project runs no other analytics.
- **Server logs.** Requests handled by the Website's server code (Cloudflare Workers) are recorded by Cloudflare Workers Logs on a 10% sample and kept for about 7 days, to find bugs and investigate abuse.
- **Network error reports.** Cloudflare may add Network Error Logging (NEL) headers, which ask your browser to report connection errors to Cloudflare.
- **No IP addresses stored by the Project.** The Project's own code never writes your IP address to its database, its files or the Repository.
- **Cover images** are served by the Website itself (resized copies stored on Cloudflare R2), so your browser does not contact itch.io while you browse. itch.io only hears from you when you click a game link and go there; the Website then passes at most its own address (not the page you were on) as the referrer.

### 2.2 Using the Apps

- The Apps are read-only viewers with **no telemetry, no analytics and no accounts**.
- They download the Catalog JSON from https://freeitchgames.win/data (Cloudflare processes the request data as described in section 2.1) and load cover images **directly from itch.io's image server (img.itch.zone)**, so itch.io receives your IP address and user agent when covers load.
- Clicking a game opens its itch.io page in your browser.
- Updates are manual: the Apps do not check for updates on their own. When you download an installer or the APK from GitHub Releases, GitHub processes that request.
- The Apps keep the same local storage as the Website (section 3.1), on your device only. Uninstalling an App removes it.

### 2.3 Suggesting a game

When you use the Suggest page (https://freeitchgames.win/suggest):

- **What is stored**: the game URL, your optional note (up to 500 characters) and the time of submission, in the review queue (section 2.4). No name, email address or account is asked for or stored.
- **Anti-spam**: Cloudflare Turnstile processes signals about your device and browser to tell people from bots. To check the result, the Website sends the Turnstile token and your IP address to Cloudflare's verification service.
- **Rate limiting**: your IP address is used transiently to count requests. The Project does not store it.
- **Purpose**: to review your suggestion. If it is approved, the game URL becomes part of the public Catalog. Your note is never published and is **deleted automatically after 180 days**.
- **Please don't put personal data in the note**, yours or anyone else's. The form is for game links only.

### 2.4 The review queue and the admin area

- **How games arrive**: suggestions from the Suggest page; submissions from the Maintainer's browser extension through an authenticated API (the game URL, an optional title and note, and the extension's service-token ID; the records that prevent duplicate submissions are kept for 7 days); and automatic discovery from itch.io's public RSS feeds.
- **The review queue** (Cloudflare D1) holds candidate game URLs with their source, the title, cover-image URL and genre hint taken from itch.io, automatic flags, notes, timestamps and the Maintainer's decision. Nothing enters the Catalog until the Maintainer approves it. Rejected URLs are kept indefinitely as a blocklist; only the URL is needed to avoid reviewing the same game again.
- **The admin area** (https://freeitchgames.win/admin) is for the Maintainer only. It is protected by Cloudflare Access (GitHub login or a one-time PIN sent by email), which sets a `CF_Authorization` session cookie in the Maintainer's browser. Admin actions are recorded in an audit log together with the Maintainer's email address. The audit log is never published.

### 2.5 Public game data in the Catalog

- The Catalog is built from public itch.io game pages: the game's name, developer and publisher names, description, genre, tags, platforms, ratings and similar metadata, and the cover image URL. The pipeline identifies itself as `FreeItchGamesBot/4.0 (+https://freeitchgames.win/about)` and paces its requests.
- A developer or publisher name, or the creator's itch.io address inside a game URL, can be a person's name or handle, so it can be personal data. It is used only to identify and credit the game and to help people discover it.
- This data is published on the Website, in the Repository and under https://freeitchgames.win/data. When a game is removed, its URL, name, reason and removal date are logged in [`scripts/deleted_games.json`](../scripts/deleted_games.json), which the Website shows on its Removed page (https://freeitchgames.win/removed).
- Creators can ask for a correction or a removal at any time (section 7).

### 2.6 Contacting the Maintainer

- Emails sent to the Project's addresses (section 12) are forwarded by Cloudflare Email Routing to the Maintainer's mailbox. The Maintainer receives your email address, any name you use and your message, and uses them only to handle your request.
- Correspondence about removal and copyright requests is kept as long as needed to handle the request.

### 2.7 GitHub contributions

Issues, pull requests, discussions and comments are public on GitHub under your GitHub account, and GitHub's privacy statement applies to them. The Maintainer sees only what GitHub shows. The "Remove a game" issue form is public too, so use email for anything you don't want published.

### 2.8 What the Project does not do

- No accounts or sign-in for the public, no comments, no ads and no payments.
- No cookies set by the Project's own code on the public Website.
- No selling or sharing of personal data, for advertising or any other purpose.
- No profiling and no automated decisions with legal or similarly significant effects on you.
- No telemetry in the Apps, and no analytics other than Cloudflare Web Analytics on the Website.

## 3. Browser storage and cookies

### 3.1 What the Website and the Apps store on your device

The Website and the Apps keep the following items on your device only. None of them is sent to the Project.

| Storage | Key | Contents | Kept until |
|---|---|---|---|
| `localStorage` | `webapp.prefs` | Interface preferences such as language and layout density, your 18+ (NSFW) content choice, and the version of the legal documents you accepted | You clear it |
| `localStorage` | `webapp.theme` | Theme: `light`, `dark` or `system` | You clear it |
| IndexedDB (via `idb-keyval`) | `webapp.query-cache` | A cache of the public Catalog JSON, for fast loading and limited offline use | At most 7 days, then refreshed or discarded |
| `sessionStorage` | `reloaded-after-deploy` | A timestamp, so the page reloads at most once after a site update | The tab is closed |

On first load, the Website and the Apps also delete the entries that the old v3 app left in browser storage (an encrypted GitHub access token and commit-signing key data). v4 does not use them.

These items are strictly necessary for features you use (keeping your settings, loading the site quickly, recovering after an update), so they don't need consent under the EU ePrivacy rules or the UK PECR. You can delete them at any time with your browser's "Clear site data" option for `freeitchgames.win`, or inspect them in your browser's developer tools. In the Apps, uninstalling removes them; if a desktop uninstaller leaves the App's data folder (`com.poli0981.freegamesitchio`) behind, you can delete that folder yourself. On Android you can also clear the app's storage in the system settings.

### 3.2 Cookies

- The Project's own code sets **no cookies** on the public Website.
- Cloudflare may set strictly necessary security cookies, such as `__cf_bm` or `cf_clearance`, when its bot or challenge protections run. They serve security only.
- The Suggest page uses Cloudflare Turnstile (section 2.3); see Cloudflare's Turnstile privacy addendum (section 4).
- The admin area uses the Cloudflare Access session cookie `CF_Authorization`, which exists only in the Maintainer's browser.

## 4. Service providers and other parties

| Party | Role and what it does | Data involved | Privacy policy |
|---|---|---|---|
| **Cloudflare** | Processor for the Website: DNS, CDN, firewall and TLS; Workers (the site's server code) and static assets; R2 (resized cover images); D1 (the review queue); Images (resizing); Turnstile (Suggest page only); Web Analytics; Workers Logs; Access (admin login only); Rate Limiting; Email Routing (forwards the Project's contact addresses) | Request data, Suggest submissions, the review queue, forwarded emails | <https://www.cloudflare.com/privacypolicy/> · Turnstile: <https://www.cloudflare.com/turnstile-privacy-policy/> |
| **GitHub** | Hosts the code, the Catalog data, issues and discussions, the data pipeline (GitHub Actions) and the release downloads. Independent controller for your GitHub account and activity | Your public contributions; request data when you visit GitHub or download a release | <https://docs.github.com/en/site-policy/privacy-policies/github-privacy-statement> |
| **itch.io** | Independent platform, not affiliated with the Project. Source of the game data; every game link and download goes there; the Apps load covers from img.itch.zone | What your browser or the Apps send when you visit itch.io or load covers from it. The pipeline sends nothing about you | <https://itch.io/docs/legal/privacy-policy> |
| **Discord** | Receives automated build and release notifications from GitHub Actions | No visitor data | — |

Cloudflare may process data anywhere on its global network (see section 9). The Maintainer does not give personal data to anyone else, except where the law requires it.

## 5. How long data is kept

| Data | Kept for |
|---|---|
| Request data processed by Cloudflare for delivery and security | By Cloudflare under its privacy policy; the Project does not store it |
| Workers Logs (a 10% sample of requests handled by the Website's server code) | About 7 days |
| Web Analytics | Aggregate statistics only; the Maintainer cannot see individual visitors |
| IP address used for rate limiting and Turnstile | Used transiently; never stored by the Project |
| Suggest note | Deleted automatically after **180 days** |
| Suggested or discovered game URLs, with source and timestamps | In the review queue while needed to avoid reviewing the same game twice. Approved URLs become part of the public Catalog; rejected URLs are kept indefinitely as a blocklist |
| Duplicate-submission records from the browser extension | **7 days** |
| Admin audit log (with the Maintainer's email address) | Kept as the record of admin changes; never published |
| Catalog entries (including developer and publisher names) | While the game is listed. Removal records stay in the public removed-games list, and the Repository's Git history keeps past versions (see section 7.3) |
| Emails, including removal and copyright requests | As long as needed to handle the request |
| GitHub contributions | On GitHub, until you or GitHub remove them |
| Browser storage | See section 3.1 |
| `CF_Authorization` cookie (Maintainer only) | For the duration of the Cloudflare Access session |

## 6. Legal bases

### 6.1 Vietnam

The Maintainer processes personal data in accordance with Vietnam's **Law on Personal Data Protection No. 91/2025/QH15** (passed on 26 June 2025, in force since 1 January 2026) and its implementing regulations. The Project processes as little personal data as it can, and only for the purposes in section 2.

Where that Law requires your consent, you give it by a clear action: by accepting this Policy at the legal gate on your first visit and, for what you type yourself, by submitting the Suggest form or sending an email. You can withdraw your consent at any time (section 7). Withdrawal does not affect processing carried out before it.

### 6.2 EU/EEA and UK

If you are in the EU/EEA or the UK, the GDPR or the UK GDPR applies to the processing of your personal data, on these legal bases:

| Processing | Legal basis |
|---|---|
| Delivering and securing the Website and the data the Apps download (request data, server logs, rate limiting, Turnstile, security cookies) | Legitimate interests (Art. 6(1)(f)): running a working, secure service and preventing abuse |
| Aggregate visit statistics | Legitimate interests: understanding how the site is used overall, without tracking individuals |
| Suggestions and the review queue | Legitimate interests: handling the suggestion you chose to send and curating the Catalog |
| Public game data about creators | Legitimate interests: helping people discover free games using information the creators published on itch.io. You can object at any time (section 7) |
| Emails and removal requests | Legitimate interests: answering you and handling your request |
| Browser storage (section 3.1) | Strictly necessary for features you use; no consent is needed under the ePrivacy rules or the PECR |

## 7. Your rights and how to use them

### 7.1 Your rights

Depending on the law that applies to you, including Law No. 91/2025/QH15 and, in the EU/EEA and the UK, the GDPR or the UK GDPR, you have the right to:

- be informed about how your personal data is processed (this Policy);
- access the personal data the Project holds about you;
- correct it if it is inaccurate;
- have it deleted;
- object to its processing, including processing based on legitimate interests;
- withdraw your consent where processing relies on it;
- complain to a supervisory authority: the competent personal data protection authority in Vietnam, or the data protection authority of your EU/EEA country or of the UK.

Under the GDPR and the UK GDPR, you can also ask for processing to be restricted, or for a copy of your data in a portable format, where those rights apply.

### 7.2 How to make a request

- Email **privacy@freeitchgames.win**. Say what you want, and give enough detail to find the data: for example, the game URL you suggested and roughly when, or the email address you wrote from. The Maintainer may ask a follow-up question to confirm that the request is yours.
- The target is to answer within **30 days**; many requests are handled much sooner. Requests are free of charge.
- Game creators who want a game removed or its data corrected can also email **takedown@freeitchgames.win** or open a ["Remove a game" issue](https://github.com/poli0981/free-games-itchio-list/issues/new?template=remove_game.yml) (public). The target for removals is within 7 days. The removal process is described in the [Terms of Use](ToS.md).

### 7.3 Limits worth knowing

- The Project stores no IP addresses and has no accounts, so it cannot link visits to the Website to you. Cloudflare's security and log data is kept only briefly (section 5).
- Browser storage is under your control: you can view and delete it yourself (section 3.1).
- The Git history of the public Repository keeps past versions of the Catalog. The Maintainer cannot rewrite public history, except where there is an exceptional legal necessity. Copies that others have already made (forks, downloaded data) are outside the Maintainer's control.
- Content on GitHub (issues, comments) is managed through GitHub; you can edit or delete your own comments there.

## 8. Children

- The Project is not directed at children under 16. The legal gate asks every visitor to confirm that they are at least 16.
- Adult (18+) content is hidden by default, cover images included. It appears only if a visitor opts in under Settings after confirming that they are 18 or older. That choice is stored only in their browser (`webapp.prefs`). The `nsfw` flag is a best-effort label (see the [Disclaimer](DISCLAIMER.md)).
- The Maintainer does not knowingly collect personal data from children under 16. If you believe a child has sent personal data (for example in a Suggest note or an email), a parent or guardian can write to **privacy@freeitchgames.win** and it will be deleted.

## 9. International transfers

- The Maintainer is in Vietnam. Emails you send and the data in the review queue are handled by the Maintainer from Vietnam.
- Cloudflare processes data on its global network, and GitHub operates internationally, so your data may be processed outside your country, including in countries whose data protection laws differ from yours. These providers describe the safeguards they use for international transfers in their privacy policies and data processing terms (links in section 4).

## 10. Security

- The Website is served only over HTTPS.
- Data minimization: no accounts, no IP addresses stored by the Project's code, Suggest notes deleted after 180 days, duplicate-submission records after 7 days.
- The admin area and the ingest API are protected by Cloudflare Access, and the Website's server code verifies the Access token itself on every protected request.
- Secrets (such as the GitHub App's private key) are kept in Cloudflare's secret storage, never in the Repository. The admin area writes to the Repository as a GitHub App, with verified commits.
- A strict Content Security Policy limits scripts to the Website itself plus Cloudflare Web Analytics and Turnstile.
- GitHub Actions are pinned to exact commit SHAs with least-privilege permissions, and Dependabot keeps dependencies up to date.
- No system is perfectly secure. If you find a vulnerability, please report it privately as described in the [Security Policy](../SECURITY.md) or at **security@freeitchgames.win**. If a personal data breach occurs, the Maintainer will notify the people affected and the authorities as the law requires.

## 11. Changes to this Policy

- The Maintainer may update this Policy. New versions are published in the Repository with the `Last updated` date at the top, and material changes are noted in [CHANGELOG.md](../CHANGELOG.md). Earlier versions remain in the Repository's history.
- When a change requires your acceptance again, the legal gate on the Website and in the Apps asks you to review and accept the updated documents before you continue.

## 12. Contact

All four addresses are forwarded to the Maintainer by Cloudflare Email Routing.

- **privacy@freeitchgames.win**: privacy questions and requests about your data (target answer: within 30 days).
- **takedown@freeitchgames.win**: removing a game or correcting its data, including copyright claims.
- **security@freeitchgames.win**: vulnerabilities (or GitHub's private vulnerability reporting; see the [Security Policy](../SECURITY.md)).
- **legal@freeitchgames.win**: anything else legal.

For questions that aren't private, you can also open an issue in the Repository; issues are public.

## 13. Final vibes

A list of free games shouldn't need your data, so the Project barely touches it: no accounts, no ads, no tracking cookies, nothing sold. What little exists is kept short and deleted when it's no longer needed. Browse freely.
