"use client";

// Small shared pieces: evidence badges, form fields, person labels, dialogs.

import Link from "next/link";
import { useEffect, useId, useRef } from "react";
import { LEVEL_INFO, LEVELS } from "../../lib/family/evidence";
import { displayYear } from "../../lib/family/dates";
import { activeFacts, displayName } from "../../lib/family/names";
import { isLiving, privateLabel } from "../../lib/family/living";
import type { EvidenceLevel, FamilyData, Id } from "../../lib/family/types";

export function EvidenceBadge({ level, title }: { level: EvidenceLevel; title?: string }) {
  const info = LEVEL_INFO[level];
  return (
    <span className={`w-badge w-lv-${level}`} title={title ?? info.explain}>
      <span className="w-badge-icon" aria-hidden="true">
        {info.icon}
      </span>
      {info.label}
    </span>
  );
}

export function EvidenceKey({ compact = false }: { compact?: boolean }) {
  return (
    <div className="w-key">
      {LEVELS.map((l) => (
        <div key={l} className={compact ? "w-row" : ""}>
          <EvidenceBadge level={l} />
          {!compact ? <p className="w-small w-muted" style={{ margin: "6px 0 0" }}>{LEVEL_INFO[l].explain}</p> : null}
        </div>
      ))}
    </div>
  );
}

/** "1861–1934", "c.1918–", or "" */
export function lifeSpan(data: FamilyData, id: Id): string {
  const facts = activeFacts(data, id);
  const pickDate = (types: string[]) => {
    const fs = facts.filter((f) => types.includes(f.type) && f.date?.y !== undefined);
    return (fs.find((f) => f.preferred) ?? fs[0])?.date;
  };
  const b = displayYear(pickDate(["birth", "baptism"]));
  const d = displayYear(pickDate(["death", "burial"]));
  if (!b && !d) return "";
  return `${b || "?"}–${d}`;
}

/** The name to show in lists: living people keep their name in their own tree. */
export function nameFor(data: FamilyData, id: Id, opts: { privateLiving?: boolean } = {}): string {
  if (opts.privateLiving && isLiving(data, id)) return privateLabel(data, id);
  return displayName(data, id);
}

export function PersonLink({ data, id, className }: { data: FamilyData; id: Id; className?: string }) {
  return (
    <Link href={`/person/${id}`} className={className ?? "w-link"}>
      {displayName(data, id)}
    </Link>
  );
}

export function TextField(props: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  help?: string;
  type?: string;
  autoComplete?: string;
  inputMode?: "text" | "numeric" | "url";
  required?: boolean;
  autoFocus?: boolean;
  maxLength?: number;
}) {
  const id = useId();
  return (
    <div className="w-field">
      <label className="w-label" htmlFor={id}>
        {props.label}
      </label>
      <input
        id={id}
        className="w-input"
        type={props.type ?? "text"}
        value={props.value}
        placeholder={props.placeholder}
        autoComplete={props.autoComplete ?? "off"}
        inputMode={props.inputMode}
        required={props.required}
        autoFocus={props.autoFocus}
        maxLength={props.maxLength ?? 500}
        onChange={(e) => props.onChange(e.target.value)}
        aria-describedby={props.help ? `${id}-h` : undefined}
      />
      {props.help ? (
        <span id={`${id}-h`} className="w-help">
          {props.help}
        </span>
      ) : null}
    </div>
  );
}

export function TextArea(props: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; help?: string; rows?: number; maxLength?: number }) {
  const id = useId();
  return (
    <div className="w-field">
      <label className="w-label" htmlFor={id}>
        {props.label}
      </label>
      <textarea id={id} className="w-textarea" rows={props.rows ?? 3} value={props.value} placeholder={props.placeholder} maxLength={props.maxLength ?? 5000} onChange={(e) => props.onChange(e.target.value)} />
      {props.help ? <span className="w-help">{props.help}</span> : null}
    </div>
  );
}

export function SelectField<T extends string>(props: { label: string; value: T; onChange: (v: T) => void; options: { value: T; label: string }[]; help?: string }) {
  const id = useId();
  return (
    <div className="w-field">
      <label className="w-label" htmlFor={id}>
        {props.label}
      </label>
      <select id={id} className="w-select" value={props.value} onChange={(e) => props.onChange(e.target.value as T)}>
        {props.options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {props.help ? <span className="w-help">{props.help}</span> : null}
    </div>
  );
}

export function Choices<T extends string>(props: { legend: string; value: T; onChange: (v: T) => void; options: { value: T; label: string; help?: string }[] }) {
  const name = useId();
  return (
    <fieldset style={{ border: 0, padding: 0, margin: 0 }} className="w-fields">
      <legend className="w-label" style={{ marginBottom: 8 }}>
        {props.legend}
      </legend>
      {props.options.map((o) => (
        <label key={o.value} className="w-choice">
          <input type="radio" name={name} value={o.value} checked={props.value === o.value} onChange={() => props.onChange(o.value)} />
          <span>
            <span style={{ fontWeight: 700 }}>{o.label}</span>
            {o.help ? <span className="w-help" style={{ display: "block", marginTop: 2 }}>{o.help}</span> : null}
          </span>
        </label>
      ))}
    </fieldset>
  );
}

/** A real <dialog>: focus is trapped and Escape closes it. */
export function Dialog({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog ref={ref} className="w-dialog" aria-labelledby={titleId} onClose={onClose} onCancel={onClose}>
      {open ? (
        <div className="w-dialog-in">
          <div className="w-between" style={{ marginBottom: 12 }}>
            <h2 id={titleId} className="w-h3" style={{ margin: 0, fontSize: "1.15rem" }}>
              {title}
            </h2>
            <button type="button" className="w-btn w-btn-quiet w-btn-small" onClick={onClose} aria-label="Close">
              ✕
            </button>
          </div>
          {children}
        </div>
      ) : null}
    </dialog>
  );
}

export function Loading() {
  return (
    <main className="w-page" aria-busy="true">
      <p className="w-muted">Opening your family…</p>
    </main>
  );
}

export const FACT_LABEL: Record<string, string> = {
  name: "Name",
  birth: "Birth",
  baptism: "Baptism",
  death: "Death",
  burial: "Burial",
  marriage: "Marriage",
  divorce: "Divorce",
  residence: "Lived in",
  immigration: "Arrived",
  emigration: "Left",
  naturalization: "Citizenship",
  military: "Military service",
  occupation: "Occupation",
  education: "Education",
  religion: "Religion",
  memory: "Family memory",
  other: "Other",
};

export function download(name: string, text: string | Blob, type = "text/plain") {
  const blob = typeof text === "string" ? new Blob([text], { type: `${type};charset=utf-8` }) : text;
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function safeFileName(s: string): string {
  return s.replace(/[^\w\- ]+/g, "").trim().replace(/\s+/g, "-").slice(0, 60) || "family";
}
