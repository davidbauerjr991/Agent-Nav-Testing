import * as React from "react";
import { useState, useRef, useCallback, useLayoutEffect, useEffect } from "react";
import { PanelHeader } from "./panel-header";
import { PanelContent } from "./panel-content";
import { PanelFooter } from "./panel-footer";
import { PanelPinButton } from "./panel-pin-button";
import { cn } from "../lib/utils";

/* ── Types ── */

export type PanelVariant = "side" | "interior";
export type PanelSide = "left" | "right";

export interface PanelProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * "side"     — navigation/tool panel; unpinned = hover overlay, pinned = inline.
   * "interior" — inline detail/properties panel; always inline and resizable.
   */
  variant: PanelVariant;
  /** Which side of the layout the panel appears on */
  side?: PanelSide;
  /** Whether the panel is open (required for animated variants) */
  open?: boolean;

  /* ── Side variant ── */
  /** Pinned = inline push; unpinned = hover overlay. Side variant only. */
  pinned?: boolean;
  /** Called when the pin button is clicked */
  onPinToggle?: () => void;

  /* ── Interior variant ── */
  /** Renders a close (×) button in the header. Interior variant only. */
  onClose?: () => void;

  /* ── Resize ── */
  /** Allow drag-to-resize on the leading border (default: true) */
  resizable?: boolean;
  /** Min width when resizing in px (default: 200) */
  minWidth?: number;
  /** Max width when resizing in px (default: 425) */
  maxWidth?: number;
  /** Called when a resize drag starts (true) or ends (false) */
  onResizeStateChange?: (isResizing: boolean) => void;
  /** Called whenever the panel width changes during a drag */
  onWidthChange?: (width: number) => void;

  /* ── Layout ── */
  /** Width in px. Defaults: side = 256, interior = 340 */
  width?: number;

  /* ── Header ── */
  headerTitle?: string;
  /** Optional line below `headerTitle`, e.g. a record's name + id. */
  headerSubhead?: string;
  headerIcon?: React.ReactNode;
  headerActions?: React.ReactNode;

  /* ── Footer ── */
  footer?: React.ReactNode;
}

/* ── Drag hook ── */

function useDragResize(
  side: PanelSide,
  initialWidth: number,
  min: number,
  max: number,
  onResizeStateChange?: (isResizing: boolean) => void,
  onWidthChange?: (width: number) => void
) {
  const [dragWidth, setDragWidth] = useState<number | null>(null);
  const dragging = useRef(false);
  const startX = useRef(0);
  const startW = useRef(0);

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      dragging.current = true;
      startX.current = e.clientX;
      startW.current = dragWidth ?? initialWidth;
      onResizeStateChange?.(true);

      const onMove = (ev: MouseEvent) => {
        if (!dragging.current) return;
        const delta = side === "right"
          ? startX.current - ev.clientX
          : ev.clientX - startX.current;
        const newW = Math.min(max, Math.max(min, startW.current + delta));
        setDragWidth(newW);
        onWidthChange?.(newW);
      };
      const onUp = () => {
        dragging.current = false;
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
        onResizeStateChange?.(false);
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onUp);
      };
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
    },
    [side, dragWidth, initialWidth, min, max, onResizeStateChange, onWidthChange]
  );

  return { width: dragWidth ?? initialWidth, onMouseDown };
}

/* ── Panel ── */

