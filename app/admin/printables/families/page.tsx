import { createAdminSupabase } from "@/lib/supabase/admin";
import { formatDate, formatTime, mealLabel } from "@/lib/format";
import { PrintButton } from "../PrintButton";

export const dynamic = "force-dynamic";

async function fetchIdDocAsDataUrl(
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

export default async function FamiliesPrintable() {
  const supabase = createAdminSupabase();

  const { data: families } = await supabase
    .from("families")
    .select("*")
    .order("registrant_name", { ascending: true });

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

  // Fetch ID document images as data URLs
  const familiesWithDocs = await Promise.all(
    (families || []).map(async (f) => ({
      ...f,
      idDocDataUrl: f.id_document_path
        ? await fetchIdDocAsDataUrl(f.id_document_path, supabase)
        : null,
    }))
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between print:hidden">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">
            Family details (all)
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            {familiesWithDocs.length} families · one page per family when printed.
          </p>
        </div>
        <PrintButton label="Print all" />
      </div>

      <div className="space-y-6 print:space-y-0">
        {familiesWithDocs.map((f) => {
          const fam = membersByFamily.get(f.id) || [];
          return (
            <article
              key={f.id}
              className="bg-white border border-zinc-200 rounded-lg p-6 print:rounded-none print:border-0 print:p-0 print:break-after-page"
            >
              <header className="border-b border-zinc-300 pb-3 mb-4">
                <p className="text-xs uppercase tracking-widest text-zinc-500">
                  Aloha Batch · 35th Year Reunion · 17–19 Jul 2026 · Spice Village, Thekkady
                </p>
                <h2 className="text-2xl font-bold text-zinc-900 mt-1">
                  {f.registrant_name}
                </h2>
                <p className="text-sm text-zinc-700">
                  {f.email} · {f.country_code} {f.phone}
                </p>
                {f.city && (
                  <p className="text-sm text-zinc-600">
                    {f.city}, {f.residence_country}
                  </p>
                )}
              </header>

              <div className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
                <Block title="Check-in">
                  <div>{formatDate(f.arrival_date)}</div>
                  <div className="text-zinc-600">
                    {formatTime(f.arrival_time)} · {f.arrival_mode || "—"}
                  </div>
                </Block>
                <Block title="Check-out">
                  <div>{formatDate(f.departure_date)}</div>
                  <div className="text-zinc-600">
                    {formatTime(f.departure_time)} · {f.departure_mode || "—"}
                  </div>
                </Block>

                <Block title="ID type">
                  <div>
                    {f.id_type === "aadhaar" ? "Aadhaar (Indian)" : "Passport"}
                  </div>
                  {f.passport_country && (
                    <div className="text-zinc-600">{f.passport_country}</div>
                  )}
                </Block>
                <Block title="ID number">
                  <div className="font-mono">{f.id_number}</div>
                </Block>

                <div className="col-span-2">
                  <Block title="Meal preference (primary guest)">
                    <div>
                      {mealLabel(f.primary_meal_pref)}
                      {f.primary_allergies && (
                        <span className="text-amber-700">
                          {" "}
                          · Allergies: {f.primary_allergies}
                        </span>
                      )}
                    </div>
                  </Block>
                </div>

                <div className="col-span-2">
                  <Block title={`Family members (${fam.length})`}>
                    {fam.length > 0 ? (
                      <ul className="space-y-1">
                        {fam.map((m) => (
                          <li key={m.id}>
                            <span className="font-medium">{m.name}</span>
                            <span className="text-zinc-500 text-xs">
                              {" "}
                              ({m.member_type}
                              {m.age ? `, age ${m.age}` : ""})
                            </span>
                            <span className="text-zinc-600">
                              {" "}— {mealLabel(m.meal_pref)}
                              {m.allergies && (
                                <span className="text-amber-700">
                                  {" "}
                                  · Allergies: {m.allergies}
                                </span>
                              )}
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <span className="text-zinc-500">None</span>
                    )}
                  </Block>
                </div>

                <div className="col-span-2">
                  <Block title="Pickup">
                    {f.needs_pickup ? (
                      <div>
                        <div>
                          From:{" "}
                          <span className="capitalize">
                            {f.pickup_point_other ||
                              f.pickup_point ||
                              "—"}
                          </span>
                        </div>
                        <div className="text-zinc-600">
                          Flight/Train: {f.arrival_ref || "—"} · Location:{" "}
                          {f.arrival_location || "—"}
                        </div>
                      </div>
                    ) : (
                      <span className="text-zinc-500">Not required</span>
                    )}
                  </Block>
                </div>

                <div className="col-span-2">
                  <Block title="Event participation">
                    <ul className="space-y-0.5">
                      <li>
                        Lunch 17 Jul:{" "}
                        {f.lunch_jul17 ? (
                          <strong>Yes — {f.lunch_jul17_pax} pax</strong>
                        ) : (
                          "No"
                        )}
                      </li>
                      <li>
                        Lunch 19 Jul:{" "}
                        {f.lunch_jul19 ? (
                          <strong>Yes — {f.lunch_jul19_pax} pax</strong>
                        ) : (
                          "No"
                        )}
                      </li>
                      <li>
                        Trek (18 Jul, 7:30 AM):{" "}
                        {f.trek_jul18 ? (
                          <strong>Yes — {f.trek_jul18_pax} pax</strong>
                        ) : (
                          "No"
                        )}
                      </li>
                      <li>
                        Boat trip (18 Jul, 3:30 PM):{" "}
                        {f.boat_jul18 ? (
                          <strong>Yes — {f.boat_jul18_pax} pax</strong>
                        ) : (
                          "No"
                        )}
                      </li>
                    </ul>
                  </Block>
                </div>

                <div className="col-span-2">
                  <Block title="Driver accommodation">
                    {f.driver_accommodation_needed ? "Required" : "Not required"}
                  </Block>
                </div>

                {f.notes && (
                  <div className="col-span-2">
                    <Block title="Guest notes">
                      <p className="whitespace-pre-wrap">{f.notes}</p>
                    </Block>
                  </div>
                )}

                <div className="col-span-2">
                  <Block title="ID document">
                    {f.idDocDataUrl ? (
                      f.id_document_path?.toLowerCase().endsWith(".pdf") ? (
                        <object
                          data={f.idDocDataUrl}
                          type="application/pdf"
                          className="w-full h-[600px] border border-zinc-300"
                        >
                          <a
                            href={f.idDocDataUrl}
                            download={`id-${f.registrant_name}.pdf`}
                            className="text-blue-700 underline"
                          >
                            Download PDF (your browser couldn&apos;t display it inline)
                          </a>
                        </object>
                      ) : (
                        <img
                          src={f.idDocDataUrl}
                          alt="ID document"
                          className="max-w-md max-h-80 border border-zinc-300"
                        />
                      )
                    ) : (
                      <span className="text-zinc-500">No document on file</span>
                    )}
                  </Block>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-medium mb-1">
        {title}
      </div>
      <div className="text-sm text-zinc-900">{children}</div>
    </div>
  );
}
