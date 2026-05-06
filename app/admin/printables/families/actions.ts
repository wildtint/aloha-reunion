"use server";

import { createAdminSupabase } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export async function markPrinted(familyId: string) {
  const supabase = createAdminSupabase();

  const { data: existing } = await supabase
    .from("families")
    .select("printed_count")
    .eq("id", familyId)
    .single();

  const nextCount = (existing?.printed_count || 0) + 1;

  const { error } = await supabase
    .from("families")
    .update({
      printed_at: new Date().toISOString(),
      printed_count: nextCount,
    })
    .eq("id", familyId);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/printables/families");
  revalidatePath(`/admin/printables/families/${familyId}`);
  return { ok: true };
}

export async function resetPrinted(familyId: string) {
  const supabase = createAdminSupabase();
  const { error } = await supabase
    .from("families")
    .update({ printed_at: null, printed_count: 0 })
    .eq("id", familyId);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/printables/families");
  revalidatePath(`/admin/printables/families/${familyId}`);
  return { ok: true };
}
