# Maintainer hardware spec

The single machine that builds, scrapes, and tests this project. Listed for
reproducibility — if a workflow output looks weird, this is what produced it.

## Developer machine (primary)

| Component | Details |
|-----------|---------|
| **OS** | Windows 11 Pro 25H2 Insider Preview (Dev Channel) |
| **Build** | 26300.8376 |
| **CPU** | Intel Core i7-14700KF |
| **GPU** | NVIDIA GeForce RTX 5080 (16 GB VRAM) |
| **RAM** | 32 GB DDR5 |
| **Storage** | 1 TB SSD |

GPU is overkill for this repo — the webapp build is CPU-bound and the scraper
is I/O-bound. Listed for completeness.

## Mobile devices used for webapp testing

The webapp is tested on these real devices before each release tag (DevTools
mobile emulation is not a sign-off substitute):

| Device | iOS | Browsers |
|--------|-----|----------|
| iPhone 14 Pro | 26.x | Chrome, Brave |
| iPhone 13 Pro Max | 26.x | Chrome, Brave |

If a layout bug ships, it likely also reproduces on these devices — please
include the device + iOS version + browser when filing a mobile-only issue.

## See also

- [`dev_env.md`](dev_env.md) — IDE, language toolchains, and dev workflow.
- [`webapp/TAURI.md`](../webapp/TAURI.md) — Tauri 2 desktop build prerequisites.
