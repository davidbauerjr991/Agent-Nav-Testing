import { useCallback, useEffect, useState } from "react";
import { Option01Page } from "@/components/Option01Page";
import { Option02Page } from "@/components/Option02Page";
import { Option03Page } from "@/components/Option03Page";
import { Option04Page } from "@/components/Option04Page";
import { Option05Page } from "@/components/Option05Page";

/* ── Path-based routing ──
   No login screen or welcome modal in this prototype — the app loads
   straight into page content. "option-01" is the home/root page (the bare
   base path); "option-02"/"option-03"/"option-04"/"option-05" are separate,
   independently-editable full duplicates of it, each linkable at its own
   URL (e.g. https://.../Agent-Nav-Testing/option-02) for a blind A/B
   test — see each page's own header, which no longer exposes an in-app
   switcher between them (that's the point of a blind test: a link should
   only ever land on the one page it points to).

   Real paths (not a "#/option-02" hash) so links read cleanly, but GitHub
   Pages is a static host with no server-side rewrite — a direct link or a
   refresh on /option-02 has no way to reach index.html on its own. That's
   handled by public/404.html + the matching decode script in index.html
   (the well-known "spa-github-pages" redirect trick); this router just
   reads window.location.pathname, stripping Vite's BASE_URL (the
   "/Agent-Nav-Testing/" project-page prefix in production, "/" in local
   dev) to get the route. */
type Page = "option-01" | "option-02" | "option-03" | "option-04" | "option-05";

const BASE = import.meta.env.BASE_URL; // e.g. "/" (dev) or "/Agent-Nav-Testing/" (Pages)

function routeFromPath(pathname: string): Page {
  // Match on the last non-empty path segment rather than stripping an exact
  // BASE prefix — BASE is "/" in local dev, so a direct visit to
  // "/Agent-Nav-Testing/option-03" (testing against the production URL
  // shape while running the dev server) wouldn't start with BASE at all and
  // fell through to option-01 every time. Reading just the final segment
  // works the same whether there's no prefix, the dev "/" prefix, or the
  // real "/Agent-Nav-Testing/" prefix in production.
  const segments = pathname.split("/").filter(Boolean);
  const route = segments[segments.length - 1];
  if (route === "option-02") return "option-02";
  if (route === "option-03") return "option-03";
  if (route === "option-04") return "option-04";
  if (route === "option-05") return "option-05";
  return "option-01"; // covers "/", "option-01", and any unrecognized path
}

function pathForRoute(page: Page): string {
  return page === "option-01" ? BASE : `${BASE}${page}`;
}

function usePathRouter(): [Page, (page: Page) => void] {
  const [page, setPageState] = useState<Page>(() => routeFromPath(window.location.pathname));

  useEffect(() => {
    const onPop = () => setPageState(routeFromPath(window.location.pathname));
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const navigate = useCallback((next: Page) => {
    window.history.pushState(null, "", pathForRoute(next));
    setPageState(next);
  }, []);

  return [page, navigate];
}

function App() {
  const [page, setPage] = usePathRouter();

  if (page === "option-02") {
    return <Option02Page showPageHeader showPanelToggle showInteriorPanel onNavigate={setPage} />;
  }

  if (page === "option-03") {
    return <Option03Page showPageHeader showPanelToggle showInteriorPanel onNavigate={setPage} />;
  }

  if (page === "option-04") {
    return <Option04Page showPageHeader showPanelToggle showInteriorPanel onNavigate={setPage} />;
  }

  if (page === "option-05") {
    return <Option05Page showPageHeader showPanelToggle showInteriorPanel onNavigate={setPage} />;
  }

  return <Option01Page showPageHeader showPanelToggle showInteriorPanel onNavigate={setPage} />;
}

export default App;
