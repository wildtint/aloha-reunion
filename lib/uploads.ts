import { createClient } from "@/lib/supabase/client";

export async function uploadDocFromBrowser(file: File): Promise<string> {
  const supabase = createClient();
  const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
  const year = new Date().getFullYear();
  const path = `${year}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from("id-documents")
    .upload(path, file, { contentType: file.type, upsert: false });
  if (error) {
    throw new Error(`Upload of "${file.name}" failed: ${error.message}`);
  }
  return path;
}
