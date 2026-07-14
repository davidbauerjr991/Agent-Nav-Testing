import * as React from "react";
import { useState, useRef, useCallback } from "react";
import { PanelHeader } from "./panel-header";
import { PanelFooter } from "./panel-footer";
import { cn } from "../lib/utils";

/* ── Types ── */

interface InteriorPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Panel title rendered in the header */
  headerTitle?: string;
  /** Optional icon rendered to the left of the header title */
  headerIcon?: React.ReactNode;
  /** Additional actions rendered to the right of the header title */
  headerActions?: React.ReactNode;
  /** Show a close button in the header — calls onClose when clicked */
  onClose?: () => void;
  /** Content pinned to the bottom of the panel, outside the scroll area */
  footer?: React.ReactNode;
  /** Width of the panel (default: 340px) */
  width?: number | string;
  /** Min width when resizing (default: 200px) */
  minWidth?: number;
  /** Max width when resizing (default: 800px) */
  maxWidth?: number;
  /**
   * Which side the panel slides in from.
   * Determines which border is shown: left → border-right, right → border-left.
   * Omit for a static panel (no animation, border on both sides).
   */
  side?: "left" | "right";
  /** Whether the panel is visible — required when using `side` for animation */
  open?: boolean;
}

/* ── InteriorPanel ── */

const InteriorPanel = React.forwardRef<HTMLDivElement, InteriorPanelProps>(
  (
    {
      className,
      headerTitle,
      headerIcon,
      headerActions,
      onClose,
      footer,
      width = 340,
      minWidth = 200,
      maxWidth = 800,
      side,
      open: openProp,
      children,
      ...props
    },
    ref
  ) => {
    const resolvedWidth = typeof width === "number" ? width : 340;
    const [dragWidth, setDragWidth] = useState<number | null>(null);
    const isDragging = useRef(false);
    const startX = useRef(0);
    const startWidth = useRef(0);

    const currentWidth = dragWidth ?? resolvedWidth;

    const handleMouseDown = useCallback(
      (e: React.MouseEvent) => {
        e.preventDefault();
        isDragging.current = true;
        startX.current = e.clientX;
        startWidth.current = dragWidth ?? resolvedWidth;

        const onMouseMove = (ev: MouseEvent) => {
          if (!isDragging.current) return;
          const delta = side === "right"
            ? startX.current - ev.clientX   // drag left → wider
            : ev.clientX - startX.current;  // drag right → wider
          const next = Math.min(maxWidth, Math.max(minWidth, startWidth.current + delta));
          setDragWidth(next);
        };

        const onMouseUp = () => {
          isDragging.current = false;
          document.removeEventListener("mousemove", onMouseMove);
          document.removeEventListener("mouseup", onMouseUp);
          document.body.style.cursor = "";
          document.body.style.userSelect = "";
        };

        document.body.style.cursor = "col-resize";
        document.body.style.userSelect = "none";
        document.addEventListener("mousemove", onMouseMove);
        document.addEventListener("mouseup", onMouseUp);
      },
      [side, dragWidth, resolvedWidth, minWidth, maxWidth]
    );

    const borderClass = side === "right"
      ? (openProp ? "border-l border-lyra-border-subtle" : "")
      : side === "left"
      ? (openProp ? "border-r border-lyra-border-subtle" : "")
      : "border-x border-lyra-border-subtle";

    /* Suppress width transition while dragging so it tracks the cursor */
    const animatedStyle: React.CSSProperties = side
      ? {
          width: openProp ? currentWidth : 0,
          minWidth: 0,
          transition: isDragging.current ? "none" : "width 250ms cubic-bezier(0.4, 0, 0.2, 1)",
          overflow: "hidden",
        }
      : { width: currentWidth };

    /* Drag handle — 1px visible border + wider invisible hit area */
    const dragHandle = (
      <div
        onMouseDown={handleMouseDown}
        className="absolute top-0 bottom-0 z-10 flex items-center justify-center group"
        style={{
          [side === "right" || !side ? "left" : "right"]: -4,
          width: 8,
          cursor: "col-resize",
        }}
        aria-hidden="true"
      >
        {/* Visual indicator on hover */}
        <div className="w-0.5 h-8 rounded-full bg-lyra-border-default opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    );

    return (
      <div
        ref={ref}
        className={cn(
          "relative flex flex-col h-full bg-lyra-bg-surface-overlay shrink-0",
          borderClass,
          className
        )}
        style={animatedStyle}
        {...props}
      >
        {/* Inner wrapper: right-aligned for left-side panels so content is
            clipped on the left and reveals right-to-left, matching the
            right-side panel behaviour (which is clipped by the flex container). */}
        <div
          className="flex flex-col h-full"
          style={{
            width: currentWidth,
            minWidth: currentWidth,
            position: side === "left" ? "absolute" : undefined,
            right: side === "left" ? 0 : undefined,
            top: side === "left" ? 0 : undefined,
            bottom: side === "left" ? 0 : undefined,
          }}
        >
          {/* Drag handle on the leading border */}
          {(!side || openProp) && dragHandle}

          {headerTitle && (
            <PanelHeader
              title={headerTitle}
              icon={headerIcon}
              actions={headerActions}
              onClose={onClose}
            />
          )}
          <div className="flex-1 overflow-y-auto min-h-0">
            {children}
          </div>
          {footer && <PanelFooter>{footer}</PanelFooter>}
        </div>
      </div>
    );
  }
);
InteriorPanel.displayName = "InteriorPanel";

export { InteriorPanel };
export type { InteriorPanelProps };
