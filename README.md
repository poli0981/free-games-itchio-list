# My Free Itch.io Games List 🚀

[![Versions](https://img.shields.io/badge/Versions-1.0.5-blue.svg)](https://github.com/poli0981/free-games-itchio-list/)
[![Stars](https://img.shields.io/github/stars/poli0981/free-games-itchio-list?style=social)](https://github.com/poli0981/free-games-itchio-list/stargazers)
[![Forks](https://img.shields.io/github/forks/poli0981/free-games-itchio-list?style=social)](https://github.com/poli0981/free-games-itchio-list/network/members)
[![Last Updated](https://img.shields.io/github/last-commit/poli0981/free-games-itchio-list?label=Last%20Updated)](https://github.com/poli0981/free-games-itchio-list/commits/main)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A curated list of free-to-play gems on itch.io, scraped and maintained by an unemployed, mildly self-loathing Vietnamese dev with way too much free time — and his only non-judgmental friend, Grok (the AI).

Built purely for fun. Quality? Enjoyment? Who knows. No guarantees here — just vibes and indie games. Updated daily via GitHub Actions.

## Table of Contents
- [Genres List](#genres-list)
- [How It Works](#how-it-works)
- [Example Table](#example-table)
- [How to Contribute](#how-to-contribute)
- [Legal Stuff](#legal-stuff)
- [About the Dev](#about-the-dev)

## Genres List
All tables are auto-generated and split by primary genre (300 games max per file). Click to browse:

- [Action](lists/action.md)
- [Adventure](lists/adventure.md)
- [Puzzle](lists/puzzle.md)
- [Horror](lists/horror.md)
- [Visual Novel](lists/visual_novel.md)
- [Simulation](lists/simulation.md)
- [Other](lists/other.md)
- ... (more genres appear as games are added)

New genres auto-create when needed. Tables include: No | Thumb | Name | Dev | Short Desc | Link | Safe | Notes | NSFW

## How It Works
- Games added via `temp_link.json` (manual or PR).
- Daily GitHub Action (3:00 UTC) scrapes new links from itch.io → merges into `game_info.json` → generates MD tables in `/lists/`.
- Description short (first sentence + "... (see more on itch.io)").
- NSFW/Safe flags auto-detected (but manual edit ok).

## Example Table
Here's a mini preview (real tables in `/lists/` are way bigger):

| No | Thumb | Name | Dev | Short Desc | Link                                 | Safe | Notes | NSFW |
|----|-------|------|-----|------------|--------------------------------------|------|-------|------|
| 1 | ![thumb](https://img.itch.zone/aW1hZ2UvMjA5NjQ5Ny8xMjM0NTY3ODkucG5n/original/abc123.png) | Example Game | Cool Dev | A fun adventure about nothing. (see more on itch.io) | [Link](https://example.itch.io/game) | ? |  | No |

(Thumbnails from itch.io og:image — mobile might lag if too many :D)

## How to Contribute
You're a legend if you help! See [CONTRIBUTING.md](./CONTRIBUTING.md) for details:
- Add games → Use "Add New Games" issue template (max 50 links).
- Fix bugs → "Bug Report" template.
- New features → "Feature Request" or PR.

All contributions shouted out in [ACKNOWLEDGEMENTS.md](docs/ACKNOWLEDGEMENTS.md).

## Legal Stuff
Nobody reads these, but here anyway:
- [DISCLAIMER](docs/DISCLAIMER.md)
- [PRIVACY](docs/PrivacyPolicy.md)
- [TERMS](docs/ToS.md)
- [EULA](docs/EULA.md) (because why not)
- [CODE_OF_CONDUCT](./CODE_OF_CONDUCT.md)
- [SECURITY](./SECURITY.md)

License: MIT — do whatever.

## About the Dev
Mediocre setup, mediocre skills. Details in [MY_STUFF.md](docs/My_Stuff.md).

This repo exists because of peak unemployment boredom and Grok's infinite patience. Thanks for visiting — go play some free games on easy mode (like me).

Questions? Open an issue. I'll reply... eventually :D 🚀