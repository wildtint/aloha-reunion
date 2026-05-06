import { createAdminSupabase } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import EditFormClient from "./EditFormClient";

export const dynamic = "force-dynamic";

export default async function EditPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = createAdminSupabase();

  const { data: family, error } = await supabase
    .from("families")
    .select("*")
    .eq("edit_token", token)
    .single();

  if (error || !family) notFound();

  const { data: members } = await supabase
    .from("members")
    .select("*")
    .eq("family_id", family.id)
    .order("created_at", { ascending: true });

  const initial = {
    registrant_name: family.registrant_name || "",
    email: family.email || "",
    phone: family.phone || "",
    country_code: family.country_code || "+91",
    city: family.city || "",
    residence_country: family.residence_country || "India",
    primary_meal_pref: family.primary_meal_pref || "",
    primary_allergies: family.primary_allergies || "",

    id_type: (family.id_type || "aadhaar") as "aadhaar" | "passport",
    id_number: family.id_number || "",
    passport_country: family.passport_country || "",
    has_existing_id_document: !!family.id_document_path,

    arrival_date: family.arrival_date || "2026-07-17",
    arrival_time: family.arrival_time?.slice(0, 5) || "",
    arrival_mode: family.arrival_mode || "",
    departure_date: family.departure_date || "2026-07-19",
    departure_time: family.departure_time?.slice(0, 5) || "",
    departure_mode: family.departure_mode || "",

    needs_pickup: !!family.needs_pickup,
    pickup_point: family.pickup_point || "",
    pickup_point_other: family.pickup_point_other || "",
    arrival_ref: family.arrival_ref || "",
    arrival_location: family.arrival_location || "",

    lunch_jul17: !!family.lunch_jul17,
    lunch_jul17_pax: family.lunch_jul17_pax || 0,
    lunch_jul19: !!family.lunch_jul19,
    lunch_jul19_pax: family.lunch_jul19_pax || 0,
    trek_jul18: !!family.trek_jul18,
    trek_jul18_pax: family.trek_jul18_pax || 0,
    boat_jul18: !!family.boat_jul18,
    boat_jul18_pax: family.boat_jul18_pax || 0,

    driver_accommodation_needed: !!family.driver_accommodation_needed,
    notes: family.notes || "",

    members: (members || []).map((m) => ({
      type: m.member_type as "spouse" | "child",
      name: m.name || "",
      age: m.age?.toString() || "",
      meal: m.meal_pref || "",
      allergies: m.allergies || "",
    })),
  };

  return <EditFormClient token={token} initial={initial} />;
}
