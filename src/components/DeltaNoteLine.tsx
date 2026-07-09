"use client";

import { useId, useRef, useState } from "react";
import type { DeltaNote } from "@/lib/delta-notes";
import { TooltipPanel, useFloatingTooltip } from "./floating-tooltip";

function NameListMore({ names }: { names: string[] }) {
  const hidden = names.slice(1);
  const tooltipId = useId();
  const triggerRef = useRef<HTMLSpanElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const { style, placement } = useFloatingTooltip(open, triggerRef, panelRef, {
    panelWidth: "auto",
  });

  if (hidden.length === 0) return null;

  const show = () => setOpen(true);
  const hide = () => setOpen(false);

  return (
    <>
      <span
        ref={triggerRef}
        className="delta-note-more"
        tabIndex={0}
        role="button"
        aria-describedby={open ? tooltipId : undefined}
        aria-label={`Show ${hidden.length} more: ${hidden.join(", ")}`}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            e.stopPropagation();
            setOpen((prev) => !prev);
          }
        }}
      >
        +{hidden.length} more
      </span>
      <TooltipPanel
        id={tooltipId}
        open={open}
        style={style}
        placement={placement}
        tier="Excellent"
        panelRef={panelRef}
        panelClassName="compat-tooltip-panel-compact"
      >
        <ul className="delta-note-more-list">
          {hidden.map((name) => (
            <li key={name}>{name}</li>
          ))}
        </ul>
      </TooltipPanel>
    </>
  );
}

export function DeltaNoteLine({ note }: { note: DeltaNote }) {
  if (!note.names || note.names.length <= 1 || !note.label) {
    return <>{note.text}</>;
  }

  return (
    <>
      {note.label} {note.names[0]} <NameListMore names={note.names} />
    </>
  );
}
