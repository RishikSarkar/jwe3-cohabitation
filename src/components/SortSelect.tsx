"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { SortMode } from "@/types/dinosaur";

const OPTIONS: { value: SortMode; label: string }[] = [
  { value: "compatibility", label: "Compatibility" },
  { value: "recommended", label: "Recommended" },
  { value: "appeal", label: "Appeal" },
  { value: "name", label: "Name" },
];

type Props = {
  value: SortMode;
  onChange: (value: SortMode) => void;
};

export function SortSelect({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const listId = useId();
  const current = OPTIONS.find((o) => o.value === value) ?? OPTIONS[0]!;
  const currentIndex = Math.max(
    0,
    OPTIONS.findIndex((o) => o.value === value),
  );

  useEffect(() => {
    if (open) setActiveIndex(currentIndex);
  }, [open, currentIndex]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  function selectAt(index: number) {
    const opt = OPTIONS[index];
    if (!opt) return;
    onChange(opt.value);
    setOpen(false);
  }

  function onTriggerKeyDown(e: React.KeyboardEvent<HTMLButtonElement>) {
    if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setOpen(true);
      if (e.key === "ArrowDown") setActiveIndex((i) => (i + 1) % OPTIONS.length);
      if (e.key === "ArrowUp") {
        setActiveIndex((i) => (i - 1 + OPTIONS.length) % OPTIONS.length);
      }
    }
  }

  function onListKeyDown(e: React.KeyboardEvent<HTMLUListElement>) {
    if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % OPTIONS.length);
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i - 1 + OPTIONS.length) % OPTIONS.length);
      return;
    }
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      selectAt(activeIndex);
    }
    if (e.key === "Home") {
      e.preventDefault();
      setActiveIndex(0);
    }
    if (e.key === "End") {
      e.preventDefault();
      setActiveIndex(OPTIONS.length - 1);
    }
  }

  return (
    <div className="sort-picker" ref={ref}>
      <button
        type="button"
        className="input-jwe select-jwe sort-picker-trigger w-full text-left sm:w-auto sm:min-w-[11rem]"
        onClick={() => setOpen((prev) => !prev)}
        onKeyDown={onTriggerKeyDown}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={open ? listId : undefined}
        aria-label={`Sort by ${current.label}`}
      >
        <span className="sort-picker-prefix">Sort:</span> {current.label}
      </button>
      {open && (
        <ul
          id={listId}
          className="dropdown-jwe sort-dropdown"
          role="listbox"
          aria-label="Sort options"
          tabIndex={-1}
          onKeyDown={onListKeyDown}
          ref={(el) => el?.focus()}
        >
          {OPTIONS.map((opt, index) => (
            <li key={opt.value}>
              <button
                type="button"
                role="option"
                id={`${listId}-${opt.value}`}
                aria-selected={opt.value === value}
                className={`sort-dropdown-option${opt.value === value ? " is-active" : ""}${index === activeIndex ? " is-focused" : ""}`}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => selectAt(index)}
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
