import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import fs from "fs";

// Local dev keeps aliasing the live sibling `lyra-ui` checkout (so prototyping
// sees source edits immediately, same as always). CI/Pages builds don't have
// that sibling checkout available — only this repo is cloned — so when it's
// missing, fall back to the vendored snapshot in `vendor/lyra-ui` (see that
// folder's README for how it's kept in sync). Never edit the vendored copy
// directly; re-copy it from the sibling checkout instead.
const siblingLyraUi = path.resolve(__dirname, "../lyra-ui");
const lyraUiRoot = fs.existsSync(siblingLyraUi)
  ? siblingLyraUi
  : path.resolve(__dirname, "./vendor/lyra-ui");

// GitHub Pages project sites (davidbauerjr991.github.io/Agent-Nav-Testing/)
// are served from a subpath, not domain root — everything Vite emits needs
// to be prefixed with the repo name accordingly. Only applied for the
// production build (GITHUB_PAGES=true, set by the deploy workflow); local
// dev/preview keep serving from `/`.
const base = process.env.GITHUB_PAGES === "true" ? "/Agent-Nav-Testing/" : "/";

export default defineConfig({
  base,
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@nicecxone/lyra-ui/styles": path.resolve(lyraUiRoot, "src/styles/lyra-tokens.css"),
      // Mock "database" fixtures for the CreateNew → Outbound demo (agent
      // and customer records) — kept out of lyra-ui's public index.ts since
      // they're story-only fixtures, not real design-system exports, but
      // aliased individually (same pattern as /styles above) so this app's
      // demo data stays in sync with lyra-ui's instead of hand-copying a
      // second, drifting list. See lyra-ui/CONTRIBUTING.md §1.
      "@nicecxone/lyra-ui/agents-data": path.resolve(lyraUiRoot, "src/components/__stories__/create-new-agents-data.ts"),
      "@nicecxone/lyra-ui/customers-data": path.resolve(lyraUiRoot, "src/components/__stories__/create-new-customers-data.ts"),
      "@nicecxone/lyra-ui": path.resolve(lyraUiRoot, "src/index.ts"),
    },
  },
});
