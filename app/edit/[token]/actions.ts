"use server";

import { createAdminSupabase } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

// Allow up to 60s for slow mobile uploads (Vercel Hobby caps at 60s)
export const maxDuration = 60;

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

async function uploadIfPresent(
  supabase: ReturnType<typeof createAdminSupabase>,
  file: File | null
): Promise<{ path: string | null; error?: string }> {
  if (!file || file.size === 0) return { path: null };
  const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
  const random = crypto.randomUUID();
  const path = `${new Date().getFullYear()}/${random}.${ext}`;
  const { error } = await supabase.storage
    .from("id-documents")
    .upload(path, file, { contentType: file.type });
  if (error) return { path: null, error: error.message };
  return { path };
}

async function safeRemove(
  supabase: ReturnType<typeof createAdminSupabase>,
  paths: (string | null | undefined)[]
) {
  const real = paths.filter((p): p is string => !!p);
  if (real.length > 0) {
    await supabase.storage.from("id-documents").remove(real);
  }
}

export async function updateRegistration(token: string, formData: FormData) {
  const supabase = createAdminSupabase();

  const { data: existing, error: lookupError } = await supabase
    .from("families")
    .select("id, id_document_path, id_document_back_path, visa_document_path")
    .eq("edit_token", token)
    .single();

  if (lookupError || !existing) {
    return { ok: false, error: "Edit link is invalid or has expired." };
  }

  const familyId = existing.id;

  // Detect international from form data
  const residenceCountry = ((formData.get("residence_country") as string) || "India").trim();
  const isInternational =
    residenceCountry !== "" && residenceCountry.toLowerCase() !== "india";

  // Pull existing members so we can preserve their ID + VISA docs if no replacement uploaded
  const { data: existingMembers } = await supabase
    .from("members")
    .select("id, name, id_document_path, id_document_back_path, visa_document_path")
    .eq("family_id", familyId);
  const existingMemberByName = new Map<
    string,
    {
      id_document_path: string | null;
      id_document_back_path: string | null;
      visa_document_path: string | null;
    }
  >();
  (existingMembers || []).forEach((m) => {
    existingMemberByName.set(m.name.trim().toLowerCase(), {
      id_document_path: m.id_document_path,
      id_document_back_path: m.id_document_back_path,
      visa_document_path: m.visa_document_path,
    });
  });
  const oldMemberDocPaths = (existingMembers || [])
    .flatMap((m) => [m.id_document_path, m.id_document_back_path, m.visa_document_path])
    .filter((p): p is string => !!p);

  // Build new members
  const members: Member[] = [];
  const memberCount = parseInt((formData.get("member_count") as string) || "0", 10);
  const preservedMemberDocs: string[] = [];
  for (let i = 0; i < memberCount; i++) {
    const name = (formData.get(`member_${i}_name`) as string)?.trim();
    if (!name) continue;

    // ID
    const idUpload = await uploadIfPresent(
      supabase,
      formData.get(`member_${i}_id_document`) as File
    );
    if (idUpload.error) {
      return { ok: false, error: `Member ID upload failed: ${idUpload.error}` };
    }
    let idPath: string | null = idUpload.path;
    if (!idPath) {
      const prev = existingMemberByName.get(name.toLowerCase());
      if (prev?.id_document_path) {
        idPath = prev.id_document_path;
        preservedMemberDocs.push(prev.id_document_path);
      }
    }

    // ID back (optional)
    const idBackUpload = await uploadIfPresent(
      supabase,
      formData.get(`member_${i}_id_document_back`) as File
    );
    if (idBackUpload.error) {
      return { ok: false, error: `Member ID back upload failed: ${idBackUpload.error}` };
    }
    let idBackPath: string | null = idBackUpload.path;
    if (!idBackPath) {
      const prev = existingMemberByName.get(name.toLowerCase());
      if (prev?.id_document_back_path) {
        idBackPath = prev.id_document_back_path;
        preservedMemberDocs.push(prev.id_document_back_path);
      }
    }

    // VISA (only if international)
    let visaPath: string | null = null;
    if (isInternational) {
      const visaUpload = await uploadIfPresent(
        supabase,
        formData.get(`member_${i}_visa_document`) as File
      );
      if (visaUpload.error) {
        return { ok: false, error: `Member VISA upload failed: ${visaUpload.error}` };
      }
      visaPath = visaUpload.path;
      if (!visaPath) {
        const prev = existingMemberByName.get(name.toLowerCase());
        if (prev?.visa_document_path) {
          visaPath = prev.visa_document_path;
          preservedMemberDocs.push(prev.visa_document_path);
        }
      }
    }

    members.push({
      member_type: formData.get(`member_${i}_type`) as "spouse" | "child",
      name,
      age: formData.get(`member_${i}_age`)
        ? parseInt(formData.get(`member_${i}_age`) as string, 10)
        : null,
      meal_pref: (formData.get(`member_${i}_meal`) as string) || null,
      allergies: (formData.get(`member_${i}_allergies`) as string) || null,
      id_document_path: idPath,
      id_document_back_path: idBackPath,
      visa_document_path: visaPath,
    });
  }

  // Optional new primary ID document (front)
  let id_document_path = existing.id_document_path as string | null;
  const oldPrimaryPath = id_document_path;
  const idUpload = await uploadIfPresent(
    supabase,
    formData.get("id_document") as File
  );
  if (idUpload.error) {
    return { ok: false, error: `ID upload failed: ${idUpload.error}` };
  }
  if (idUpload.path) {
    id_document_path = idUpload.path;
    if (oldPrimaryPath) await safeRemove(supabase, [oldPrimaryPath]);
  }

  // Optional new primary ID document (back)
  let id_document_back_path = existing.id_document_back_path as string | null;
  const oldPrimaryBackPath = id_document_back_path;
  const idBackUpload = await uploadIfPresent(
    supabase,
    formData.get("id_document_back") as File
  );
  if (idBackUpload.error) {
    return { ok: false, error: `ID back upload failed: ${idBackUpload.error}` };
  }
  if (idBackUpload.path) {
    id_document_back_path = idBackUpload.path;
    if (oldPrimaryBackPath) await safeRemove(supabase, [oldPrimaryBackPath]);
  }

  // Optional new VISA document — based on residence country
  const idType = formData.get("id_type") as "aadhaar" | "passport";
  let visa_document_path = existing.visa_document_path as string | null;
  const oldVisaPath = visa_document_path;
  if (isInternational) {
    const visaUpload = await uploadIfPresent(
      supabase,
      formData.get("visa_document") as File
    );
    if (visaUpload.error) {
      return { ok: false, error: `VISA upload failed: ${visaUpload.error}` };
    }
    if (visaUpload.path) {
      visa_document_path = visaUpload.path;
      if (oldVisaPath) await safeRemove(supabase, [oldVisaPath]);
    }
  } else {
    // Switched to India — drop any existing primary visa doc
    if (oldVisaPath) await safeRemove(supabase, [oldVisaPath]);
    visa_document_path = null;
  }

  const update = {
    registrant_name: (formData.get("registrant_name") as string).trim(),
    email: (formData.get("email") as string).trim().toLowerCase(),
    phone: (formData.get("phone") as string).trim(),
    country_code: (formData.get("country_code") as string) || "+91",
    city: (formData.get("city") as string) || null,
    residence_country: (formData.get("residence_country") as string) || "India",

    id_type: idType,
    id_number: (formData.get("id_number") as string).trim(),
    passport_country: idType === "passport" ? residenceCountry || null : null,
    id_document_path,
    id_document_back_path,
    visa_document_path,

    arrival_date: formData.get("arrival_date") as string,
    arrival_time: formData.get("arrival_time") as string,
    arrival_mode: (formData.get("arrival_mode") as string) || null,
    arrival_ref: (formData.get("arrival_ref") as string) || null,
    arrival_location: (formData.get("arrival_location") as string) || null,

    departure_date: formData.get("departure_date") as string,
    departure_time: formData.get("departure_time") as string,
    departure_mode: (formData.get("departure_mode") as string) || null,

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
    driver_accommodation_needed: formData.get("driver_accommodation_needed") === "yes",

    primary_meal_pref: (formData.get("primary_meal_pref") as string) || null,
    primary_allergies: (formData.get("primary_allergies") as string) || null,

    notes: (formData.get("notes") as string) || null,

    last_edited_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("families")
    .update(update)
    .eq("id", familyId);

  if (error) return { ok: false, error: error.message };

  // Replace members
  await supabase.from("members").delete().eq("family_id", familyId);
  if (members.length > 0) {
    const { error: memberError } = await supabase
      .from("members")
      .insert(members.map((m) => ({ ...m, family_id: familyId })));
    if (memberError) {
      return { ok: false, error: `Members save failed: ${memberError.message}` };
    }
  }

  // Clean up orphan member ID/VISA docs (those not preserved)
  const preserved = new Set(preservedMemberDocs);
  const orphaned = oldMemberDocPaths.filter((p) => !preserved.has(p));
  if (orphaned.length > 0) await safeRemove(supabase, orphaned);

  revalidatePath("/admin");
  revalidatePath(`/admin/registrations/${familyId}`);
  redirect(`/edit/${token}/saved`);
}
