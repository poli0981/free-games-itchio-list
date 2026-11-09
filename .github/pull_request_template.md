<!--
Thanks for the PR! For a more specific checklist, add ?template=bug_fix.md (or new_features.md,
documentation.md, add_games.md) to this page's address — they live in .github/PULL_REQUEST_TEMPLATE/.
-->

### What and why

What does this change, and why?

### Related issues

Closes # (if any)

### Checklist

- [ ] Tested locally — Python: `pytest`, `ruff check scripts tests webapp/scripts`; webapp: `npm test`, `npm run lint`, `npm run knip`, `npx tsc -b`
- [ ] No secrets, tokens or personal data in the diff
- [ ] New UI text is in both `webapp/src/lib/i18n/en.ts` and `vi.ts`; a changed English doc has its Vietnamese mirror updated (or I said so above)
- [ ] I agree my contribution is licensed like the part it changes: MIT for code, CC BY 4.0 for data and docs

### Accessibility (UI or docs changes — see [ACCESSIBILITY.md](https://github.com/poli0981/free-games-itchio-list/blob/main/ACCESSIBILITY.md#8-for-contributors))

- [ ] N/A — no UI or docs change
- [ ] Works with the keyboard alone: everything reachable, focus visible and never lost
- [ ] Every control has a name; nothing relies on colour alone; `npm test` (contrast check) passes
- [ ] Respects reduced motion; no new auto-playing motion
- [ ] Checked once with a screen reader (Narrator, NVDA, VoiceOver or TalkBack)
- [ ] Docs: headings in order, descriptive link text, alt text for images
