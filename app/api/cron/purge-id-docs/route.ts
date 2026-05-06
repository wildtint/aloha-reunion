import { createAdminSupabase } from "@/lib/supabase/admin";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

// 30 days after the event ends (19 Jul 2026 + 30 days)
const PURGE_AFTER_ISO = process.env.PURGE_AFTER_DATE || "2026-08-18T00:00:00Z";

export async function GET(request: NextRequest) {
  // Vercel cron sends `Authorization: Bearer <CRON_SECRET>` automatically.
  // Reject anything else.
  const auth = request.headers.get("authorization");
  const expected = process.env.CRON_SECRET
    ? `Bearer ${process.env.CRON_SECRET}`
    : null;

  if (!expected) {
    return Response.json(
      { ok: false, error: "CRON_SECRET is not configured" },
      { status: 500 }
    );
  }
  if (auth !== expected) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const purgeAfter = new Date(PURGE_AFTER_ISO);
  const now = new Date();

  if (isNaN(purgeAfter.getTime())) {
    return Response.json(
      { ok: false, error: `Invalid PURGE_AFTER_DATE: ${PURGE_AFTER_ISO}` },
      { status: 500 }
    );
  }

  if (now < purgeAfter) {
    return Response.json({
      ok: true,
      status: "skipped",
      reason: "before purge date",
      now: now.toISOString(),
      purge_after: purgeAfter.toISOString(),
    });
  }

  const supabase = createAdminSupabase();

  // Collect every uploaded document path
  const { data: families, error: famErr } = await supabase
    .from("families")
    .select("id, id_document_path, visa_document_path");
  if (famErr) {
    return Response.json({ ok: false, error: famErr.message }, { status: 500 });
  }

  const { data: members, error: memErr } = await supabase
    .from("members")
    .select("id, id_document_path, visa_document_path");
  if (memErr) {
    return Response.json({ ok: false, error: memErr.message }, { status: 500 });
  }

  const paths: string[] = [];
  (families || []).forEach((f) => {
    if (f.id_document_path) paths.push(f.id_document_path);
    if (f.visa_document_path) paths.push(f.visa_document_path);
  });
  (members || []).forEach((m) => {
    if (m.id_document_path) paths.push(m.id_document_path);
    if (m.visa_document_path) paths.push(m.visa_document_path);
  });

  let removedCount = 0;
  if (paths.length > 0) {
    // Supabase remove() accepts up to 1000 paths at a time
    const { error: removeErr } = await supabase.storage
      .from("id-documents")
      .remove(paths);
    if (removeErr) {
      return Response.json(
        { ok: false, error: `Storage remove failed: ${removeErr.message}` },
        { status: 500 }
      );
    }
    removedCount = paths.length;
  }

  // Clear the path columns so the admin UI no longer references them
  await supabase
    .from("families")
    .update({ id_document_path: null, visa_document_path: null })
    .not("id", "is", null);

  await supabase
    .from("members")
    .update({ id_document_path: null, visa_document_path: null })
    .not("id", "is", null);

  return Response.json({
    ok: true,
    status: "purged",
    files_removed: removedCount,
    purge_after: purgeAfter.toISOString(),
    purged_at: now.toISOString(),
  });
}
