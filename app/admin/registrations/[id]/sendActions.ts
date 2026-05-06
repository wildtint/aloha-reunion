"use server";

import { createAdminSupabase } from "@/lib/supabase/admin";
import { sendEditLinkEmail } from "@/lib/email";
import { headers } from "next/headers";

export async function sendEditLinkEmailAction(familyId: string) {
  const supabase = createAdminSupabase();
  const { data: family, error } = await supabase
    .from("families")
    .select("email, registrant_name, edit_token")
    .eq("id", familyId)
    .single();

  if (error || !family) {
    return { ok: false, error: "Family not found" };
  }

  const h = await headers();
  const host = h.get("host");

  const result = await sendEditLinkEmail({
    to: family.email,
    name: family.registrant_name,
    editToken: family.edit_token,
    host,
  });

  return result;
}
