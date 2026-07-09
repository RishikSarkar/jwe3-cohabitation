"use client";

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { createPortal } from "react-dom";
import type { EnclosureType } from "@/types/dinosaur";
import {
  compatibilityBreakdownLines,
  type CompatibilityBreakdown,
} from "@/lib/compatibility-tooltip";
import { scoreTierClassForValue, tooltipPanelChrome } from "@/lib/tier-score";

type Props = {
  score: number | null;
  tier: string;
  scoreClassName: string;
  tierClassName: string;
  breakdown: CompatibilityBreakdown;
  enclosureType: EnclosureType;
};

function BreakdownList({
  breakdown,
  enclosureType,
}: {
  breakdown: CompatibilityBreakdown;
  enclosureType: EnclosureType;
}) {
  const lines = compatibilityBreakdownLines(breakdown, enclosureType);

  return (
    <ul className="compat-tooltip-metrics">
      {lines.map((line) => (
        <li key={line.label}>
          <span className="compat-tooltip-metric-label">
            {line.label}
            <span className="compat-tooltip-metric-weight">{line.weightLabel}</span>
          </span>
          <span
            className={`compat-tooltip-metric-value ${scoreTierClassForValue(line.value)}`}
          >
            {line.value}
          </span>
        </li>
      ))}
    </ul>
  );
}

function TooltipPanel({
  id,
  open,
  style,
  placement,
  tier,
  panelRef,
  children,
}: {
  id: string;
  open: boolean;
  style: CSSProperties | undefined;
  placement: "left" | "right";
  tier: string;
  panelRef: React.RefObject<HTMLDivElement | null>;
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  const chrome = tooltipPanelChrome(tier);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !open || !style) return null;

  return createPortal(
    <div
      ref={panelRef as React.RefObject<HTMLDivElement>}
      id={id}
      role="tooltip"
      className={`compat-tooltip-panel compat-tooltip-panel-floating compat-tooltip-panel-${placement}`}
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

function useFloatingTooltip(
  open: boolean,
  triggerRef: React.RefObject<HTMLElement | null>,
  panelRef: React.RefObject<HTMLDivElement | null>,
) {
  const [placement, setPlacement] = useState<"left" | "right">("left");
  const [style, setStyle] = useState<CSSProperties>();

  const updatePosition = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const panelWidth = 300;
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
      width: panelWidth,
      zIndex: 10000,
    });
  }, [triggerRef, panelRef]);

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

export function CompatibilityTooltip({
  score,
  tier,
  scoreClassName,
  tierClassName,
  breakdown,
  enclosureType,
}: Props) {
  const tooltipId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const { style: panelStyle, placement } = useFloatingTooltip(
    open,
    triggerRef,
    panelRef,
  );

  const show = () => setOpen(true);
  const hide = () => setOpen(false);

  return (
    <span className="compat-tooltip">
      <button
        ref={triggerRef}
        type="button"
        className="compat-tooltip-trigger dino-row-compat"
        aria-describedby={open ? tooltipId : undefined}
        aria-label={`Compatibility score ${score ?? "unknown"}, ${tier}. Show breakdown.`}
        onClick={(e) => e.stopPropagation()}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
      >
        <span
          className={`font-display text-3xl font-bold leading-none ${scoreClassName}`}
        >
          {score ?? "-"}
        </span>
        <span className={`tier-badge ${tierClassName}`}>{tier}</span>
      </button>
      <TooltipPanel
        id={tooltipId}
        open={open}
        style={panelStyle}
        placement={placement}
        tier={tier}
        panelRef={panelRef}
      >
        <BreakdownList breakdown={breakdown} enclosureType={enclosureType} />
      </TooltipPanel>
    </span>
  );
}
