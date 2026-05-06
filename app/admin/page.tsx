import { createAdminSupabase } from "@/lib/supabase/admin";

type Family = {
  id: string;
  registrant_name: string;
  email: string;
  phone: string;
  country_code: string;
  arrival_date: string;
  arrival_time: string;
  departure_date: string;
  departure_time: string;
  needs_pickup: boolean;
  pickup_point: string | null;
  trek_jul18: boolean;
  boat_jul18: boolean;
  lunch_jul17: boolean;
  lunch_jul19: boolean;
  driver_accommodation_needed: boolean;
  primary_meal_pref: string | null;
  submitted_at: string;
};

type MemberCount = { family_id: string; count: number };

export default async function AdminHome() {
  const supabase = createAdminSupabase();

  const { data: families, error } = await supabase
    .from("families")
    .select(
      "id, registrant_name, email, phone, country_code, arrival_date, arrival_time, departure_date, departure_time, needs_pickup, pickup_point, trek_jul18, boat_jul18, lunch_jul17, lunch_jul19, driver_accommodation_needed, primary_meal_pref, submitted_at"
    )
    .order("submitted_at", { ascending: false })
    .returns<Family[]>();

  // Member counts per family
  const { data: members } = await supabase
    .from("members")
    .select("family_id");

  const memberCounts = new Map<string, number>();
  (members || []).forEach((m: { family_id: string }) => {
    memberCounts.set(m.family_id, (memberCounts.get(m.family_id) || 0) + 1);
  });

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-md">
        Error loading registrations: {error.message}
      </div>
    );
  }

  const total = families?.length || 0;
  const totalGuests =
    (families?.length || 0) +
    (members?.length || 0);
  const trekCount = families?.filter((f) => f.trek_jul18).length || 0;
  const boatCount = families?.filter((f) => f.boat_jul18).length || 0;
  const pickupCount = families?.filter((f) => f.needs_pickup).length || 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">Registrations</h1>
        <p className="text-sm text-zinc-500 mt-1">
          17–19 July 2026 · Spice Village, Thekkady
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <Stat label="Families" value={total} />
        <Stat label="Total guests" value={totalGuests} />
        <Stat label="Pickup needed" value={pickupCount} />
        <Stat label="Trek (18 Jul)" value={trekCount} />
        <Stat label="Boat (18 Jul)" value={boatCount} />
      </div>

      <div className="bg-white border border-zinc-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 text-zinc-600 text-left">
              <tr>
                <Th>Registrant</Th>
                <Th>Contact</Th>
                <Th>Family</Th>
                <Th>Arrival</Th>
                <Th>Departure</Th>
                <Th>Pickup</Th>
                <Th>Trek</Th>
                <Th>Boat</Th>
                <Th>Driver</Th>
                <Th>Submitted</Th>
              </tr>
            </thead>
            <tbody>
              {(families || []).map((f) => (
                <tr key={f.id} className="border-t border-zinc-100 hover:bg-zinc-50">
                  <Td>
                    <div className="font-medium text-zinc-900">{f.registrant_name}</div>
                    <div className="text-xs text-zinc-500">{f.primary_meal_pref || "—"}</div>
                  </Td>
                  <Td>
                    <div>{f.email}</div>
                    <div className="text-xs text-zinc-500">
                      {f.country_code} {f.phone}
                    </div>
                  </Td>
                  <Td>+{memberCounts.get(f.id) || 0}</Td>
                  <Td>
                    <div>{formatDate(f.arrival_date)}</div>
                    <div className="text-xs text-zinc-500">{formatTime(f.arrival_time)}</div>
                  </Td>
                  <Td>
                    <div>{formatDate(f.departure_date)}</div>
                    <div className="text-xs text-zinc-500">{formatTime(f.departure_time)}</div>
                  </Td>
                  <Td>
                    {f.needs_pickup ? (
                      <span className="text-green-700 capitalize">
                        {f.pickup_point || "yes"}
                      </span>
                    ) : (
                      <span className="text-zinc-400">—</span>
                    )}
                  </Td>
                  <Td>{f.trek_jul18 ? "✓" : "—"}</Td>
                  <Td>{f.boat_jul18 ? "✓" : "—"}</Td>
                  <Td>{f.driver_accommodation_needed ? "✓" : "—"}</Td>
                  <Td className="text-xs text-zinc-500">
                    {new Date(f.submitted_at).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                    })}
                  </Td>
                </tr>
              ))}
              {total === 0 && (
                <tr>
                  <td colSpan={10} className="text-center text-zinc-500 py-8">
                    No registrations yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white border border-zinc-200 rounded-lg p-4">
      <div className="text-xs text-zinc-500 uppercase tracking-wide">{label}</div>
      <div className="text-2xl font-semibold text-zinc-900 mt-1">{value}</div>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-3 py-2 font-medium text-xs uppercase tracking-wide">{children}</th>;
}

function Td({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <td className={`px-3 py-3 align-top ${className}`}>{children}</td>;
}

function formatDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
}

function formatTime(t: string) {
  const [h, m] = t.split(":");
  const hour = parseInt(h, 10);
  const period = hour >= 12 ? "PM" : "AM";
  const display = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${display}:${m} ${period}`;
}
