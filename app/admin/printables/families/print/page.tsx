import { createAdminSupabase } from "@/lib/supabase/admin";
import { fetchIdDocAsDataUrl } from "@/lib/printables";
import FamilyPrintCard from "../FamilyPrintCard";
import { PrintButton } from "../../PrintButton";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function FamiliesPrintAll({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const { filter = "all" } = await searchParams;
  const supabase = createAdminSupabase();

  let query = supabase
    .from("families")
    .select("*")
    .order("registrant_name", { ascending: true });

  if (filter === "unprinted") query = query.is("printed_at", null);
  else if (filter === "printed") query = query.not("printed_at", "is", null);

  const { data: families } = await query;

  const { data: members } = await supabase
    .from("members")
    .select("*")
    .order("created_at", { ascending: true });

  const membersByFamily = new Map<string, typeof members>();
  (members || []).forEach((m) => {
    const arr = membersByFamily.get(m.family_id) || [];
    arr.push(m);
    membersByFamily.set(m.family_id, arr);
  });

  const familiesWithDocs = await Promise.all(
    (families || []).map(async (f) => ({
      ...f,
      idDocDataUrl: f.id_document_path
        ? await fetchIdDocAsDataUrl(f.id_document_path, supabase)
        : null,
      idDocBackDataUrl: f.id_document_back_path
        ? await fetchIdDocAsDataUrl(f.id_document_back_path, supabase)
        : null,
      visaDocDataUrl: f.visa_document_path
        ? await fetchIdDocAsDataUrl(f.visa_document_path, supabase)
        : null,
    }))
  );

  const memberDocsByFamily = new Map<string, Map<string, string | null>>();
  const memberDocBacksByFamily = new Map<string, Map<string, string | null>>();
  const memberVisaDocsByFamily = new Map<string, Map<string, string | null>>();
  await Promise.all(
    (families || []).map(async (f) => {
      const memberList = membersByFamily.get(f.id) || [];
      const idInner = new Map<string, string | null>();
      const idBackInner = new Map<string, string | null>();
      const visaInner = new Map<string, string | null>();
      await Promise.all(
        memberList.map(async (m) => {
          if (m.id_document_path) {
            idInner.set(m.id, await fetchIdDocAsDataUrl(m.id_document_path, supabase));
          }
          if (m.id_document_back_path) {
            idBackInner.set(m.id, await fetchIdDocAsDataUrl(m.id_document_back_path, supabase));
          }
          if (m.visa_document_path) {
            visaInner.set(m.id, await fetchIdDocAsDataUrl(m.visa_document_path, supabase));
          }
        })
      );
      memberDocsByFamily.set(f.id, idInner);
      memberDocBacksByFamily.set(f.id, idBackInner);
      memberVisaDocsByFamily.set(f.id, visaInner);
    })
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between print:hidden">
        <div>
          <Link
            href="/admin/printables/families"
            className="text-sm text-zinc-600 hover:text-zinc-900"
          >
            ← Back to family list
          </Link>
          <h1 className="text-2xl font-semibold text-zinc-900 mt-1">
            Print {filter === "unprinted" ? "unprinted" : filter === "printed" ? "printed" : "all"} families
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            {familiesWithDocs.length} families · one page per family.
          </p>
        </div>
        <PrintButton label="Print all" />
      </div>

      <div className="space-y-6 print:space-y-0">
        {familiesWithDocs.map((f) => (
          <FamilyPrintCard
            key={f.id}
            family={f}
            members={membersByFamily.get(f.id) || []}
            idDocDataUrl={f.idDocDataUrl}
            idDocBackDataUrl={f.idDocBackDataUrl}
            visaDocDataUrl={f.visaDocDataUrl}
            memberDocs={memberDocsByFamily.get(f.id) || new Map()}
            memberDocBacks={memberDocBacksByFamily.get(f.id) || new Map()}
            memberVisaDocs={memberVisaDocsByFamily.get(f.id) || new Map()}
          />
        ))}
      </div>
    </div>
  );
}
