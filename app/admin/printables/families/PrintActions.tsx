"use client";

import { useState, useTransition } from "react";
import { markPrinted, resetPrinted } from "./actions";

export function MarkPrintedButton({
  familyId,
  printedCount,
}: {
  familyId: string;
  printedCount: number;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      onClick={() =>
        startTransition(async () => {
          await markPrinted(familyId);
        })
      }
      disabled={pending}
      className="text-xs px-2.5 py-1.5 bg-zinc-900 hover:bg-zinc-700 disabled:bg-zinc-400 text-white rounded"
    >
      {pending
        ? "Saving..."
        : printedCount > 0
          ? "Mark printed again"
          : "Mark as printed"}
    </button>
  );
}

export function ResetPrintedButton({ familyId }: { familyId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      onClick={() => {
        if (!confirm("Reset print status for this family?")) return;
        startTransition(async () => {
          await resetPrinted(familyId);
        });
      }}
      disabled={pending}
      className="text-xs text-zinc-500 hover:text-zinc-900 underline disabled:opacity-50"
    >
      Reset
    </button>
  );
}

export function PrintAndMarkButton({ familyId }: { familyId: string }) {
  const [pending, setPending] = useState(false);

  async function handle() {
    setPending(true);
    window.print();
    await markPrinted(familyId);
    setPending(false);
  }

  return (
    <button
      onClick={handle}
      disabled={pending}
      className="bg-zinc-900 hover:bg-zinc-700 disabled:bg-zinc-400 text-white text-sm font-medium px-4 py-2 rounded-md print:hidden"
    >
      {pending ? "Working..." : "Print & mark as printed"}
    </button>
  );
}
