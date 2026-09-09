"use client";

import { ChevronDown, Check, Search } from "lucide-react";
import { KeyboardEvent, useEffect, useId, useMemo, useRef, useState } from "react";
import "./custom-select.css";

export type SelectOption = {
  value: string;
  label: string;
};

type CustomSelectProps = {
  options: SelectOption[];
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  name?: string;
  required?: boolean;
  ariaLabel: string;
  onChange?: (value: string) => void;
};

export function CustomSelect({ options, value, defaultValue = "", placeholder = "Select an option", name, required = false, ariaLabel, onChange }: CustomSelectProps) {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlighted, setHighlighted] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listId = useId();
  const selectedValue = value ?? internalValue;
  const searchable = options.length > 6;
  const selected = options.find((option) => option.value === selectedValue);
  const visibleOptions = useMemo(() => {
    const term = query.trim().toLowerCase();
    return term ? options.filter((option) => option.label.toLowerCase().includes(term)) : options;
  }, [options, query]);

  useEffect(() => {
    const close = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) { setOpen(false); setQuery(""); }
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, []);

  useEffect(() => {
    if (!open || !searchable) return;
    const frame = requestAnimationFrame(() => searchRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [open, searchable]);

  const openMenu = () => {
    setQuery("");
    setHighlighted(Math.max(0, options.findIndex((option) => option.value === selectedValue)));
    setOpen(true);
  };

  const closeMenu = () => { setOpen(false); setQuery(""); };

  const choose = (nextValue: string) => {
    if (value === undefined) setInternalValue(nextValue);
    onChange?.(nextValue);
    closeMenu();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "Escape") { closeMenu(); return; }
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (open && visibleOptions[highlighted]) choose(visibleOptions[highlighted].value);
      else openMenu();
      return;
    }
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    event.preventDefault();
    if (!visibleOptions.length) return;
    if (!open) { openMenu(); return; }
    const direction = event.key === "ArrowDown" ? 1 : -1;
    setHighlighted((current) => (current + direction + visibleOptions.length) % visibleOptions.length);
  };

  const handleSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") { closeMenu(); return; }
    if (event.key === "Enter" && visibleOptions[highlighted]) { event.preventDefault(); choose(visibleOptions[highlighted].value); return; }
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    event.preventDefault();
    if (!visibleOptions.length) return;
    const direction = event.key === "ArrowDown" ? 1 : -1;
    setHighlighted((current) => (current + direction + visibleOptions.length) % visibleOptions.length);
  };

  return <div className={`custom-select ${open ? "is-open" : ""}`} ref={rootRef}>
    {name && <input className="custom-select-value" tabIndex={-1} aria-hidden="true" name={name} value={selectedValue} required={required} onChange={() => undefined} onInvalid={(event) => { event.preventDefault(); openMenu(); }} />}
    <button className="custom-select-trigger" type="button" role="combobox" aria-label={ariaLabel} aria-controls={listId} aria-expanded={open} aria-haspopup="listbox" onClick={() => open ? closeMenu() : openMenu()} onKeyDown={handleKeyDown}>
      <span className={selected ? "" : "is-placeholder"}>{selected?.label ?? placeholder}</span><ChevronDown aria-hidden="true" />
    </button>
    {open && <div className="custom-select-popover">
      {searchable && <label className="custom-select-search"><Search aria-hidden="true" /><input ref={searchRef} value={query} onChange={(event) => { setQuery(event.target.value); setHighlighted(0); }} onKeyDown={handleSearchKeyDown} placeholder="Search options" aria-label={`Search ${ariaLabel.toLowerCase()}`} /></label>}
      <div className="custom-select-options" id={listId} role="listbox" aria-label={ariaLabel}>
        {visibleOptions.length ? visibleOptions.map((option, index) => <button type="button" role="option" aria-selected={option.value === selectedValue} className={index === highlighted ? "is-highlighted" : ""} key={option.value} onMouseEnter={() => setHighlighted(index)} onClick={() => choose(option.value)}><span>{option.label}</span>{option.value === selectedValue && <Check aria-hidden="true" />}</button>) : <p>No options found</p>}
      </div>
    </div>}
  </div>;
}
