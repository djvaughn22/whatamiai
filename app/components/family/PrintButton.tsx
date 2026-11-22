"use client";

export default function PrintButton({ label, className = "w-btn" }: { label: string; className?: string }) {
  return (
    <button type="button" className={className} onClick={() => window.print()}>
      {label}
    </button>
  );
}
