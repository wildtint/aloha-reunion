import { createAdminSupabase } from "@/lib/supabase/admin";
import { buildCsv } from "@/lib/csv";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = createAdminSupabase();

  const { data: families } = await supabase
    .from("families")
    .select("id, registrant_name, email");
  const familyById = new Map<string, { name: string; email: string }>();
  (families || []).forEach((f) =>
    familyById.set(f.id, { name: f.registrant_name, email: f.email })
  );

  const { data: payments, error } = await supabase
    .from("payments")
    .select("*")
    .order("received_on", { ascending: true, nullsFirst: false });

  if (error) {
    return new Response(`Error: ${error.message}`, { status: 500 });
  }

  const headers = [
    "family_registrant",
    "family_email",
    "amount",
    "currency",
    "mode",
    "status",
    "received_on",
    "notes",
    "recorded_at",
  ];

  const rows = (payments || []).map((p) => {
    const fam = familyById.get(p.family_id);
    return [
      fam?.name || "",
      fam?.email || "",
      p.amount,
      p.currency || "INR",
      p.mode || "",
      p.status || "",
      p.received_on || "",
      p.notes || "",
      p.recorded_at,
    ];
  });

  const csv = buildCsv(headers, rows);
  const today = new Date().toISOString().slice(0, 10);

  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="aloha-payments-${today}.csv"`,
    },
  });
}
