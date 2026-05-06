import { createAdminSupabase } from "@/lib/supabase/admin";

export async function fetchIdDocAsDataUrl(
  path: string,
  supabase: ReturnType<typeof createAdminSupabase>
): Promise<string | null> {
  try {
    const { data, error } = await supabase.storage
      .from("id-documents")
      .download(path);
    if (error || !data) return null;
    const buf = Buffer.from(await data.arrayBuffer());
    const ext = path.split(".").pop()?.toLowerCase() || "";
    const mime =
      ext === "png"
        ? "image/png"
        : ext === "webp"
          ? "image/webp"
          : ext === "pdf"
            ? "application/pdf"
            : "image/jpeg";
    return `data:${mime};base64,${buf.toString("base64")}`;
  } catch {
    return null;
  }
}
