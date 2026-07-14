import * as React from "react";
import { useState, useRef, useCallback } from "react";
import { Pin } from "lucide-react";
import { PanelHeader } from "./panel-header";
import { Tooltip } from "./tooltip";
import { cn } from "../lib/utils";

interface SidePanelProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Whether the panel is open */
  open: boolean;
  /** Panel width in pixels (default 256) */
  width?: number;
  /** Min width when resizing (default: 160) */
  minWidth?: number;
  /** Max width when resizing (default: 600) */
  maxWidth?: number;
  /** Whether the panel is pinned (inline) or floating (overlay) */
  pinned?: boolean;
  /** Called when the pin toggle is clicked */
  onPinToggle?: () => void;
  /** Panel header title */
  headerTitle?: string;
}

const SidePanel = React.forwardRef<HTMLDivElement, SidePanelProps>(
  (
    {
      className,
      open,
      width = 256,
      minWidth = 160,
      maxWidth = 600,
      pinned = true,
      onPinToggle,
      headerTitle,
      children,
      ...props
    },
    ref
  ) => {
    const [dragWidth, setDragWidth] = useState<number | null>(null);
    const isDragging = useRef(false);
    const startX = useRef(0);
    const startW = useRef(0);

    const currentWidth = dragWidth ?? width;

    const handleDragMouseDown = useCallback(
      (e: React.MouseEvent) => {
        e.preventDefault();
        isDragging.current = true;
        startX.current = e.clientX;
        startW.current = dragWidth ?? width;

        const onMove = (ev: MouseEvent) => {
          if (!isDragging.current) return;
          const delta = ev.clientX - startX.current; // left panel: drag right = wider
          setDragWidth(Math.min(maxWidth, Math.max(minWidth, startW.current + delta)));
        };
        const onUp = () => {
          isDragging.current = false;
          document.body.style.cursor = "";
          document.body.style.userSelect = "";
          document.removeEventListener("mousemove", onMove);
          document.removeEventListener("mouseup", onUp);
        };
        document.body.style.cursor = "col-resize";
        document.body.style.userSelect = "none";
        document.addEventListener("mousemove", onMove);
        document.addEventListener("mouseup", onUp);
      },
      [dragWidth, width, minWidth, maxWidth]
    );

    /* Drag handle on the right edge */
    const dragHandle = open ? (
      <div
        onMouseDown={handleDragMouseDown}
        className="absolute top-0 right-[-4px] bottom-0 z-10 flex items-center justify-center group"
        style={{ width: 8, cursor: "col-resize" }}
        aria-hidden="true"
      >
        <div className="w-0.5 h-8 rounded-full bg-lyra-border-default opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    ) : null;

    const inner = (
      <div className="relative flex h-full flex-col overflow-y-auto overflow-x-hidden" style={{ width: currentWidth, minWidth: currentWidth }}>
        {dragHandle}
        {headerTitle && (
          <PanelHeader
            title={headerTitle}
            actions={onPinToggle ? (
              <Tooltip content={pinned ? "Unpin panel" : "Pin panel"} placement="bottom" asLabel>
                <button
                  onClick={onPinToggle}
                  aria-label={pinned ? "Unpin panel" : "Pin panel"}
                  className="flex h-7 w-7 items-center justify-center rounded-lyra-sm text-lyra-fg-secondary transition-colors hover:bg-lyra-state-hover active:bg-lyra-state-pressed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lyra-border-focus focus-visible:ring-offset-2"
                >
                  <Pin className={cn("h-4 w-4", pinned && "rotate-45")} strokeWidth={1.5} aria-hidden="true" />
                </button>
              </Tooltip>
            ) : undefined}
          />
        )}
        {children}
      </div>
    );

    const transition = isDragging.current ? "none" : "width 250ms cubic-bezier(0.4, 0, 0.2, 1)";

    if (pinned) {
      return (
        <div
          ref={ref}
          role="region"
          aria-label={headerTitle || "Side panel"}
          aria-hidden={!open || undefined}
          className={cn("shrink-0 overflow-hidden bg-lyra-bg-surface-container-subtle", open && "border-r border-lyra-border-subtle", className)}
          style={{ width: open ? currentWidth : 0, transition }}
          {...props}
        >
          {inner}
        </div>
      );
    }

    return (
      <div
        ref={ref}
        role="region"
        aria-label={headerTitle || "Side panel"}
        aria-hidden={!open || undefined}
        className={cn("absolute left-0 top-0 z-[5] h-full overflow-hidden bg-lyra-bg-surface-container-subtle shadow-lg", open ? "border-r border-lyra-border-subtle" : "pointer-events-none", className)}
        style={{ width: open ? currentWidth : 0, transition }}
        {...props}
      >
        {inner}
      </div>
    );
  }
);
SidePanel.displayName = "SidePanel";

export { SidePanel };
export type { SidePanelProps };
