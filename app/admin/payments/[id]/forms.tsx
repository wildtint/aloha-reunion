"use client";

import { useState } from "react";
import { setExpectedAmount, addPayment, deletePayment } from "./actions";

const inputCls =
  "rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900";

export function ExpectedAmountForm({
  familyId,
  initialAmount,
}: {
  familyId: string;
  initialAmount: number | null;
}) {
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function onSubmit(formData: FormData) {
    setSaving(true);
    setMsg(null);
    const result = await setExpectedAmount(familyId, formData);
    setSaving(false);
    setMsg(result.ok ? "Saved." : `Error: ${result.error}`);
  }

  return (
    <form action={onSubmit} className="flex items-end gap-3 flex-wrap">
      <label className="flex-1 min-w-[180px]">
        <span className="block text-sm text-zinc-700 mb-1">
          Expected amount (₹)
        </span>
        <input
          name="expected_amount"
          type="number"
          step="1"
          min="0"
          defaultValue={initialAmount ?? ""}
          placeholder="e.g. 25000"
          className={`${inputCls} w-full`}
        />
      </label>
      <button
        type="submit"
        disabled={saving}
        className="bg-zinc-900 hover:bg-zinc-700 disabled:bg-zinc-400 text-white text-sm font-medium px-4 py-2 rounded-md"
      >
        {saving ? "Saving..." : "Save"}
      </button>
      {msg && (
        <span className={`text-sm ${msg.startsWith("Error") ? "text-red-700" : "text-green-700"}`}>
          {msg}
        </span>
      )}
    </form>
  );
}

export function AddPaymentForm({ familyId }: { familyId: string }) {
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function onSubmit(formData: FormData) {
    setSaving(true);
    setMsg(null);
    const result = await addPayment(familyId, formData);
    setSaving(false);
    if (result.ok) {
      setMsg("Payment recorded.");
      // Reset the form
      (document.getElementById(`add-pay-${familyId}`) as HTMLFormElement)?.reset();
    } else {
      setMsg(`Error: ${result.error}`);
    }
  }

  return (
    <form
      id={`add-pay-${familyId}`}
      action={onSubmit}
      className="grid grid-cols-1 sm:grid-cols-2 gap-3"
    >
      <label>
        <span className="block text-sm text-zinc-700 mb-1">Amount (₹) *</span>
        <input
          name="amount"
          type="number"
          step="1"
          min="1"
          required
          className={`${inputCls} w-full`}
        />
      </label>
      <label>
        <span className="block text-sm text-zinc-700 mb-1">Mode</span>
        <select name="mode" className={`${inputCls} w-full`} defaultValue="">
          <option value="">Select...</option>
          <option value="upi">UPI</option>
          <option value="bank_transfer">Bank transfer</option>
          <option value="cash">Cash</option>
          <option value="cheque">Cheque</option>
          <option value="other">Other</option>
        </select>
      </label>
      <label>
        <span className="block text-sm text-zinc-700 mb-1">Received on</span>
        <input
          name="received_on"
          type="date"
          defaultValue={new Date().toISOString().slice(0, 10)}
          className={`${inputCls} w-full`}
        />
      </label>
      <label className="sm:col-span-2">
        <span className="block text-sm text-zinc-700 mb-1">Notes</span>
        <input
          name="notes"
          placeholder="Reference number, comments, etc."
          className={`${inputCls} w-full`}
        />
      </label>
      <div className="sm:col-span-2 flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="bg-zinc-900 hover:bg-zinc-700 disabled:bg-zinc-400 text-white text-sm font-medium px-4 py-2 rounded-md"
        >
          {saving ? "Saving..." : "Add payment"}
        </button>
        {msg && (
          <span
            className={`text-sm ${msg.startsWith("Error") ? "text-red-700" : "text-green-700"}`}
          >
            {msg}
          </span>
        )}
      </div>
    </form>
  );
}

export function DeletePaymentButton({
  paymentId,
  familyId,
}: {
  paymentId: string;
  familyId: string;
}) {
  const [deleting, setDeleting] = useState(false);

  async function onDelete() {
    if (!confirm("Delete this payment record? This cannot be undone.")) return;
    setDeleting(true);
    const result = await deletePayment(paymentId, familyId);
    if (!result.ok) {
      alert(`Error: ${result.error}`);
      setDeleting(false);
    }
  }

  return (
    <button
      onClick={onDelete}
      disabled={deleting}
      className="text-red-600 hover:text-red-700 text-xs disabled:opacity-50"
    >
      {deleting ? "..." : "Delete"}
    </button>
  );
}
