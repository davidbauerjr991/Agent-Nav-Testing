import { useCallback, useEffect, useState } from "react";
import { Option01Page } from "@/components/Option01Page";
import { Option02Page } from "@/components/Option02Page";
import { Option03Page } from "@/components/Option03Page";
import { Option04Page } from "@/components/Option04Page";
import { Option05Page } from "@/components/Option05Page";

/* ── Hash-based routing ──
   No login screen or welcome modal in this prototype — the app loads
   straight into page content. "option-01" is the home/root page (empty
   hash); "option-02"/"option-03"/"option-04"/"option-05" are separate,
   independently-editable full duplicates of it, reachable from the AppMenu
   ("Option 01/02/03/04/05" — see each page's own buildAppMenuGroups).
   Navigating between them is a plain page swap (setPageState), never a
   re-entry into any gate. */
type Page = "option-01" | "option-02" | "option-03" | "option-04" | "option-05";

const PAGE_HASH: Record<Page, string> = {
  "option-01": "",
  "option-02": "#/option-02",
  "option-03": "#/option-03",
  "option-04": "#/option-04",
  "option-05": "#/option-05",
};

function pageFromHash(): Page {
  const hash = window.location.hash;
  if (hash === "#/option-02") return "option-02";
  if (hash === "#/option-03") return "option-03";
  if (hash === "#/option-04") return "option-04";
  if (hash === "#/option-05") return "option-05";
  return "option-01";
}

function useHashRouter(): [Page, (page: Page) => void] {
  const [page, setPageState] = useState<Page>(pageFromHash);

  useEffect(() => {
    const onPop = () => setPageState(pageFromHash());
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const navigate = useCallback((next: Page) => {
    const hash = PAGE_HASH[next];
    window.history.pushState(null, "", hash === "" ? window.location.pathname : hash);
    setPageState(next);
  }, []);

  return [page, navigate];
}

function App() {
  const [page, setPage] = useHashRouter();

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
