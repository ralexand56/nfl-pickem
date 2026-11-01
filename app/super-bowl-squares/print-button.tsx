"use client";

export default function PrintGridButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-control bg-brand-800 px-5 py-2.5 font-semibold text-white hover:bg-brand-900"
    >
      Print the grid
    </button>
  );
}
