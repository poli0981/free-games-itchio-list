# Security Policy

Last updated: December 28, 2025

Yo, this is just a hobby repo — a curated list of free itch.io games with some Python scraping scripts running on GitHub Actions. No user data, no backend, no databases, no secrets (except my Steam sale addiction). Security risks? Probably close to zero. But hey, even noob projects deserve a security policy :D

## Supported Versions
Everything here is "latest commit" only. I'm unemployed with too much free time, so fixes (if any) come when I feel like it — or when Grok nags me.

## Reporting a Vulnerability
Found something scary? Like a script that could theoretically spam itch.io or expose... nothing? You're a legend.

Please **don't** open a public issue. Instead:
- Open a **private** GitHub issue (if the repo allows — I'm introvert, might not have email public).
- Or just open a normal issue and prefix "[Security]" — I'll make it private if needed.
- Describe the issue clearly (steps to reproduce, potential impact).
- I'll review (with Grok's help, because my security knowledge is "easy mode" level).

What to expect:
- I'll acknowledge within a few days (unemployed schedule, not 24/7).
- If valid (big if :v), I'll fix and credit you in changelog/acknowledgements.
- If not valid — thanks anyway for caring about my mediocre code.

Common "vulnerabilities" you might find:
- Scraping breaks if itch.io changes HTML (not security, just life).
- Rate limiting? I already sleep(2) — be kind to servers.
- Dependencies? requests + bs4 are stable, but update if needed.

No bounties (bank account < $50), but eternal thanks and a shoutout.

This repo is MIT licensed and super low-risk. Stay safe out there — especially when downloading random free games.

Thanks for reporting responsibly. You're better at security than me already. 🚀