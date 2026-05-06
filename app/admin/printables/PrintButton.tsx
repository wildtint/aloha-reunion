"use client";

export function PrintButton({ label = "Print" }: { label?: string }) {
  return (
    <button
      onClick={() => window.print()}
      className="bg-zinc-900 hover:bg-zinc-700 text-white text-sm font-medium px-4 py-2 rounded-md print:hidden"
    >
      {label}
    </button>
  );
}
