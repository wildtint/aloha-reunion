import { formatDate, formatTime, mealLabel } from "@/lib/format";

type Member = {
  id: string;
  name: string;
  member_type: string;
  age: number | null;
  meal_pref: string | null;
  allergies: string | null;
  id_document_path?: string | null;
  id_document_back_path?: string | null;
  visa_document_path?: string | null;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function FamilyPrintCard({
  family,
  members,
  idDocDataUrl,
  idDocBackDataUrl = null,
  visaDocDataUrl = null,
  memberDocs = new Map<string, string | null>(),
  memberDocBacks = new Map<string, string | null>(),
  memberVisaDocs = new Map<string, string | null>(),
}: {
  family: any;
  members: Member[];
  idDocDataUrl: string | null;
  idDocBackDataUrl?: string | null;
  visaDocDataUrl?: string | null;
  memberDocs?: Map<string, string | null>;
  memberDocBacks?: Map<string, string | null>;
  memberVisaDocs?: Map<string, string | null>;
}) {
  return (
    <article className="bg-white border border-zinc-200 rounded-lg p-6 print:rounded-none print:border-0 print:p-0 print:break-after-page">
      <header className="border-b border-zinc-300 pb-3 mb-4">
        <p className="text-xs uppercase tracking-widest text-zinc-500">
          Aloha Batch · 35th Year Reunion · 17–19 Jul 2026 · Spice Village, Thekkady
        </p>
        <h2 className="text-2xl font-bold text-zinc-900 mt-1">
          {family.registrant_name}
        </h2>
        <p className="text-sm text-zinc-700">
          {family.email} · {family.country_code} {family.phone}
        </p>
        {family.city && (
          <p className="text-sm text-zinc-600">
            {family.city}, {family.residence_country}
          </p>
        )}
      </header>

      <div className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
        <Block title="Check-in">
          <div>{formatDate(family.arrival_date)}</div>
          <div className="text-zinc-600">
            {formatTime(family.arrival_time)} · {family.arrival_mode || "—"}
          </div>
        </Block>
        <Block title="Check-out">
          <div>{formatDate(family.departure_date)}</div>
          <div className="text-zinc-600">
            {formatTime(family.departure_time)} · {family.departure_mode || "—"}
          </div>
        </Block>

        <Block title="ID type">
          <div>{family.id_type === "aadhaar" ? "Aadhaar (Indian)" : "Passport"}</div>
          {family.passport_country && (
            <div className="text-zinc-600">{family.passport_country}</div>
          )}
        </Block>
        <Block title="ID number">
          <div className="font-mono">{family.id_number}</div>
        </Block>

        <div className="col-span-2">
          <Block title="Meal preference (primary guest)">
            <div>
              {mealLabel(family.primary_meal_pref)}
              {family.primary_allergies && (
                <span className="text-amber-700">
                  {" "}· Allergies: {family.primary_allergies}
                </span>
              )}
            </div>
          </Block>
        </div>

        <div className="col-span-2">
          <Block title={`Family members (${members.length})`}>
            {members.length > 0 ? (
              <ul className="space-y-1">
                {members.map((m) => (
                  <li key={m.id}>
                    <span className="font-medium">{m.name}</span>
                    <span className="text-zinc-500 text-xs">
                      {" "}({m.member_type}{m.age ? `, age ${m.age}` : ""})
                    </span>
                    <span className="text-zinc-600">
                      {" "}— {mealLabel(m.meal_pref)}
                      {m.allergies && (
                        <span className="text-amber-700">
                          {" "}· Allergies: {m.allergies}
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
            {family.needs_pickup ? (
              <div>
                <div>
                  From:{" "}
                  <span className="capitalize">
                    {family.pickup_point_other || family.pickup_point || "—"}
                  </span>
                </div>
                <div className="text-zinc-600">
                  Flight/Train: {family.arrival_ref || "—"} · Location: {family.arrival_location || "—"}
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
                {family.lunch_jul17 ? (
                  <strong>Yes — {family.lunch_jul17_pax} pax</strong>
                ) : (
                  "No"
                )}
              </li>
              <li>
                Lunch 19 Jul:{" "}
                {family.lunch_jul19 ? (
                  <strong>Yes — {family.lunch_jul19_pax} pax</strong>
                ) : (
                  "No"
                )}
              </li>
              <li>
                Trek (18 Jul, 7:30 AM):{" "}
                {family.trek_jul18 ? (
                  <strong>Yes — {family.trek_jul18_pax} pax</strong>
                ) : (
                  "No"
                )}
              </li>
              <li>
                Boat trip (18 Jul, 3:30 PM):{" "}
                {family.boat_jul18 ? (
                  <strong>Yes — {family.boat_jul18_pax} pax</strong>
                ) : (
                  "No"
                )}
              </li>
            </ul>
          </Block>
        </div>

        <div className="col-span-2">
          <Block title="Driver accommodation">
            {family.driver_accommodation_needed ? "Required" : "Not required"}
          </Block>
        </div>

        {family.notes && (
          <div className="col-span-2">
            <Block title="Guest notes">
              <p className="whitespace-pre-wrap">{family.notes}</p>
            </Block>
          </div>
        )}

        <div className="col-span-2">
          <Block title={`ID document — ${family.registrant_name} (front)`}>
            <DocPreview
              url={idDocDataUrl}
              path={family.id_document_path}
              filename={`id-${family.registrant_name}-front`}
            />
          </Block>
        </div>

        {family.id_document_back_path && (
          <div className="col-span-2">
            <Block title={`ID document — ${family.registrant_name} (back)`}>
              <DocPreview
                url={idDocBackDataUrl}
                path={family.id_document_back_path}
                filename={`id-${family.registrant_name}-back`}
              />
            </Block>
          </div>
        )}

        {family.visa_document_path && (
          <div className="col-span-2">
            <Block title={`VISA page — ${family.registrant_name}`}>
              <DocPreview
                url={visaDocDataUrl}
                path={family.visa_document_path}
                filename={`visa-${family.registrant_name}`}
              />
            </Block>
          </div>
        )}

        {members.map((m) => (
          <div key={`docs-${m.id}`} className="col-span-2 space-y-4">
            {m.id_document_path && (
              <Block title={`ID document — ${m.name} (${m.member_type}, front)`}>
                <DocPreview
                  url={memberDocs.get(m.id) ?? null}
                  path={m.id_document_path || null}
                  filename={`id-${m.name}-front`}
                />
              </Block>
            )}
            {m.id_document_back_path && (
              <Block title={`ID document — ${m.name} (${m.member_type}, back)`}>
                <DocPreview
                  url={memberDocBacks.get(m.id) ?? null}
                  path={m.id_document_back_path || null}
                  filename={`id-${m.name}-back`}
                />
              </Block>
            )}
            {m.visa_document_path && (
              <Block title={`VISA page — ${m.name} (${m.member_type})`}>
                <DocPreview
                  url={memberVisaDocs.get(m.id) ?? null}
                  path={m.visa_document_path || null}
                  filename={`visa-${m.name}`}
                />
              </Block>
            )}
          </div>
        ))}
      </div>
    </article>
  );
}

function DocPreview({
  url,
  path,
  filename,
}: {
  url: string | null;
  path: string | null;
  filename: string;
}) {
  if (!url || !path) {
    return <span className="text-zinc-500">No document on file</span>;
  }
  if (path.toLowerCase().endsWith(".pdf")) {
    return (
      <object data={url} type="application/pdf" className="w-full h-[600px] border border-zinc-300">
        <a href={url} download={`${filename}.pdf`} className="text-blue-700 underline">
          Download PDF (your browser couldn&apos;t display it inline)
        </a>
      </object>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} alt="ID document" className="max-w-md max-h-80 border border-zinc-300" />
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
