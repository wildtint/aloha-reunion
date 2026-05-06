import { createAdminSupabase } from "@/lib/supabase/admin";
import { formatDate, formatTime } from "@/lib/format";
import { PrintButton } from "../PrintButton";

export default async function PickupPrintable() {
  const supabase = createAdminSupabase();
  const { data: families } = await supabase
    .from("families")
    .select(
      "id, registrant_name, email, phone, country_code, arrival_date, arrival_time, arrival_mode, arrival_ref, arrival_location, needs_pickup, pickup_point, pickup_point_other, driver_accommodation_needed"
    )
    .eq("needs_pickup", true)
    .order("arrival_date", { ascending: true })
    .order("arrival_time", { ascending: true });

  const list = families || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between print:hidden">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Pickup schedule</h1>
          <p className="text-sm text-zinc-500 mt-1">
            {list.length} pickup{list.length === 1 ? "" : "s"} · sorted by arrival
            time
          </p>
        </div>
        <PrintButton />
      </div>

      <div className="bg-white border border-zinc-200 rounded-lg p-6 print:rounded-none print:border-0 print:p-0">
        <h2 className="text-xl font-semibold text-zinc-900 mb-1 hidden print:block">
          Pickup schedule
        </h2>
        <p className="text-sm text-zinc-600 mb-4 hidden print:block">
          {list.length} pickup{list.length === 1 ? "" : "s"} · sorted by arrival time
        </p>

        {list.length === 0 ? (
          <p className="text-zinc-500 text-sm">No pickups requested.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-zinc-600 text-left border-b border-zinc-300">
              <tr>
                <th className="py-2 pr-3 font-medium text-xs uppercase tracking-wide">
                  Arrival
                </th>
                <th className="py-2 pr-3 font-medium text-xs uppercase tracking-wide">
                  Pickup point
                </th>
                <th className="py-2 pr-3 font-medium text-xs uppercase tracking-wide">
                  Mode / Ref
                </th>
                <th className="py-2 pr-3 font-medium text-xs uppercase tracking-wide">
                  Location
                </th>
                <th className="py-2 pr-3 font-medium text-xs uppercase tracking-wide">
                  Family
                </th>
                <th className="py-2 pr-3 font-medium text-xs uppercase tracking-wide">
                  Contact
                </th>
                <th className="py-2 font-medium text-xs uppercase tracking-wide">
                  Driver
                </th>
              </tr>
            </thead>
            <tbody>
              {list.map((f) => (
                <tr key={f.id} className="border-b border-zinc-100 align-top">
                  <td className="py-2 pr-3">
                    <div className="font-medium">{formatDate(f.arrival_date)}</div>
                    <div className="text-zinc-600 text-xs">
                      {formatTime(f.arrival_time)}
                    </div>
                  </td>
                  <td className="py-2 pr-3 capitalize">
                    {f.pickup_point_other || f.pickup_point || "—"}
                  </td>
                  <td className="py-2 pr-3">
                    <div className="capitalize">{f.arrival_mode || "—"}</div>
                    <div className="text-zinc-600 text-xs">{f.arrival_ref || "—"}</div>
                  </td>
                  <td className="py-2 pr-3">{f.arrival_location || "—"}</td>
                  <td className="py-2 pr-3 font-medium">{f.registrant_name}</td>
                  <td className="py-2 pr-3 text-zinc-700">
                    {f.country_code} {f.phone}
                  </td>
                  <td className="py-2">
                    {f.driver_accommodation_needed ? (
                      <span className="text-amber-700 font-medium">Stay req.</span>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
