"use server";

import { createAdminSupabase } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export async function setExpectedAmount(familyId: string, formData: FormData) {
  const amountStr = (formData.get("expected_amount") as string)?.trim();
  const amount = amountStr === "" ? null : Number(amountStr);

  if (amount !== null && (isNaN(amount) || amount < 0)) {
    return { ok: false, error: "Invalid amount" };
  }

  const supabase = createAdminSupabase();
  const { error } = await supabase
    .from("families")
    .update({ expected_amount: amount })
    .eq("id", familyId);

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/admin/payments/${familyId}`);
  revalidatePath("/admin/payments");
  return { ok: true };
}

export async function addPayment(familyId: string, formData: FormData) {
  const amount = Number(formData.get("amount"));
  const mode = (formData.get("mode") as string) || null;
  const received_on = (formData.get("received_on") as string) || null;
  const notes = (formData.get("notes") as string) || null;

  if (!amount || isNaN(amount) || amount <= 0) {
    return { ok: false, error: "Amount must be greater than 0" };
  }

  const supabase = createAdminSupabase();
  const { error } = await supabase.from("payments").insert({
    family_id: familyId,
    amount,
    mode,
    received_on,
    notes,
    status: "paid",
  });

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/admin/payments/${familyId}`);
  revalidatePath("/admin/payments");
  return { ok: true };
}

export async function deletePayment(paymentId: string, familyId: string) {
  const supabase = createAdminSupabase();
  const { error } = await supabase.from("payments").delete().eq("id", paymentId);

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/admin/payments/${familyId}`);
  revalidatePath("/admin/payments");
  return { ok: true };
}
