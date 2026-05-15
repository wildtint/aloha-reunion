"use server";

import { createAdminSupabase } from "@/lib/supabase/admin";
import { sendConfirmationEmail } from "@/lib/email";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

type Member = {
  member_type: "spouse" | "child";
  name: string;
  age: number | null;
  meal_pref: string | null;
  allergies: string | null;
  id_document_path: string | null;
  id_document_back_path: string | null;
  visa_document_path: string | null;
};

function getPath(formData: FormData, key: string): string | null {
  // Files are now uploaded directly from the browser to Supabase Storage
  // (bypassing Vercel's 4.5 MB request-body limit). The browser sends the
  // resulting storage path back to us in `${key}_path`.
  const v = formData.get(`${key}_path`);
  return typeof v === "string" && v.trim() !== "" ? v.trim() : null;
}

export async function submitRegistration(formData: FormData) {
  const supabase = createAdminSupabase();

  // Detect international based on residence country
  const residenceCountry = ((formData.get("residence_country") as string) || "India").trim();
  const isInternational =
    residenceCountry !== "" && residenceCountry.toLowerCase() !== "india";

  // Server-side validation backstop — re-check required uploaded paths
  const primaryIdPath = getPath(formData, "id_document");
  if (!primaryIdPath) {
    return { ok: false, error: "ID photo is required for the primary registrant." };
  }
  const primaryIdBackPath = getPath(formData, "id_document_back");
  const primaryVisaPath = isInternational
    ? getPath(formData, "visa_document")
    : null;
  if (isInternational && !primaryVisaPath) {
    return {
      ok: false,
      error:
        "VISA page photo is required when the country of residence is outside India.",
    };
  }
  const memberCount = parseInt((formData.get("member_count") as string) || "0", 10);
  for (let i = 0; i < memberCount; i++) {
    const memberName = (formData.get(`member_${i}_name`) as string)?.trim();
    if (!memberName) continue;
    const memberIdPath = getPath(formData, `member_${i}_id_document`);
    if (!memberIdPath) {
      return { ok: false, error: `ID photo is required for ${memberName}.` };
    }
    if (isInternational) {
      const memberVisaPath = getPath(formData, `member_${i}_visa_document`);
      if (!memberVisaPath) {
        return {
          ok: false,
          error: `VISA page photo is required for ${memberName}.`,
        };
      }
    }
  }

  // Build member records (paths already uploaded client-side)
  const members: Member[] = [];
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
      id_document_path: getPath(formData, `member_${i}_id_document`),
      id_document_back_path: getPath(formData, `member_${i}_id_document_back`),
      visa_document_path: isInternational
        ? getPath(formData, `member_${i}_visa_document`)
        : null,
    });
  }

  const idType = formData.get("id_type") as "aadhaar" | "passport";

  const family = {
    registrant_name: (formData.get("registrant_name") as string).trim(),
    email: (formData.get("email") as string).trim().toLowerCase(),
    phone: (formData.get("phone") as string).trim(),
    country_code: (formData.get("country_code") as string) || "+91",
    city: (formData.get("city") as string) || null,
    residence_country: (formData.get("residence_country") as string) || "India",

    id_type: idType,
    id_number: (formData.get("id_number") as string).trim(),
    passport_country: idType === "passport" ? residenceCountry || null : null,
    id_document_path: primaryIdPath,
    id_document_back_path: primaryIdBackPath,
    visa_document_path: primaryVisaPath,

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

  try {
    const h = await headers();
    const host = h.get("host");
    await sendConfirmationEmail({
      to: family.email,
      name: family.registrant_name,
      editToken: inserted.edit_token,
      host,
    });
  } catch (e) {
    console.error("Confirmation email failed:", e);
  }

  redirect(`/register/thanks?token=${inserted.edit_token}`);
}
