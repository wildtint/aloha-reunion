"use server";

import { createAdminSupabase } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";

type Member = {
  member_type: "spouse" | "child";
  name: string;
  age: number | null;
  meal_pref: string | null;
  allergies: string | null;
};

export async function submitRegistration(formData: FormData) {
  const supabase = createAdminSupabase();

  // Extract members (repeatable)
  const members: Member[] = [];
  const memberCount = parseInt((formData.get("member_count") as string) || "0", 10);
  for (let i = 0; i < memberCount; i++) {
    const name = (formData.get(`member_${i}_name`) as string)?.trim();
    if (!name) continue;
    members.push({
      member_type: formData.get(`member_${i}_type`) as "spouse" | "child",
      name,
      age: formData.get(`member_${i}_age`)
        ? parseInt(formData.get(`member_${i}_age`) as string, 10)
        : null,
      meal_pref: (formData.get(`member_${i}_meal`) as string) || null,
      allergies: (formData.get(`member_${i}_allergies`) as string) || null,
    });
  }

  // Handle ID document upload
  let id_document_path: string | null = null;
  const idFile = formData.get("id_document") as File | null;
  if (idFile && idFile.size > 0) {
    const ext = idFile.name.split(".").pop()?.toLowerCase() || "bin";
    const random = crypto.randomUUID();
    const path = `${new Date().getFullYear()}/${random}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("id-documents")
      .upload(path, idFile, { contentType: idFile.type });
    if (uploadError) {
      return { ok: false, error: `ID upload failed: ${uploadError.message}` };
    }
    id_document_path = path;
  }

  // Build family record
  const family = {
    registrant_name: (formData.get("registrant_name") as string).trim(),
    email: (formData.get("email") as string).trim().toLowerCase(),
    phone: (formData.get("phone") as string).trim(),
    country_code: (formData.get("country_code") as string) || "+91",
    city: (formData.get("city") as string) || null,
    residence_country: (formData.get("residence_country") as string) || "India",

    id_type: formData.get("id_type") as "aadhaar" | "passport",
    id_number: (formData.get("id_number") as string).trim(),
    passport_country: (formData.get("passport_country") as string) || null,
    id_document_path,

    arrival_date: formData.get("arrival_date") as string,
    arrival_time: formData.get("arrival_time") as string,
    arrival_mode: (formData.get("arrival_mode") as string) || null,
    arrival_ref: (formData.get("arrival_ref") as string) || null,
    arrival_location: (formData.get("arrival_location") as string) || null,

    departure_date: formData.get("departure_date") as string,
    departure_time: formData.get("departure_time") as string,
    departure_mode: (formData.get("departure_mode") as string) || null,
    departure_ref: (formData.get("departure_ref") as string) || null,
    departure_location: (formData.get("departure_location") as string) || null,

    needs_pickup: formData.get("needs_pickup") === "yes",
    pickup_point: (formData.get("pickup_point") as string) || null,
    pickup_point_other: (formData.get("pickup_point_other") as string) || null,

    lunch_jul17: formData.get("lunch_jul17") === "yes",
    lunch_jul17_pax: parseInt((formData.get("lunch_jul17_pax") as string) || "0", 10),
    lunch_jul19: formData.get("lunch_jul19") === "yes",
    lunch_jul19_pax: parseInt((formData.get("lunch_jul19_pax") as string) || "0", 10),
    trek_jul18: formData.get("trek_jul18") === "yes",
    trek_jul18_pax: parseInt((formData.get("trek_jul18_pax") as string) || "0", 10),
    boat_jul18: formData.get("boat_jul18") === "yes",
    boat_jul18_pax: parseInt((formData.get("boat_jul18_pax") as string) || "0", 10),
    driver_accommodation_needed:
      formData.get("driver_accommodation_needed") === "yes",

    primary_meal_pref: (formData.get("primary_meal_pref") as string) || null,
    primary_allergies: (formData.get("primary_allergies") as string) || null,

    notes: (formData.get("notes") as string) || null,
  };

  const { data: inserted, error } = await supabase
    .from("families")
    .insert(family)
    .select("id, edit_token")
    .single();

  if (error || !inserted) {
    return { ok: false, error: error?.message || "Failed to save registration" };
  }

  if (members.length > 0) {
    const { error: memberError } = await supabase.from("members").insert(
      members.map((m) => ({ ...m, family_id: inserted.id }))
    );
    if (memberError) {
      return { ok: false, error: `Members save failed: ${memberError.message}` };
    }
  }

  redirect(`/register/thanks?token=${inserted.edit_token}`);
}
