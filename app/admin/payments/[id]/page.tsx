import { createAdminSupabase } from "@/lib/supabase/admin";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExpectedAmountForm, AddPaymentForm, DeletePaymentButton } from "./forms";

export default async function PaymentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = createAdminSupabase();

  const { data: family, error } = await supabase
    .from("families")
    .select("id, registrant_name, email, phone, country_code, expected_amount, payment_currency")
    .eq("id", id)
    .single();

  if (error || !family) notFound();

  const { data: payments } = await supabase
    .from("payments")
    .select("*")
    .eq("family_id", id)
    .order("received_on", { ascending: false, nullsFirst: false })
    .order("recorded_at", { ascending: false });

  const expected = Number(family.expected_amount || 0);
  const received = (payments || []).reduce(
    (s, p: { amount: number }) => s + Number(p.amount),
    0
  );
  const balance = expected - received;
  const status =
    received <= 0
      ? "pending"
      : expected > 0 && received >= expected
        ? "paid"
        : "partial";

  return (
    <div className="space-y-6 max-w-3xl">
      <Link href="/admin/payments" className="text-sm text-zinc-600 hover:text-zinc-900">
        ← Back to payments
      </Link>

      <div className="bg-white border border-zinc-200 rounded-lg p-6">
        <h1 className="text-2xl font-semibold text-zinc-900">{family.registrant_name}</h1>
        <p className="text-sm text-zinc-600 mt-1">
          {family.email} · {family.country_code} {family.phone}
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Stat label="Expected" value={fmt(expected)} />
        <Stat label="Received" value={fmt(received)} />
        <Stat
          label="Balance"
          value={fmt(balance)}
          highlight={balance > 0 && expected > 0}
        />
        <Stat label="Status" value={status} capitalize />
      </div>

      <div className="bg-white border border-zinc-200 rounded-lg p-6">
        <h2 className="text-sm font-semibold text-zinc-900 uppercase tracking-wide mb-4">
          Expected amount
        </h2>
        <ExpectedAmountForm
          familyId={id}
          initialAmount={family.expected_amount}
        />
      </div>

      <div className="bg-white border border-zinc-200 rounded-lg p-6">
        <h2 className="text-sm font-semibold text-zinc-900 uppercase tracking-wide mb-4">
          Payment history
        </h2>
        {payments && payments.length > 0 ? (
          <table className="w-full text-sm">
            <thead className="text-zinc-600 text-left">
              <tr>
                <th className="py-2 font-medium text-xs uppercase tracking-wide">Date</th>
                <th className="py-2 font-medium text-xs uppercase tracking-wide">Amount</th>
                <th className="py-2 font-medium text-xs uppercase tracking-wide">Mode</th>
                <th className="py-2 font-medium text-xs uppercase tracking-wide">Notes</th>
                <th className="py-2"></th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id} className="border-t border-zinc-100">
                  <td className="py-2.5">{p.received_on || "—"}</td>
                  <td className="py-2.5 font-medium">{fmt(Number(p.amount))}</td>
                  <td className="py-2.5 capitalize">{(p.mode || "—").replace("_", " ")}</td>
                  <td className="py-2.5 text-zinc-600">{p.notes || "—"}</td>
                  <td className="py-2.5 text-right">
                    <DeletePaymentButton paymentId={p.id} familyId={id} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-sm text-zinc-500">No payments recorded yet.</p>
        )}
      </div>

      <div className="bg-white border border-zinc-200 rounded-lg p-6">
        <h2 className="text-sm font-semibold text-zinc-900 uppercase tracking-wide mb-4">
          Record a new payment
        </h2>
        <AddPaymentForm familyId={id} />
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  highlight,
  capitalize,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  capitalize?: boolean;
}) {
  return (
    <div
      className={`bg-white border rounded-lg p-4 ${highlight ? "border-amber-300" : "border-zinc-200"}`}
    >
      <div className="text-xs text-zinc-500 uppercase tracking-wide">{label}</div>
      <div
        className={`text-xl font-semibold mt-1 ${
          highlight ? "text-amber-700" : "text-zinc-900"
        } ${capitalize ? "capitalize" : ""}`}
      >
        {value}
      </div>
    </div>
  );
}

function fmt(n: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}
