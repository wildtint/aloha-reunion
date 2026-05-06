import { createAdminSupabase } from "@/lib/supabase/admin";
import Link from "next/link";
import { MarkPrintedButton, ResetPrintedButton } from "./PrintActions";

export const dynamic = "force-dynamic";

export default async function FamiliesListPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const { filter = "all" } = await searchParams;
  const supabase = createAdminSupabase();

  let query = supabase
    .from("families")
    .select(
      "id, registrant_name, email, phone, country_code, arrival_date, printed_at, printed_count"
    )
    .order("registrant_name", { ascending: true });

  if (filter === "unprinted") query = query.is("printed_at", null);
  else if (filter === "printed") query = query.not("printed_at", "is", null);

  const { data: families } = await query;
  const list = families || [];

  // Counts for filter chips (always pull all)
  const { data: allFamilies } = await supabase
    .from("families")
    .select("printed_at");
  const total = (allFamilies || []).length;
  const printedCount = (allFamilies || []).filter((f) => f.printed_at).length;
  const unprintedCount = total - printedCount;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <Link href="/admin/printables" className="text-sm text-zinc-600 hover:text-zinc-900">
            ← All printables
          </Link>
          <h1 className="text-2xl font-semibold text-zinc-900 mt-1">
            Family details
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Print one at a time, or print all (filtered) at once. Status tracks
            how many times each family has been printed.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/admin/printables/families/print${filter !== "all" ? `?filter=${filter}` : ""}`}
            className="bg-zinc-900 hover:bg-zinc-700 text-white text-sm font-medium px-4 py-2 rounded-md"
          >
            Open print view ({list.length})
          </Link>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        <FilterChip current={filter} value="all" label={`All (${total})`} />
        <FilterChip
          current={filter}
          value="unprinted"
          label={`Not yet printed (${unprintedCount})`}
        />
        <FilterChip
          current={filter}
          value="printed"
          label={`Already printed (${printedCount})`}
        />
      </div>

      <div className="bg-white border border-zinc-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 text-zinc-600 text-left">
            <tr>
              <th className="px-3 py-2 font-medium text-xs uppercase tracking-wide">
                Family
              </th>
              <th className="px-3 py-2 font-medium text-xs uppercase tracking-wide">
                Contact
              </th>
              <th className="px-3 py-2 font-medium text-xs uppercase tracking-wide">
                Print status
              </th>
              <th className="px-3 py-2 font-medium text-xs uppercase tracking-wide">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {list.map((f) => (
              <tr key={f.id} className="border-t border-zinc-100">
                <td className="px-3 py-3 align-top">
                  <Link
                    href={`/admin/printables/families/${f.id}`}
                    className="font-medium text-zinc-900 hover:underline"
                  >
                    {f.registrant_name}
                  </Link>
                </td>
                <td className="px-3 py-3 align-top text-zinc-700">
                  <div>{f.email}</div>
                  <div className="text-xs text-zinc-500">
                    {f.country_code} {f.phone}
                  </div>
                </td>
                <td className="px-3 py-3 align-top">
                  {f.printed_at ? (
                    <div>
                      <span className="inline-block text-xs px-2 py-0.5 rounded bg-green-100 text-green-800 font-medium">
                        Printed × {f.printed_count}
                      </span>
                      <div className="text-xs text-zinc-500 mt-1">
                        Last:{" "}
                        {new Date(f.printed_at).toLocaleString("en-IN", {
                          day: "numeric",
                          month: "short",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                  ) : (
                    <span className="inline-block text-xs px-2 py-0.5 rounded bg-zinc-100 text-zinc-600 font-medium">
                      Not printed
                    </span>
                  )}
                </td>
                <td className="px-3 py-3 align-top">
                  <div className="flex items-center gap-3 flex-wrap">
                    <Link
                      href={`/admin/printables/families/${f.id}`}
                      className="text-xs px-2.5 py-1.5 border border-zinc-300 rounded hover:bg-zinc-50"
                    >
                      Open
                    </Link>
                    <MarkPrintedButton
                      familyId={f.id}
                      printedCount={f.printed_count}
                    />
                    {f.printed_count > 0 && <ResetPrintedButton familyId={f.id} />}
                  </div>
                </td>
              </tr>
            ))}
            {list.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center text-zinc-500 py-8">
                  No families match this filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FilterChip({
  current,
  value,
  label,
}: {
  current: string;
  value: string;
  label: string;
}) {
  const active = current === value;
  return (
    <Link
      href={value === "all" ? "/admin/printables/families" : `/admin/printables/families?filter=${value}`}
      className={`text-sm px-3 py-1.5 rounded-md border ${
        active
          ? "bg-zinc-900 text-white border-zinc-900"
          : "bg-white text-zinc-700 border-zinc-300 hover:border-zinc-400"
      }`}
    >
      {label}
    </Link>
  );
}
