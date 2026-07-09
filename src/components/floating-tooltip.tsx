"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useState,
  type CSSProperties,
  type ReactNode,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";
import { tooltipPanelChrome } from "@/lib/tier-score";

export function TooltipPanel({
  id,
  open,
  style,
  placement,
  tier,
  panelRef,
  panelClassName = "",
  children,
}: {
  id: string;
  open: boolean;
  style: CSSProperties | undefined;
  placement: "left" | "right";
  tier: string;
  panelRef: RefObject<HTMLDivElement | null>;
  panelClassName?: string;
  children: ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  const chrome = tooltipPanelChrome(tier);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !open || !style) return null;

  return createPortal(
    <div
      ref={panelRef as RefObject<HTMLDivElement>}
      id={id}
      role="tooltip"
      className={`compat-tooltip-panel compat-tooltip-panel-floating compat-tooltip-panel-${placement} ${panelClassName}`.trim()}
      style={
        {
          ...style,
          ...chrome,
          "--tooltip-arrow": chrome.backgroundColor,
        } as CSSProperties
      }
    >
      {children}
    </div>,
    document.body,
  );
}

export function useFloatingTooltip(
  open: boolean,
  triggerRef: RefObject<HTMLElement | null>,
  panelRef: RefObject<HTMLDivElement | null>,
  options: { panelWidth?: number | "auto" } = {},
) {
  const panelWidthOption = options.panelWidth ?? 300;
  const [placement, setPlacement] = useState<"left" | "right">("left");
  const [style, setStyle] = useState<CSSProperties>();

  const updatePosition = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const panelWidth =
      panelWidthOption === "auto"
        ? panelRef.current?.offsetWidth ?? 120
        : panelWidthOption;
    const gap = 12;
    const side = rect.left - panelWidth - gap >= 8 ? "left" : "right";
    const left =
      side === "left" ? rect.left - panelWidth - gap : rect.right + gap;

    const panelHeight = panelRef.current?.offsetHeight ?? 0;
    const anchorY = rect.top + rect.height / 2;
    const half = panelHeight > 0 ? panelHeight / 2 : 0;
    const minTop = half + 8;
    const maxTop =
      panelHeight > 0 ? window.innerHeight - half - 8 : window.innerHeight - 8;
    const top = Math.min(Math.max(minTop, anchorY), maxTop);

    setPlacement(side);
    setStyle({
      position: "fixed",
      top,
      left,
      transform: panelHeight > 0 ? "translateY(-50%)" : undefined,
      width: panelWidthOption === "auto" ? "max-content" : panelWidth,
      zIndex: 10000,
    });
  }, [triggerRef, panelRef, panelWidthOption]);

  useLayoutEffect(() => {
    if (!open) {
      setStyle(undefined);
      return;
    }
    updatePosition();
    const frame = requestAnimationFrame(() => updatePosition());
    return () => cancelAnimationFrame(frame);
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open) return;

    const onScroll = () => updatePosition();
    const onResize = () => updatePosition();

    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
    };
  }, [open, updatePosition]);

  return { style, placement };
}
