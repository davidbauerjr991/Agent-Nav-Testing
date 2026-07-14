# Vendored `@nicecxone/lyra-ui` snapshot

This directory is a **vendored copy** of the `lyra-ui` design system's source
(`src/` + `tailwind-tokens.cjs`), checked into this repo so the app can build
standalone — e.g. in GitHub Actions for the GitHub Pages deploy — without
needing a sibling `lyra-ui` checkout on the build machine.

- Snapshotted from commit `ded10f609aaa77b2c5401f7cd0a71767efca486f` (see
  `../../.lyra-ui-sync` at the repo root, which still tracks the local dev
  alias's source commit).
- **Do not hand-edit files in here.** If lyra-ui changes upstream and this
  app needs the update, re-copy `lyra-ui/src` and `lyra-ui/tailwind-tokens.cjs`
  from the source checkout and update `.lyra-ui-sync`, rather than patching
  this copy directly — otherwise this vendored copy and local dev (which
  still aliases the live sibling checkout, see `vite.config.ts`/
  `tailwind.config.js`) can silently drift apart.
- Local dev (`npm run dev`) still points at the real sibling `../lyra-ui`
  checkout via the Vite alias, so day-to-day prototyping sees live edits.
  Only the production build config additionally falls back to this vendored
  copy when the sibling checkout isn't present (e.g. in CI) — see the
  `fs.existsSync` check in `vite.config.ts`.
