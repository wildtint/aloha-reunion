import { createAdminSupabase } from "@/lib/supabase/admin";
import { PrintButton } from "../PrintButton";

export default async function BoatPrintable() {
  const supabase = createAdminSupabase();
  const { data: families } = await supabase
    .from("families")
    .select(
      "id, registrant_name, email, phone, country_code, boat_jul18, boat_jul18_pax"
    )
    .eq("boat_jul18", true)
    .order("registrant_name", { ascending: true });

  const list = families || [];
  const total = list.reduce((s, f) => s + (f.boat_jul18_pax || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between print:hidden">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">
            Boat trip roster — 18 July 2026, 3:30 PM
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            {list.length} families · {total} pax total · ~2.5 hrs duration
          </p>
        </div>
        <PrintButton />
      </div>

      <div className="bg-white border border-zinc-200 rounded-lg p-6 print:rounded-none print:border-0 print:p-0">
        <h2 className="text-xl font-semibold text-zinc-900 mb-1 hidden print:block">
          Boat trip roster — 18 July 2026, 3:30 PM
        </h2>
        <p className="text-sm text-zinc-600 mb-4 hidden print:block">
          {list.length} families · {total} pax total · ~2.5 hrs duration
        </p>

        {list.length === 0 ? (
          <p className="text-zinc-500 text-sm">No families opted in.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-zinc-600 text-left border-b border-zinc-300">
              <tr>
                <th className="py-2 pr-4 font-medium text-xs uppercase tracking-wide">#</th>
                <th className="py-2 pr-4 font-medium text-xs uppercase tracking-wide">Family</th>
                <th className="py-2 pr-4 font-medium text-xs uppercase tracking-wide">Contact</th>
                <th className="py-2 font-medium text-xs uppercase tracking-wide">Pax</th>
              </tr>
            </thead>
            <tbody>
              {list.map((f, i) => (
                <tr key={f.id} className="border-b border-zinc-100">
                  <td className="py-2 pr-4 text-zinc-500">{i + 1}</td>
                  <td className="py-2 pr-4 font-medium">{f.registrant_name}</td>
                  <td className="py-2 pr-4 text-zinc-600">
                    {f.country_code} {f.phone}
                  </td>
                  <td className="py-2 font-semibold">{f.boat_jul18_pax}</td>
                </tr>
              ))}
              <tr className="border-t-2 border-zinc-900 font-semibold">
                <td className="py-2 pr-4"></td>
                <td className="py-2 pr-4">Total</td>
                <td className="py-2 pr-4"></td>
                <td className="py-2">{total}</td>
              </tr>
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