const Panel = React.forwardRef<HTMLDivElement, PanelProps>(
  (
    {
      className,
      variant,
      side = "right",
      open = true,
      pinned = true,
      onPinToggle,
      onClose,
      resizable = true,
      minWidth = 200,
      maxWidth,
      onResizeStateChange,
      onWidthChange,
      width,
      headerTitle,
      headerSubhead,
      headerIcon,
      headerActions,
      footer,
      children,
      ...props
    },
    ref
  ) => {
    const defaultWidth = variant === "side" ? 256 : 340;
    const baseWidth = width ?? defaultWidth;
    const resolvedMaxWidth = maxWidth ?? 425;
    const [isResizing, setIsResizing] = useState(false);
    const handleResizeStateChange = useCallback((r: boolean) => {
      setIsResizing(r);
      onResizeStateChange?.(r);
    }, [onResizeStateChange]);
    const { width: currentWidth, onMouseDown } = useDragResize(side, baseWidth, minWidth, resolvedMaxWidth, handleResizeStateChange, onWidthChange);
    const widthTransition = isResizing ? "none" : "width 250ms cubic-bezier(0.4, 0, 0.2, 1)";

    // Track closing so border + background stay visible during the width animation
    const [isClosing, setIsClosing] = useState(false);
    const closeTimerRef = useRef<ReturnType<typeof setTimeout>>();
    useEffect(() => {
      if (!open) {
        setIsClosing(true);
        closeTimerRef.current = setTimeout(() => setIsClosing(false), 260);
      } else {
        clearTimeout(closeTimerRef.current);
        setIsClosing(false);
      }
      return () => clearTimeout(closeTimerRef.current);
    }, [open]);

    /* ── Interior: go absolute/overlay when parent container < 1050px ── */
    const outerRef = useRef<HTMLDivElement>(null);
    const [parentWidth, setParentWidth] = useState(9999);
    const isNarrow = variant === "interior" && parentWidth < 1050;

    const stableOuterRef = useCallback((el: HTMLDivElement | null) => {
      (outerRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
      if (typeof ref === "function") ref(el);
      else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = el;
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useLayoutEffect(() => {
      if (variant !== "interior") return;
      const el = outerRef.current?.parentElement;
      if (!el) return;
      setParentWidth(el.getBoundingClientRect().width);
      const ro = new ResizeObserver(([entry]) => setParentWidth(entry.contentRect.width));
      ro.observe(el);
      return () => ro.disconnect();
    }, [variant]);

    /* ── Pin button (side variant) ── */
    const pinButton = variant === "side" && onPinToggle ? (
      <PanelPinButton pinned={pinned} onToggle={onPinToggle} />
    ) : null;

    /* ── Drag handle ── */
    const dragHandle = resizable && (variant === "interior" ? open : true) ? (
      <div
        onMouseDown={onMouseDown}
        className="absolute top-0 bottom-0 z-10 flex items-center justify-center group"
        style={{ [side === "right" ? "left" : "right"]: -4, width: 8, cursor: "col-resize" }}
        aria-hidden="true"
      >
        <div className="w-0.5 h-8 rounded-full bg-lyra-border-default opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
    ) : null;

    /* ── Inner content ── */
    const innerWidth = currentWidth;
    const inner = (
      <div
        className="relative flex flex-col h-full"
        style={{ width: innerWidth, minWidth: innerWidth }}
      >
        {dragHandle}
        {/* Snap content invisible on close (no squish); fade in on open */}
        <div
          className="flex flex-col flex-1 min-h-0"
          style={{
            opacity: open ? 1 : 0,
            visibility: open ? "visible" : "hidden",
            transition: open ? "opacity 150ms ease 30ms" : "none",
          }}
        >
          {headerTitle && (
            <PanelHeader
              title={headerTitle}
              subhead={headerSubhead}
              icon={headerIcon}
              actions={<>{headerActions}{pinButton}</>}
              onClose={variant === "interior" ? onClose : undefined}
              bordered={false}
            />
          )}
          <PanelContent>{children}</PanelContent>
          {footer && (
            variant === "interior"
              ? <PanelFooter>{footer}</PanelFooter>
              : <div className="shrink-0">{footer}</div>
          )}
        </div>
      </div>
    );

    /* ── Side: pinned (inline) ── */
    if (variant === "side" && pinned) {
      const border = side === "left" ? "border-r border-lyra-border-subtle" : "border-l border-lyra-border-subtle";
      return (
        <div
          ref={ref}
          role="region"
          aria-label={headerTitle || "Side panel"}
          className={cn("shrink-0 overflow-hidden bg-lyra-bg-surface-container-subtle", open && border, className)}
          style={{ width: open ? currentWidth : 0, transition: widthTransition }}
          {...props}
        >
          {inner}
        </div>
      );
    }

    /* ── Side: unpinned (overlay) ── */
    if (variant === "side" && !pinned) {
      const pos = side === "left" ? "left-0" : "right-0";
      const border = side === "left" ? "border-r border-lyra-border-subtle" : "border-l border-lyra-border-subtle";
      return (
        <div
          ref={ref}
          role="region"
          aria-label={headerTitle || "Side panel"}
          className={cn("absolute top-0 z-[5] h-full overflow-hidden bg-lyra-bg-surface-container-subtle shadow-lg", pos, open ? border : "pointer-events-none", className)}
          style={{ width: open ? currentWidth : 0, transition: widthTransition }}
          {...props}
        >
          {inner}
        </div>
      );
    }

    /* ── Interior ── */
    // Keep border visible during close animation so it doesn't snap away
    const border = (open || isClosing)
      ? (side === "right" ? "border-l border-lyra-border-subtle" : "border-r border-lyra-border-subtle")
      : "";
    const interiorWidth = open ? currentWidth : 0;
    const pos = side === "right" ? "right-0" : "left-0";

    // Narrow: overlay like an unpinned side panel instead of pushing content full-width
    if (isNarrow) {
      return (
        <div
          ref={stableOuterRef}
          className={cn("absolute top-0 z-[5] h-full overflow-hidden bg-lyra-bg-surface-overlay shadow-lg", pos, border, className)}
          style={{ width: interiorWidth, transition: widthTransition }}
          {...props}
        >
          {inner}
        </div>
      );
    }

    return (
      <div
        ref={stableOuterRef}
        className={cn("relative flex flex-col h-full bg-lyra-bg-surface-overlay shrink-0", border, className)}
        style={{
          width: interiorWidth,
          minWidth: 0,
          overflow: "hidden",
          transition: widthTransition,
        }}
        {...props}
      >
        {/* Left-side interior: align content to right edge during animation */}
        {side === "left"
          ? <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: innerWidth, minWidth: innerWidth }}>{inner}</div>
          : inner
        }
      </div>
    );
  }
);
Panel.displayName = "Panel";

export { Panel, PanelContent };
