import { createAdminSupabase } from "@/lib/supabase/admin";
import Link from "next/link";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import CopyEditLink from "./CopyEditLink";

export default async function FamilyDetailPage({
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

  const h = await headers();
  const host = h.get("host") || "localhost:3000";
  const protocol = host.startsWith("localhost") ? "http" : "https";
  const editUrl = `${protocol}://${host}/edit/${family.edit_token}`;

  const { data: members } = await supabase
    .from("members")
    .select("*")
    .eq("family_id", id)
    .order("member_type", { ascending: true });

  // Generate signed URLs (5-min expiry) for primary, visa, and member docs
  async function signedUrl(path: string | null | undefined) {
    if (!path) return null;
    const { data } = await supabase.storage
      .from("id-documents")
      .createSignedUrl(path, 300);
    return data?.signedUrl || null;
  }
  const idDocUrl = await signedUrl(family.id_document_path);
  const idDocBackUrl = await signedUrl(family.id_document_back_path);
  const visaDocUrl = await signedUrl(family.visa_document_path);
  const memberDocUrls = new Map<string, string | null>();
  const memberDocBackUrls = new Map<string, string | null>();
  const memberVisaUrls = new Map<string, string | null>();
  await Promise.all(
    (members || []).map(async (m) => {
      memberDocUrls.set(m.id, await signedUrl(m.id_document_path));
      memberDocBackUrls.set(m.id, await signedUrl(m.id_document_back_path));
      memberVisaUrls.set(m.id, await signedUrl(m.visa_document_path));
    })
  );

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <Link href="/admin" className="text-sm text-zinc-600 hover:text-zinc-900">
          ← Back to registrations
        </Link>
        <span className="text-xs text-zinc-500">
          Submitted {new Date(family.submitted_at).toLocaleString("en-IN")}
        </span>
      </div>

      <div className="bg-white border border-zinc-200 rounded-lg p-6 space-y-4">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">{family.registrant_name}</h1>
          <p className="text-sm text-zinc-600 mt-1">
            {family.email} · {family.country_code} {family.phone}
          </p>
          <p className="text-sm text-zinc-500 mt-1">
            {family.city ? `${family.city}, ` : ""}{family.residence_country}
          </p>
        </div>
        <CopyEditLink
          editUrl={editUrl}
          registrantName={family.registrant_name}
          familyId={family.id}
          email={family.email}
        />
      </div>

      <Card title="Family members">
        {members && members.length > 0 ? (
          <ul className="divide-y divide-zinc-100">
            {members.map((m) => (
              <li key={m.id} className="py-3 flex justify-between items-start gap-3">
                <div>
                  <div className="font-medium text-zinc-900 capitalize">
                    {m.name} <span className="text-xs text-zinc-500 font-normal">({m.member_type}{m.age ? `, age ${m.age}` : ""})</span>
                  </div>
                  {(m.meal_pref || m.allergies) && (
                    <div className="text-xs text-zinc-500 mt-0.5">
                      {m.meal_pref && <span className="capitalize">{m.meal_pref}</span>}
                      {m.allergies && (m.meal_pref ? " · " : "") + `Allergies: ${m.allergies}`}
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0 text-xs">
                  {memberDocUrls.get(m.id) ? (
                    <a
                      href={memberDocUrls.get(m.id)!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-700 hover:underline"
                    >
                      View ID (front)
                    </a>
                  ) : (
                    <span className="text-zinc-400">No ID</span>
                  )}
                  {memberDocBackUrls.get(m.id) && (
                    <a
                      href={memberDocBackUrls.get(m.id)!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-700 hover:underline"
                    >
                      View ID (back)
                    </a>
                  )}
                  {memberVisaUrls.get(m.id) && (
                    <a
                      href={memberVisaUrls.get(m.id)!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-700 hover:underline"
                    >
                      View VISA
                    </a>
                  )}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-zinc-500">No spouse or children added.</p>
        )}
      </Card>

      <Card title="ID verification">
        <Row label="Type" value={family.id_type === "aadhaar" ? "Aadhaar (Indian)" : "Passport"} />
        <Row label="Number" value={family.id_number} mono />
        {family.passport_country && <Row label="Country" value={family.passport_country} />}
        <div className="flex justify-between items-start py-2">
          <span className="text-sm text-zinc-600">Primary ID — front</span>
          {idDocUrl ? (
            <a
              href={idDocUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-700 hover:underline"
            >
              View front
            </a>
          ) : (
            <span className="text-sm text-zinc-400">Not uploaded</span>
          )}
        </div>
        <div className="flex justify-between items-start py-2">
          <span className="text-sm text-zinc-600">Primary ID — back</span>
          {idDocBackUrl ? (
            <a
              href={idDocBackUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-700 hover:underline"
            >
              View back
            </a>
          ) : (
            <span className="text-sm text-zinc-400">Not uploaded</span>
          )}
        </div>
        {family.visa_document_path !== undefined && family.visa_document_path !== null && (
          <div className="flex justify-between items-start py-2">
            <span className="text-sm text-zinc-600">VISA page</span>
            {visaDocUrl ? (
              <a
                href={visaDocUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-700 hover:underline"
              >
                View VISA
              </a>
            ) : (
              <span className="text-sm text-zinc-400">Not uploaded</span>
            )}
          </div>
        )}
        <p className="text-xs text-zinc-400 mt-2">Links expire in 5 minutes.</p>
      </Card>

      <Card title="Travel">
        <Row
          label="Arrival"
          value={`${formatDate(family.arrival_date)} at ${formatTime(family.arrival_time)} · ${family.arrival_mode || "—"}`}
        />
        <Row
          label="Departure"
          value={`${formatDate(family.departure_date)} at ${formatTime(family.departure_time)} · ${family.departure_mode || "—"}`}
        />
      </Card>

      <Card title="Pickup">
        {family.needs_pickup ? (
          <>
            <Row label="Point" value={family.pickup_point_other || family.pickup_point || "—"} />
            <Row label="Flight / train no." value={family.arrival_ref || "—"} />
            <Row label="Airport / station" value={family.arrival_location || "—"} />
          </>
        ) : (
          <p className="text-sm text-zinc-500">No pickup required.</p>
        )}
      </Card>

      <Card title="Event participation">
        <Row
          label="Lunch 17 Jul"
          value={family.lunch_jul17 ? `Yes — ${family.lunch_jul17_pax} pax` : "No"}
        />
        <Row
          label="Lunch 19 Jul"
          value={family.lunch_jul19 ? `Yes — ${family.lunch_jul19_pax} pax` : "No"}
        />
        <Row
          label="Trek (18 Jul, 7:30 AM)"
          value={family.trek_jul18 ? `Yes — ${family.trek_jul18_pax} pax` : "No"}
        />
        <Row
          label="Boat trip (18 Jul, 3:30 PM)"
          value={family.boat_jul18 ? `Yes — ${family.boat_jul18_pax} pax` : "No"}
        />
        <Row label="Meal preference" value={family.primary_meal_pref || "—"} />
        <Row label="Allergies" value={family.primary_allergies || "—"} />
      </Card>

      <Card title="Driver accommodation">
        <p className="text-sm text-zinc-700">
          {family.driver_accommodation_needed ? "Required" : "Not required"}
        </p>
      </Card>

      {family.notes && (
        <Card title="Notes from guest">
          <p className="text-sm text-zinc-700 whitespace-pre-wrap">{family.notes}</p>
        </Card>
      )}
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-zinc-200 rounded-lg p-6">
      <h2 className="text-sm font-semibold text-zinc-900 uppercase tracking-wide mb-4">
        {title}
      </h2>
      {children}
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between items-start py-2 border-b border-zinc-50 last:border-0">
      <span className="text-sm text-zinc-600">{label}</span>
      <span className={`text-sm text-zinc-900 ${mono ? "font-mono" : ""}`}>{value}</span>
    </div>
  );
}

function formatDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatTime(t: string) {
  const [h, m] = t.split(":");
  const hour = parseInt(h, 10);
  const period = hour >= 12 ? "PM" : "AM";
  const display = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${display}:${m} ${period}`;
}
