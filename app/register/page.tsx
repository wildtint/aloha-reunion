"use client";

import { useRef, useState } from "react";
import { submitRegistration } from "./actions";

type MemberRow = {
  type: "spouse" | "child";
  name: string;
  age: string;
  meal: string;
  allergies: string;
};

const ARRIVAL_TIMES = Array.from({ length: 13 }, (_, i) => {
  const h = 11 + i;
  return { value: `${String(h).padStart(2, "0")}:00`, label: formatHour(h) };
});

const DEPARTURE_TIMES = Array.from({ length: 13 }, (_, i) => {
  const h = 6 + i;
  return { value: `${String(h).padStart(2, "0")}:00`, label: formatHour(h) };
});

function formatHour(h: number) {
  const period = h >= 12 ? "PM" : "AM";
  const display = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${display}:00 ${period}`;
}

export default function RegisterPage() {
  const [idType, setIdType] = useState<"aadhaar" | "passport">("aadhaar");
  const [needsPickup, setNeedsPickup] = useState(false);
  const [pickupPoint, setPickupPoint] = useState("");
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submittingRef = useRef(false);
  const familySize = members.length + 1;

  const addMember = (type: "spouse" | "child") => {
    if (type === "spouse" && members.some((m) => m.type === "spouse")) return;
    setMembers([...members, { type, name: "", age: "", meal: "", allergies: "" }]);
  };

  const removeMember = (idx: number) =>
    setMembers(members.filter((_, i) => i !== idx));

  const updateMember = (idx: number, field: keyof MemberRow, value: string) => {
    setMembers(
      members.map((m, i) => (i === idx ? { ...m, [field]: value } : m))
    );
  };

  async function onSubmit(formData: FormData) {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    setError(null);
    formData.set("member_count", members.length.toString());
    members.forEach((m, i) => {
      formData.set(`member_${i}_type`, m.type);
      formData.set(`member_${i}_name`, m.name);
      formData.set(`member_${i}_age`, m.age);
      formData.set(`member_${i}_meal`, m.meal);
      formData.set(`member_${i}_allergies`, m.allergies);
    });
    const result = await submitRegistration(formData);
    if (result && !result.ok) {
      setError(result.error || "Something went wrong");
      setSubmitting(false);
      submittingRef.current = false;
    }
    // On success the server redirects, so we deliberately keep the
    // overlay visible until the next page loads.
  }

  return (
    <main className="min-h-screen bg-zinc-50 py-10 px-4">
      {submitting && (
        <div className="fixed inset-0 bg-zinc-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-sm w-full text-center">
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 rounded-full border-4 border-zinc-200 border-t-zinc-900 animate-spin" />
            </div>
            <h2 className="text-lg font-semibold text-zinc-900 mb-1">
              Submitting your registration<AnimatedDots />
            </h2>
            <p className="text-sm text-zinc-600">
              Please wait. Do not close or refresh this page.
            </p>
            <p className="text-xs text-zinc-400 mt-3">
              This can take a few seconds while your ID photo uploads.
            </p>
          </div>
        </div>
      )}
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-sm border border-zinc-200 p-8">
        <header className="border-b border-zinc-200 pb-6 mb-6">
          <p className="text-xs uppercase tracking-widest text-zinc-500 mb-1">
            Aloha Batch
          </p>
          <h1 className="text-2xl font-semibold text-zinc-900">
            Get-Together 35th Year Reunion
          </h1>
          <p className="text-sm text-zinc-600 mt-2">
            17 – 19 July 2026 · Spice Village – CGH Earth, Thekkady
          </p>
          <p className="text-sm text-zinc-500 mt-1">
            Please register by <strong>10 July 2026</strong>. One registration per family.
          </p>
        </header>

        <fieldset disabled={submitting} className="contents">
        <form action={onSubmit} className="space-y-8">
          {/* Section 1: Primary guest */}
          <Section title="1. Your details">
            <Field label="Full name" required>
              <input name="registrant_name" required className={inputCls} />
            </Field>
            <Field label="Email" required>
              <input name="email" type="email" required className={inputCls} />
            </Field>
            <div className="grid grid-cols-3 gap-3">
              <Field label="Country code">
                <input name="country_code" defaultValue="+91" className={inputCls} />
              </Field>
              <div className="col-span-2">
                <Field label="Phone" required>
                  <input name="phone" required className={inputCls} />
                </Field>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="City">
                <input name="city" className={inputCls} />
              </Field>
              <Field label="Country of residence">
                <input name="residence_country" defaultValue="India" className={inputCls} />
              </Field>
            </div>
            <Field label="Your meal preference">
              <select name="primary_meal_pref" className={inputCls}>
                <option value="">Select...</option>
                <option value="veg">Vegetarian</option>
                <option value="non-veg">Non-vegetarian</option>
                <option value="vegan">Vegan</option>
                <option value="jain">Jain</option>
              </select>
            </Field>
          </Section>

          {/* Section 2: Family */}
          <Section
            title="2. Family attending with you"
            subtitle="Add your spouse and any children who will attend."
          >
            {members.map((m, idx) => (
              <div
                key={idx}
                className="border border-zinc-200 rounded-lg p-4 space-y-3 bg-zinc-50"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium capitalize text-zinc-700">
                    {m.type}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeMember(idx)}
                    className="text-xs text-red-600 hover:underline"
                  >
                    Remove
                  </button>
                </div>
                <Field label="Name" required>
                  <input
                    value={m.name}
                    onChange={(e) => updateMember(idx, "name", e.target.value)}
                    required
                    className={inputCls}
                  />
                </Field>
                <div className="grid grid-cols-2 gap-3">
                  {m.type === "child" && (
                    <Field label="Age">
                      <input
                        type="number"
                        min="0"
                        max="25"
                        value={m.age}
                        onChange={(e) => updateMember(idx, "age", e.target.value)}
                        className={inputCls}
                      />
                    </Field>
                  )}
                  <Field label="Meal preference">
                    <select
                      value={m.meal}
                      onChange={(e) => updateMember(idx, "meal", e.target.value)}
                      className={inputCls}
                    >
                      <option value="">Select...</option>
                      <option value="veg">Vegetarian</option>
                      <option value="non-veg">Non-vegetarian</option>
                      <option value="vegan">Vegan</option>
                      <option value="jain">Jain</option>
                    </select>
                  </Field>
                </div>
                <Field label="Allergies / dietary notes">
                  <input
                    value={m.allergies}
                    onChange={(e) => updateMember(idx, "allergies", e.target.value)}
                    className={inputCls}
                  />
                </Field>
              </div>
            ))}

            <div className="flex gap-2">
              {!members.some((m) => m.type === "spouse") && (
                <button type="button" onClick={() => addMember("spouse")} className={btnSecondary}>
                  + Add spouse
                </button>
              )}
              <button type="button" onClick={() => addMember("child")} className={btnSecondary}>
                + Add child
              </button>
            </div>
          </Section>

          {/* Section 3: ID */}
          <Section
            title="3. ID verification"
            subtitle="For resort check-in. Stored securely and deleted 30 days after the event."
          >
            <Field label="ID type" required>
              <div className="flex gap-4 mt-1">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="id_type"
                    value="aadhaar"
                    checked={idType === "aadhaar"}
                    onChange={() => setIdType("aadhaar")}
                    required
                  />
                  Aadhaar (Indian)
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="id_type"
                    value="passport"
                    checked={idType === "passport"}
                    onChange={() => setIdType("passport")}
                  />
                  Passport (International)
                </label>
              </div>
            </Field>

            {idType === "aadhaar" ? (
              <Field label="Aadhaar number" required>
                <input
                  name="id_number"
                  required
                  pattern="[0-9\s]{12,14}"
                  placeholder="12-digit Aadhaar"
                  className={inputCls}
                />
              </Field>
            ) : (
              <>
                <Field label="Passport number" required>
                  <input name="id_number" required className={inputCls} />
                </Field>
                <Field label="Country of residence" required>
                  <input name="passport_country" required className={inputCls} />
                </Field>
              </>
            )}

            <Field label="Upload ID photo (JPG / PNG / PDF, max 5 MB)" required>
              <input
                name="id_document"
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                required
                className="block w-full text-sm text-zinc-600 file:mr-3 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-zinc-900 file:text-white hover:file:bg-zinc-700"
              />
            </Field>
          </Section>

          {/* Section 4: Travel */}
          <Section title="4. Travel details">
            <p className="text-xs text-zinc-500">
              Resort check-in is from 11:00 AM. Checkout is by 12:00 PM noon.
            </p>

            <div className="space-y-3">
              <p className="text-sm font-medium text-zinc-700">Arrival</p>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Date" required>
                  <input
                    name="arrival_date"
                    type="date"
                    required
                    defaultValue="2026-07-17"
                    className={inputCls}
                  />
                </Field>
                <Field label="Time" required>
                  <select name="arrival_time" required className={inputCls} defaultValue="">
                    <option value="" disabled>Select...</option>
                    {ARRIVAL_TIMES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </Field>
              </div>
              <Field label="Mode of arrival">
                <select name="arrival_mode" className={inputCls}>
                  <option value="">Select...</option>
                  <option value="flight">Flight</option>
                  <option value="train">Train</option>
                  <option value="car">Car</option>
                  <option value="other">Other</option>
                </select>
              </Field>
            </div>

            <div className="space-y-3 pt-4 border-t border-zinc-200">
              <p className="text-sm font-medium text-zinc-700">Departure</p>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Date" required>
                  <input
                    name="departure_date"
                    type="date"
                    required
                    defaultValue="2026-07-19"
                    className={inputCls}
                  />
                </Field>
                <Field label="Time" required>
                  <select name="departure_time" required className={inputCls} defaultValue="">
                    <option value="" disabled>Select...</option>
                    {DEPARTURE_TIMES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </Field>
              </div>
              <Field label="Mode of departure">
                <select name="departure_mode" className={inputCls}>
                  <option value="">Select...</option>
                  <option value="flight">Flight</option>
                  <option value="train">Train</option>
                  <option value="car">Car</option>
                  <option value="other">Other</option>
                </select>
              </Field>
            </div>
          </Section>

          {/* Section 5: Pickup */}
          <Section title="5. Pickup from airport / station">
            <Field label="Do you need a pickup arranged?">
              <div className="flex gap-4 mt-1">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="needs_pickup"
                    value="yes"
                    checked={needsPickup}
                    onChange={() => setNeedsPickup(true)}
                  />
                  Yes
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="needs_pickup"
                    value="no"
                    checked={!needsPickup}
                    onChange={() => setNeedsPickup(false)}
                  />
                  No
                </label>
              </div>
            </Field>

            {needsPickup && (
              <>
                <div className="bg-amber-50 border border-amber-200 text-amber-900 text-sm rounded-md p-3">
                  <strong>Note:</strong> If you request a pickup, the resort will
                  contact you directly to confirm the details. Resort transport
                  rates are higher than third-party taxis but are more reliable
                  and on time.
                </div>

                <Field label="Pickup point">
                  <select
                    name="pickup_point"
                    value={pickupPoint}
                    onChange={(e) => setPickupPoint(e.target.value)}
                    className={inputCls}
                    required
                  >
                    <option value="">Select...</option>
                    <option value="madurai">Madurai</option>
                    <option value="cochin">Cochin</option>
                    <option value="other">Other</option>
                  </select>
                </Field>
                {pickupPoint === "other" && (
                  <Field label="Specify pickup location">
                    <input name="pickup_point_other" required className={inputCls} />
                  </Field>
                )}

                <Field label="Flight / Train number" required>
                  <input
                    name="arrival_ref"
                    required
                    placeholder="e.g. AI 671 or 12695"
                    className={inputCls}
                  />
                </Field>
                <Field label="Arrival airport / station" required>
                  <input
                    name="arrival_location"
                    required
                    placeholder="e.g. Cochin International Airport"
                    className={inputCls}
                  />
                </Field>

              </>
            )}
          </Section>

          {/* Section 6: Event participation */}
          <Section
            title="6. Event participation"
            subtitle="For each option, please tell us how many people from your family will attend so the resort can plan accurately."
          >
            <YesNoPax
              name="lunch_jul17"
              label="Lunch on 17 July (arrival day)?"
              maxFamilySize={familySize}
            />
            <YesNoPax
              name="lunch_jul19"
              label="Lunch on 19 July (before checkout)?"
              maxFamilySize={familySize}
            />
            <YesNoPax
              name="trek_jul18"
              label="Trek on 18 July at 7:30 AM — opt in?"
              maxFamilySize={familySize}
            />
            <YesNoPax
              name="boat_jul18"
              label="Boat trip on 18 July at 3:30 PM — opt in?"
              hint="Total duration ~2.5 hrs (1.5 hr boat ride + ~30 min travel each way)."
              maxFamilySize={familySize}
            />

            <Field label="Allergies / dietary notes">
              <input name="primary_allergies" className={inputCls} />
            </Field>
          </Section>

          {/* Section 7: Driver accommodation */}
          <Section
            title="7. Driver accommodation"
            subtitle="If you are travelling with a personal driver, please let us know if they need a place to stay during the event."
          >
            <Field label="Do you need accommodation arranged for your driver?">
              <div className="flex gap-4 mt-1">
                <label className="flex items-center gap-2 text-sm">
                  <input type="radio" name="driver_accommodation_needed" value="yes" />
                  Yes
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name="driver_accommodation_needed"
                    value="no"
                    defaultChecked
                  />
                  No
                </label>
              </div>
              <p className="text-xs text-zinc-500 mt-1">
                If yes, the resort will arrange a stay for your driver. Cost will be
                confirmed by the resort.
              </p>
            </Field>
          </Section>

          {/* Section 8: Notes */}
          <Section title="8. Anything else?">
            <Field label="Notes for the organizer">
              <textarea name="notes" rows={3} className={inputCls} />
            </Field>
          </Section>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-3 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-zinc-900 hover:bg-zinc-700 disabled:bg-zinc-400 disabled:cursor-not-allowed text-white font-medium py-3 rounded-lg transition"
          >
            {submitting ? "Submitting..." : "Submit registration"}
          </button>
        </form>
        </fieldset>

        <footer className="mt-8 pt-6 border-t border-zinc-200 text-xs text-zinc-500 text-center space-y-1">
          <p>Questions?</p>
          <p>
            Rajan +91-7708366999 &nbsp;·&nbsp; Dinesh +91-9894636331
          </p>
        </footer>
      </div>
    </main>
  );
}

const inputCls =
  "block w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900";
const btnSecondary =
  "px-3 py-1.5 text-sm border border-zinc-300 rounded-md hover:bg-zinc-50 text-zinc-700";

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-base font-semibold text-zinc-900">{title}</h2>
        {subtitle && <p className="text-xs text-zinc-500 mt-1">{subtitle}</p>}
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-sm text-zinc-700 mb-1">
        {label} {required && <span className="text-red-600">*</span>}
      </span>
      {children}
    </label>
  );
}

function AnimatedDots() {
  return (
    <span className="inline-block w-6 text-left">
      <span className="inline-block animate-pulse">.</span>
      <span className="inline-block animate-pulse [animation-delay:0.2s]">.</span>
      <span className="inline-block animate-pulse [animation-delay:0.4s]">.</span>
    </span>
  );
}

function YesNoPax({
  name,
  label,
  hint,
  maxFamilySize,
}: {
  name: string;
  label: string;
  hint?: string;
  maxFamilySize: number;
}) {
  const [yes, setYes] = useState(false);
  const [pax, setPax] = useState(1);

  return (
    <Field label={label}>
      <div className="flex gap-4 mt-1">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="radio"
            name={name}
            value="yes"
            checked={yes}
            onChange={() => {
              setYes(true);
              if (pax < 1) setPax(1);
            }}
          />
          Yes
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="radio"
            name={name}
            value="no"
            checked={!yes}
            onChange={() => setYes(false)}
          />
          No
        </label>
      </div>
      {yes && (
        <div className="mt-2 flex items-center gap-2">
          <label className="text-sm text-zinc-700">How many people?</label>
          <input
            type="number"
            name={`${name}_pax`}
            min={1}
            max={Math.max(maxFamilySize, 1)}
            value={pax}
            onChange={(e) => setPax(Math.max(1, parseInt(e.target.value, 10) || 1))}
            className="w-20 rounded-md border border-zinc-300 px-2 py-1 text-sm"
            required
          />
          <span className="text-xs text-zinc-500">
            (your family size: {maxFamilySize})
          </span>
        </div>
      )}
      {!yes && <input type="hidden" name={`${name}_pax`} value="0" />}
      {hint && <p className="text-xs text-zinc-500 mt-1">{hint}</p>}
    </Field>
  );
}
