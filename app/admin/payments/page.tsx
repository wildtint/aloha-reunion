import { createAdminSupabase } from "@/lib/supabase/admin";
import Link from "next/link";

type Family = {
  id: string;
  registrant_name: string;
  email: string;
  expected_amount: number | null;
  payment_currency: string;
};

type Payment = {
  family_id: string;
  amount: number;
};

export default async function PaymentsPage() {
  const supabase = createAdminSupabase();

  const { data: families } = await supabase
    .from("families")
    .select("id, registrant_name, email, expected_amount, payment_currency")
    .order("registrant_name", { ascending: true })
    .returns<Family[]>();

  const { data: payments } = await supabase
    .from("payments")
    .select("family_id, amount")
    .returns<Payment[]>();

  const receivedByFamily = new Map<string, number>();
  (payments || []).forEach((p) => {
    receivedByFamily.set(
      p.family_id,
      (receivedByFamily.get(p.family_id) || 0) + Number(p.amount)
    );
  });

  const list = families || [];
  let totalExpected = 0;
  let totalReceived = 0;
  let paidCount = 0;
  let partialCount = 0;
  let pendingCount = 0;

  list.forEach((f) => {
    const expected = Number(f.expected_amount || 0);
    const received = receivedByFamily.get(f.id) || 0;
    totalExpected += expected;
    totalReceived += received;
    const status = computeStatus(expected, received);
    if (status === "paid") paidCount++;
    else if (status === "partial") partialCount++;
    else pendingCount++;
  });
  const outstanding = totalExpected - totalReceived;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">Payments</h1>
        <p className="text-sm text-zinc-500 mt-1">
          Track expected and received payments per family. Set an expected
          amount, then log payments as they come in.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <Stat label="Expected" value={fmt(totalExpected)} />
        <Stat label="Received" value={fmt(totalReceived)} />
        <Stat
          label="Outstanding"
          value={fmt(outstanding)}
          highlight={outstanding > 0}
        />
        <Stat label="Paid" value={paidCount.toString()} />
        <Stat label="Pending / partial" value={(pendingCount + partialCount).toString()} />
      </div>

      <div className="bg-white border border-zinc-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 text-zinc-600 text-left">
              <tr>
                <Th>Family</Th>
                <Th>Expected</Th>
                <Th>Received</Th>
                <Th>Balance</Th>
                <Th>Status</Th>
                <Th></Th>
              </tr>
            </thead>
            <tbody>
              {list.map((f) => {
                const expected = Number(f.expected_amount || 0);
                const received = receivedByFamily.get(f.id) || 0;
                const balance = expected - received;
                const status = computeStatus(expected, received);
                return (
                  <tr key={f.id} className="border-t border-zinc-100 hover:bg-zinc-50">
                    <Td>
                      <div className="font-medium text-zinc-900">{f.registrant_name}</div>
                      <div className="text-xs text-zinc-500">{f.email}</div>
                    </Td>
                    <Td>{f.expected_amount ? fmt(expected) : <span className="text-zinc-400">—</span>}</Td>
                    <Td>{received > 0 ? fmt(received) : <span className="text-zinc-400">—</span>}</Td>
                    <Td className={balance > 0 ? "text-amber-700" : "text-zinc-700"}>
                      {expected > 0 ? fmt(balance) : <span className="text-zinc-400">—</span>}
                    </Td>
                    <Td><StatusBadge status={status} /></Td>
                    <Td>
                      <Link
                        href={`/admin/payments/${f.id}`}
                        className="text-blue-700 hover:underline text-sm"
                      >
                        Manage →
                      </Link>
                    </Td>
                  </tr>
                );
              })}
              {list.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center text-zinc-500 py-8">
                    No registrations yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function computeStatus(expected: number, received: number): "pending" | "partial" | "paid" {
  if (expected <= 0 && received <= 0) return "pending";
  if (received <= 0) return "pending";
  if (received >= expected && expected > 0) return "paid";
  return "partial";
}

function StatusBadge({ status }: { status: "pending" | "partial" | "paid" }) {
  const styles = {
    pending: "bg-zinc-100 text-zinc-700",
    partial: "bg-amber-100 text-amber-800",
    paid: "bg-green-100 text-green-800",
  };
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded capitalize ${styles[status]}`}>
      {status}
    </span>
  );
}

function Stat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`bg-white border rounded-lg p-4 ${highlight ? "border-amber-300" : "border-zinc-200"}`}
    >
      <div className="text-xs text-zinc-500 uppercase tracking-wide">{label}</div>
      <div className={`text-xl font-semibold mt-1 ${highlight ? "text-amber-700" : "text-zinc-900"}`}>
        {value}
      </div>
    </div>
  );
}

function Th({ children }: { children?: React.ReactNode }) {
  return <th className="px-3 py-2 font-medium text-xs uppercase tracking-wide">{children}</th>;
}

function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-3 py-3 align-top ${className}`}>{children}</td>;
}

function fmt(n: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}
