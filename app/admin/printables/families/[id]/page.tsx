import { createAdminSupabase } from "@/lib/supabase/admin";
import { fetchIdDocAsDataUrl } from "@/lib/printables";
import FamilyPrintCard from "../FamilyPrintCard";
import { PrintAndMarkButton } from "../PrintActions";
import { notFound } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function FamilyPrintOne({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = createAdminSupabase();

  const { data: family, error } = await supabase
    .from("families")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !family) notFound();

  const { data: members } = await supabase
    .from("members")
    .select("*")
    .eq("family_id", id)
    .order("created_at", { ascending: true });

  const idDocDataUrl = family.id_document_path
    ? await fetchIdDocAsDataUrl(family.id_document_path, supabase)
    : null;

  const visaDocDataUrl = family.visa_document_path
    ? await fetchIdDocAsDataUrl(family.visa_document_path, supabase)
    : null;

  const memberDocs = new Map<string, string | null>();
  const memberVisaDocs = new Map<string, string | null>();
  await Promise.all(
    (members || []).map(async (m) => {
      if (m.id_document_path) {
        memberDocs.set(m.id, await fetchIdDocAsDataUrl(m.id_document_path, supabase));
      }
      if (m.visa_document_path) {
        memberVisaDocs.set(m.id, await fetchIdDocAsDataUrl(m.visa_document_path, supabase));
      }
    })
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3 print:hidden">
        <div>
          <Link
            href="/admin/printables/families"
            className="text-sm text-zinc-600 hover:text-zinc-900"
          >
            ← Back to family list
          </Link>
          <h1 className="text-xl font-semibold text-zinc-900 mt-1">
            Print: {family.registrant_name}
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            {family.printed_count > 0 ? (
              <>
                Already printed <strong>{family.printed_count}</strong> time
                {family.printed_count === 1 ? "" : "s"} · last on{" "}
                {new Date(family.printed_at).toLocaleString("en-IN")}
              </>
            ) : (
              "Not yet printed"
            )}
          </p>
        </div>
        <PrintAndMarkButton familyId={id} />
      </div>

      <FamilyPrintCard
        family={family}
        members={members || []}
        idDocDataUrl={idDocDataUrl}
        visaDocDataUrl={visaDocDataUrl}
        memberDocs={memberDocs}
        memberVisaDocs={memberVisaDocs}
      />
    </div>
  );
}
