"use client";

import { useEffect, useRef, useState } from "react";
import type { SortMode } from "@/types/dinosaur";

const OPTIONS: { value: SortMode; label: string }[] = [
  { value: "compatibility", label: "Sort: Compatibility" },
  { value: "recommended", label: "Sort: Recommended" },
  { value: "appeal", label: "Sort: Appeal" },
  { value: "name", label: "Sort: Name" },
];

type Props = {
  value: SortMode;
  onChange: (value: SortMode) => void;
};

export function SortSelect({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = OPTIONS.find((o) => o.value === value) ?? OPTIONS[0]!;

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  return (
    <div className="sort-picker" ref={ref}>
      <button
        type="button"
        className="input-jwe select-jwe sort-picker-trigger w-full text-left sm:w-auto sm:min-w-[200px]"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        {current.label}
      </button>
      {open && (
        <ul className="dropdown-jwe sort-dropdown" role="listbox">
          {OPTIONS.map((opt) => (
            <li key={opt.value}>
              <button
                type="button"
                role="option"
                aria-selected={opt.value === value}
                className={`sort-dropdown-option${opt.value === value ? " is-active" : ""}`}
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
              >
                {opt.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
