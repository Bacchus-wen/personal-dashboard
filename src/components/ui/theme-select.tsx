"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";

export type ThemeSelectOption = { value: string; label: string };

/**
 * Theme-aware dropdown. Native <select> open lists are rendered by the OS and
 * cannot be themed, so this is a custom ARIA listbox that fully adopts the site
 * design tokens in both themes. Keyboard support: Enter/Space/Arrow to open,
 * Arrow/Home/End to move, Enter/Space to choose, Escape to close, type-ahead.
 */
export function ThemeSelect({
  value,
  options,
  onChange,
  ariaLabel,
  placeholder,
  className,
  name,
}: {
  value: string;
  options: ThemeSelectOption[];
  onChange: (value: string) => void;
  ariaLabel?: string;
  placeholder?: string;
  className?: string;
  /** When set, mirrors the value into a hidden input so the control still
   *  participates in native <form> / FormData submission. */
  name?: string;
}) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const typeahead = useRef("");
  const typeaheadTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const baseId = useId();

  const selectedIndex = options.findIndex((option) => option.value === value);
  const selectedLabel =
    selectedIndex >= 0 ? options[selectedIndex].label : placeholder ?? "";

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    return () => document.removeEventListener("pointerdown", onPointer);
  }, [open]);

  useEffect(() => {
    if (open) listRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open || activeIndex < 0) return;
    listRef.current
      ?.querySelector<HTMLElement>(`[data-index="${activeIndex}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [open, activeIndex]);

  const openMenu = () => {
    setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0);
    setOpen(true);
  };

  const commit = (index: number) => {
    const option = options[index];
    if (option) onChange(option.value);
    setOpen(false);
    triggerRef.current?.focus();
  };

  const onTriggerKeyDown = (event: ReactKeyboardEvent<HTMLButtonElement>) => {
    if (["ArrowDown", "ArrowUp", "Enter", " "].includes(event.key)) {
      event.preventDefault();
      openMenu();
    }
  };

  const onListKeyDown = (event: ReactKeyboardEvent<HTMLUListElement>) => {
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        setActiveIndex((index) => Math.min(options.length - 1, index + 1));
        break;
      case "ArrowUp":
        event.preventDefault();
        setActiveIndex((index) => Math.max(0, index - 1));
        break;
      case "Home":
        event.preventDefault();
        setActiveIndex(0);
        break;
      case "End":
        event.preventDefault();
        setActiveIndex(options.length - 1);
        break;
      case "Enter":
      case " ":
        event.preventDefault();
        commit(activeIndex);
        break;
      case "Escape":
        event.preventDefault();
        setOpen(false);
        triggerRef.current?.focus();
        break;
      case "Tab":
        setOpen(false);
        break;
      default: {
        if (event.key.length !== 1) break;
        const buffer = typeahead.current + event.key;
        typeahead.current = buffer;
        if (typeaheadTimer.current) clearTimeout(typeaheadTimer.current);
        typeaheadTimer.current = setTimeout(() => {
          typeahead.current = "";
        }, 600);
        const match = options.findIndex((option) =>
          option.label.toLowerCase().startsWith(buffer.toLowerCase()),
        );
        if (match >= 0) setActiveIndex(match);
      }
    }
  };

  return (
    <div
      className={className ? `theme-select ${className}` : "theme-select"}
      ref={rootRef}
    >
      {name ? <input type="hidden" name={name} value={value} /> : null}
      <button
        type="button"
        className="theme-select-trigger"
        ref={triggerRef}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        data-placeholder={selectedIndex < 0 ? "true" : undefined}
        onClick={() => (open ? setOpen(false) : openMenu())}
        onKeyDown={onTriggerKeyDown}
      >
        <span className="theme-select-value">{selectedLabel}</span>
        <svg className="theme-select-chevron" viewBox="0 0 24 24" aria-hidden="true">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      {open ? (
        <ul
          className="theme-select-menu"
          role="listbox"
          ref={listRef}
          tabIndex={-1}
          aria-label={ariaLabel}
          aria-activedescendant={
            activeIndex >= 0 ? `${baseId}-${activeIndex}` : undefined
          }
          onKeyDown={onListKeyDown}
        >
          {options.map((option, index) => (
            <li
              key={option.value}
              id={`${baseId}-${index}`}
              data-index={index}
              role="option"
              aria-selected={option.value === value}
              data-active={index === activeIndex ? "true" : undefined}
              className="theme-select-option"
              onClick={() => commit(index)}
              onPointerEnter={() => setActiveIndex(index)}
            >
              {option.label}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
