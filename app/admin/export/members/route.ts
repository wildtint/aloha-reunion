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

  const { data: members, error } = await supabase
    .from("members")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    return new Response(`Error: ${error.message}`, { status: 500 });
  }

  const headers = [
    "family_registrant",
    "family_email",
    "member_name",
    "member_type",
    "age",
    "meal_pref",
    "allergies",
    "has_id_document",
    "has_visa_document",
  ];

  const rows = (members || []).map((m) => {
    const fam = familyById.get(m.family_id);
    return [
      fam?.name || "",
      fam?.email || "",
      m.name,
      m.member_type,
      m.age ?? "",
      m.meal_pref || "",
      m.allergies || "",
      m.id_document_path ? "yes" : "no",
      m.visa_document_path ? "yes" : "no",
    ];
  });

  const csv = buildCsv(headers, rows);
  const today = new Date().toISOString().slice(0, 10);

  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="aloha-members-${today}.csv"`,
    },
  });
}
