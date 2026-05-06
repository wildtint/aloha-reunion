import { createAdminSupabase } from "@/lib/supabase/admin";
import { buildCsv } from "@/lib/csv";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = createAdminSupabase();

  const { data: families, error } = await supabase
    .from("families")
    .select("*")
    .order("registrant_name", { ascending: true });

  if (error) {
    return new Response(`Error: ${error.message}`, { status: 500 });
  }

  const { data: members } = await supabase
    .from("members")
    .select("*")
    .order("created_at", { ascending: true });

  const membersByFamily = new Map<string, typeof members>();
  (members || []).forEach((m) => {
    const arr = membersByFamily.get(m.family_id) || [];
    arr.push(m);
    membersByFamily.set(m.family_id, arr);
  });

  const { data: payments } = await supabase.from("payments").select("*");
  const paymentsByFamily = new Map<string, number>();
  (payments || []).forEach((p) => {
    paymentsByFamily.set(
      p.family_id,
      (paymentsByFamily.get(p.family_id) || 0) + Number(p.amount)
    );
  });

  const headers = [
    "registrant_name",
    "email",
    "country_code",
    "phone",
    "city",
    "residence_country",
    "id_type",
    "id_number",
    "passport_country",
    "arrival_date",
    "arrival_time",
    "arrival_mode",
    "departure_date",
    "departure_time",
    "departure_mode",
    "needs_pickup",
    "pickup_point",
    "pickup_point_other",
    "pickup_flight_or_train",
    "pickup_location",
    "lunch_17_jul",
    "lunch_17_jul_pax",
    "lunch_19_jul",
    "lunch_19_jul_pax",
    "trek_18_jul",
    "trek_18_jul_pax",
    "boat_18_jul",
    "boat_18_jul_pax",
    "driver_accommodation_needed",
    "primary_meal_pref",
    "primary_allergies",
    "members",
    "family_size",
    "expected_amount_inr",
    "received_amount_inr",
    "payment_status",
    "printed_count",
    "printed_at",
    "notes",
    "submitted_at",
    "last_edited_at",
  ];

  const rows = (families || []).map((f) => {
    const mem = membersByFamily.get(f.id) || [];
    const memDescriptions = mem.map((m) => {
      const parts = [m.name, m.member_type];
      if (m.age) parts.push(`age ${m.age}`);
      if (m.meal_pref) parts.push(m.meal_pref);
      if (m.allergies) parts.push(`allergies: ${m.allergies}`);
      return parts.join(" / ");
    });
    const expected = Number(f.expected_amount || 0);
    const received = paymentsByFamily.get(f.id) || 0;
    const status =
      received <= 0
        ? "pending"
        : expected > 0 && received >= expected
          ? "paid"
          : "partial";

    return [
      f.registrant_name,
      f.email,
      f.country_code,
      f.phone,
      f.city || "",
      f.residence_country,
      f.id_type,
      f.id_number,
      f.passport_country || "",
      f.arrival_date,
      f.arrival_time,
      f.arrival_mode || "",
      f.departure_date,
      f.departure_time,
      f.departure_mode || "",
      f.needs_pickup ? "yes" : "no",
      f.pickup_point || "",
      f.pickup_point_other || "",
      f.arrival_ref || "",
      f.arrival_location || "",
      f.lunch_jul17 ? "yes" : "no",
      f.lunch_jul17_pax || 0,
      f.lunch_jul19 ? "yes" : "no",
      f.lunch_jul19_pax || 0,
      f.trek_jul18 ? "yes" : "no",
      f.trek_jul18_pax || 0,
      f.boat_jul18 ? "yes" : "no",
      f.boat_jul18_pax || 0,
      f.driver_accommodation_needed ? "yes" : "no",
      f.primary_meal_pref || "",
      f.primary_allergies || "",
      memDescriptions.join("; "),
      1 + mem.length,
      expected || "",
      received || "",
      status,
      f.printed_count || 0,
      f.printed_at || "",
      f.notes || "",
      f.submitted_at,
      f.last_edited_at || "",
    ];
  });

  const csv = buildCsv(headers, rows);
  const today = new Date().toISOString().slice(0, 10);

  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="aloha-registrations-${today}.csv"`,
    },
  });
}
