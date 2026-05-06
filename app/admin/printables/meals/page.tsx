import { createAdminSupabase } from "@/lib/supabase/admin";
import { mealLabel } from "@/lib/format";
import { PrintButton } from "../PrintButton";

type MealPref = "veg" | "non-veg" | "vegan" | "jain" | "unspecified";

const PREF_KEYS: MealPref[] = ["veg", "non-veg", "vegan", "jain", "unspecified"];

function bucket(pref: string | null): MealPref {
  if (pref === "veg" || pref === "non-veg" || pref === "vegan" || pref === "jain")
    return pref;
  return "unspecified";
}

type FamilyRow = {
  id: string;
  registrant_name: string;
  primary_meal_pref: string | null;
  lunch_jul17: boolean;
  lunch_jul17_pax: number;
  lunch_jul19: boolean;
  lunch_jul19_pax: number;
};

type MemberRow = {
  family_id: string;
  member_type: string;
  meal_pref: string | null;
  created_at: string;
};

export default async function MealsPrintable() {
  const supabase = createAdminSupabase();

  const { data: families } = await supabase
    .from("families")
    .select(
      "id, registrant_name, primary_meal_pref, lunch_jul17, lunch_jul17_pax, lunch_jul19, lunch_jul19_pax"
    )
    .order("registrant_name", { ascending: true })
    .returns<FamilyRow[]>();

  const { data: members } = await supabase
    .from("members")
    .select("family_id, member_type, meal_pref, created_at")
    .order("created_at", { ascending: true })
    .returns<MemberRow[]>();

  const membersByFamily = new Map<string, MemberRow[]>();
  (members || []).forEach((m) => {
    const arr = membersByFamily.get(m.family_id) || [];
    arr.push(m);
    membersByFamily.set(m.family_id, arr);
  });

  // For a session: take the first N people in order (registrant, spouse, children-by-creation-order),
  // count their meal preferences as the breakdown.
  function distributeForSession(
    fam: FamilyRow,
    pax: number
  ): Record<MealPref, number> {
    const counts: Record<MealPref, number> = {
      veg: 0,
      "non-veg": 0,
      vegan: 0,
      jain: 0,
      unspecified: 0,
    };
    const ordered: { meal_pref: string | null }[] = [
      { meal_pref: fam.primary_meal_pref },
      ...((membersByFamily.get(fam.id) || []) as MemberRow[]),
    ];
    const slice = ordered.slice(0, pax);
    slice.forEach((p) => {
      counts[bucket(p.meal_pref)]++;
    });
    // If pax > family's known members, attribute the extras to "unspecified"
    if (slice.length < pax) {
      counts.unspecified += pax - slice.length;
    }
    return counts;
  }

  function aggregateSession(
    selector: (f: FamilyRow) => { yes: boolean; pax: number }
  ) {
    const totals: Record<MealPref, number> = {
      veg: 0,
      "non-veg": 0,
      vegan: 0,
      jain: 0,
      unspecified: 0,
    };
    let totalPax = 0;
    const rows: { name: string; pax: number; counts: Record<MealPref, number> }[] = [];

    (families || []).forEach((f) => {
      const sel = selector(f);
      if (!sel.yes || sel.pax <= 0) return;
      const c = distributeForSession(f, sel.pax);
      totalPax += sel.pax;
      PREF_KEYS.forEach((k) => (totals[k] += c[k]));
      rows.push({ name: f.registrant_name, pax: sel.pax, counts: c });
    });

    return { totals, totalPax, rows };
  }

  const lunch17 = aggregateSession((f) => ({
    yes: f.lunch_jul17,
    pax: f.lunch_jul17_pax,
  }));
  const lunch19 = aggregateSession((f) => ({
    yes: f.lunch_jul19,
    pax: f.lunch_jul19_pax,
  }));

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between print:hidden">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Day-wise meal pax</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Lunch counts split by meal preference. Per-family breakdown assumes
            attendees are the first N members of the family (primary, spouse,
            then children).
          </p>
        </div>
        <PrintButton />
      </div>

      <SessionTable title="Lunch — 17 July 2026 (Friday)" data={lunch17} />
      <SessionTable title="Lunch — 19 July 2026 (Sunday)" data={lunch19} />
    </div>
  );
}

function SessionTable({
  title,
  data,
}: {
  title: string;
  data: {
    totals: Record<MealPref, number>;
    totalPax: number;
    rows: { name: string; pax: number; counts: Record<MealPref, number> }[];
  };
}) {
  return (
    <section className="bg-white border border-zinc-200 rounded-lg p-6 print:rounded-none print:border-0 print:p-0 print:break-after-page">
      <h2 className="text-xl font-semibold text-zinc-900 mb-2">{title}</h2>
      <p className="text-sm text-zinc-600 mb-4">
        Total: <strong>{data.totalPax} pax</strong>
        {PREF_KEYS.map((k) =>
          data.totals[k] > 0 ? (
            <span key={k}>
              {" "}
              · {mealLabel(k === "unspecified" ? null : k)}: {data.totals[k]}
            </span>
          ) : null
        )}
      </p>

      {data.rows.length === 0 ? (
        <p className="text-zinc-500 text-sm">No families opted in for this session.</p>
      ) : (
        <table className="w-full text-sm border-t border-zinc-200">
          <thead className="text-zinc-600 text-left">
            <tr>
              <th className="py-2 pr-4 font-medium text-xs uppercase tracking-wide">Family</th>
              <th className="py-2 pr-4 font-medium text-xs uppercase tracking-wide">Pax</th>
              <th className="py-2 pr-4 font-medium text-xs uppercase tracking-wide">Veg</th>
              <th className="py-2 pr-4 font-medium text-xs uppercase tracking-wide">Non-veg</th>
              <th className="py-2 pr-4 font-medium text-xs uppercase tracking-wide">Vegan</th>
              <th className="py-2 pr-4 font-medium text-xs uppercase tracking-wide">Jain</th>
              <th className="py-2 font-medium text-xs uppercase tracking-wide">Unspec.</th>
            </tr>
          </thead>
          <tbody>
            {data.rows.map((r, i) => (
              <tr key={i} className="border-t border-zinc-100">
                <td className="py-2 pr-4">{r.name}</td>
                <td className="py-2 pr-4 font-medium">{r.pax}</td>
                <td className="py-2 pr-4">{r.counts.veg || ""}</td>
                <td className="py-2 pr-4">{r.counts["non-veg"] || ""}</td>
                <td className="py-2 pr-4">{r.counts.vegan || ""}</td>
                <td className="py-2 pr-4">{r.counts.jain || ""}</td>
                <td className="py-2">{r.counts.unspecified || ""}</td>
              </tr>
            ))}
            <tr className="border-t-2 border-zinc-900 font-semibold">
              <td className="py-2 pr-4">Total</td>
              <td className="py-2 pr-4">{data.totalPax}</td>
              <td className="py-2 pr-4">{data.totals.veg}</td>
              <td className="py-2 pr-4">{data.totals["non-veg"]}</td>
              <td className="py-2 pr-4">{data.totals.vegan}</td>
              <td className="py-2 pr-4">{data.totals.jain}</td>
              <td className="py-2">{data.totals.unspecified}</td>
            </tr>
          </tbody>
        </table>
      )}
    </section>
  );
}
