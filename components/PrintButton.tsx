"use client";

// Prints the page; pages mark their printable part with the "printable"
// class and everything else print:hidden (see globals.css).
export default function PrintButton({ label = "Print" }: { label?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-control bg-brand-800 px-5 py-2.5 font-semibold text-white hover:bg-brand-900"
    >
      {label}
    </button>
  );
}
