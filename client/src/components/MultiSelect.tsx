import { useEffect, useMemo, useRef, useState } from "react";

export interface MultiSelectOption {
  id: string;
  label: string;
  disabled?: boolean;
}

export interface MultiSelectProps {
  options: MultiSelectOption[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  emptyMessage?: string;
  /** When true, render an "inactive" hint on already-selected disabled options. */
  showInactiveHint?: boolean;
  disabled?: boolean;
  id?: string;
}

/**
 * Searchable multi-select with chip display.
 *
 * Behavior:
 * - Controlled: `value` is the array of selected option ids.
 * - Typing in the input filters the option list (case-insensitive substring).
 * - Click an option to add; click an `×` on a chip to remove.
 * - Clicking outside or pressing Escape closes the panel.
 * - Disabled options are kept visible if already selected but cannot be re-added.
 *
 * Mobile-friendly: tap targets ≥ 36px, the panel uses min-width: 100%.
 */
export function MultiSelect({
  options,
  value,
  onChange,
  placeholder = "Search…",
  emptyMessage = "No matches",
  showInactiveHint = false,
  disabled = false,
  id,
}: MultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const optionById = useMemo(() => {
    const m = new Map<string, MultiSelectOption>();
    for (const o of options) m.set(o.id, o);
    return m;
  }, [options]);

  const selectedOptions = value
    .map((id) => optionById.get(id))
    .filter((o): o is MultiSelectOption => Boolean(o));

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return options.filter((o) => !q || o.label.toLowerCase().includes(q));
  }, [options, query]);

  function toggle(id: string) {
    if (value.includes(id)) onChange(value.filter((v) => v !== id));
    else onChange([...value, id]);
  }

  return (
    <div
      ref={containerRef}
      className="multiselect"
      data-open={open ? "true" : "false"}
    >
      <div className="multiselect-control" onClick={() => inputRef.current?.focus()}>
        <div className="multiselect-chips">
          {selectedOptions.length === 0 && (
            <span className="multiselect-placeholder">{placeholder}</span>
          )}
          {selectedOptions.map((o) => (
            <span key={o.id} className="chip" data-inactive={o.disabled ? "true" : undefined}>
              {o.label}
              {showInactiveHint && o.disabled ? " (inactive)" : ""}
              <button
                type="button"
                className="chip-remove"
                aria-label={`Remove ${o.label}`}
                onClick={(e) => {
                  e.stopPropagation();
                  toggle(o.id);
                }}
                disabled={disabled}
              >
                ×
              </button>
            </span>
          ))}
        </div>
        <input
          ref={inputRef}
          id={id}
          type="text"
          className="multiselect-input"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setOpen(false);
              (e.target as HTMLInputElement).blur();
            }
          }}
          disabled={disabled}
          aria-autocomplete="list"
        />
        <button
          type="button"
          className="multiselect-toggle"
          aria-label="Toggle options"
          onClick={(e) => {
            e.stopPropagation();
            setOpen((v) => !v);
            inputRef.current?.focus();
          }}
          disabled={disabled}
        >
          ▾
        </button>
      </div>
      {open && (
        <div className="multiselect-panel" role="listbox">
          {filtered.length === 0 ? (
            <div className="multiselect-empty">{emptyMessage}</div>
          ) : (
            filtered.map((o) => {
              const selected = value.includes(o.id);
              return (
                <button
                  type="button"
                  key={o.id}
                  role="option"
                  aria-selected={selected}
                  className="multiselect-option"
                  data-selected={selected ? "true" : undefined}
                  disabled={o.disabled}
                  onClick={(e) => {
                    e.preventDefault();
                    if (o.disabled) return;
                    toggle(o.id);
                  }}
                >
                  <span className="multiselect-option-label">{o.label}</span>
                  {selected && <span className="multiselect-option-check">✓</span>}
                  {o.disabled && showInactiveHint && (
                    <span className="multiselect-option-hint">inactive</span>
                  )}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
