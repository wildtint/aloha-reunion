"use client";

import { useRef, useState } from "react";
import { flushSync } from "react-dom";

export type Mode = "create" | "edit";

export type InitialMember = {
  type: "spouse" | "child";
  name: string;
  age: string;
  meal: string;
  allergies: string;
  has_existing_id_document?: boolean;
  has_existing_id_document_back?: boolean;
  has_existing_visa_document?: boolean;
};

export type InitialData = {
  registrant_name: string;
  email: string;
  phone: string;
  country_code: string;
  city: string;
  residence_country: string;
  primary_meal_pref: string;
  primary_allergies: string;

  id_type: "aadhaar" | "passport";
  id_number: string;
  passport_country: string;
  has_existing_id_document: boolean;
  has_existing_id_document_back: boolean;
  has_existing_visa_document: boolean;

  arrival_date: string;
  arrival_time: string;
  arrival_mode: string;
  departure_date: string;
  departure_time: string;
  departure_mode: string;

  needs_pickup: boolean;
  pickup_point: string;
  pickup_point_other: string;
  arrival_ref: string;
  arrival_location: string;

  lunch_jul17: boolean;
  lunch_jul17_pax: number;
  lunch_jul19: boolean;
  lunch_jul19_pax: number;
  trek_jul18: boolean;
  trek_jul18_pax: number;
  boat_jul18: boolean;
  boat_jul18_pax: number;

  driver_accommodation_needed: boolean;
  notes: string;

  members: InitialMember[];
};

export const ARRIVAL_TIMES = Array.from({ length: 13 }, (_, i) => {
  const h = 11 + i;
  return { value: `${String(h).padStart(2, "0")}:00`, label: formatHour(h) };
});

export const DEPARTURE_TIMES = Array.from({ length: 13 }, (_, i) => {
  const h = 6 + i;
  return { value: `${String(h).padStart(2, "0")}:00`, label: formatHour(h) };
});

function formatHour(h: number) {
  const period = h >= 12 ? "PM" : "AM";
  const display = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${display}:00 ${period}`;
}

type Props = {
  mode: Mode;
  initial?: InitialData;
  submitAction: (formData: FormData) => Promise<{ ok: boolean; error?: string } | void>;
  submitLabel: string;
  submittingLabel: string;
  showHeader?: boolean;
};

export default function RegistrationForm({
  mode,
  initial,
  submitAction,
  submitLabel,
  submittingLabel,
  showHeader = true,
}: Props) {
  const [idType, setIdType] = useState<"aadhaar" | "passport">(
    initial?.id_type || "aadhaar"
  );
  const [residenceCountry, setResidenceCountry] = useState(
    initial?.residence_country || "India"
  );
  const [needsPickup, setNeedsPickup] = useState(initial?.needs_pickup || false);
  const [pickupPoint, setPickupPoint] = useState(initial?.pickup_point || "");
  const [members, setMembers] = useState<InitialMember[]>(initial?.members || []);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submittingRef = useRef(false);
  const familySize = members.length + 1;
  const isInternational =
    residenceCountry.trim() !== "" &&
    residenceCountry.trim().toLowerCase() !== "india";

  const addMember = (type: "spouse" | "child") => {
    if (type === "spouse" && members.some((m) => m.type === "spouse")) return;
    setMembers([...members, { type, name: "", age: "", meal: "", allergies: "" }]);
  };

  const removeMember = (idx: number) =>
    setMembers(members.filter((_, i) => i !== idx));

  const updateMember = (idx: number, field: keyof InitialMember, value: string) => {
    setMembers(
      members.map((m, i) => (i === idx ? { ...m, [field]: value } : m))
    );
  };

  async function handleFormSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submittingRef.current) return;

    const formEl = e.currentTarget;
    const formData = new FormData(formEl);

    // Client-side aggregate file-size check (50 MB combined cap).
    let totalBytes = 0;
    for (const [, value] of formData.entries()) {
      if (value instanceof File) totalBytes += value.size;
    }
    const MAX = 50 * 1024 * 1024;
    if (totalBytes > MAX) {
      setError(
        `Total upload size is ${(totalBytes / 1024 / 1024).toFixed(1)} MB — please use smaller / compressed images (max 50 MB total).`
      );
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    submittingRef.current = true;
    // Force the modal to paint BEFORE we start the (slow) upload.
    flushSync(() => {
      setSubmitting(true);
      setError(null);
    });

    formData.set("member_count", members.length.toString());
    members.forEach((m, i) => {
      formData.set(`member_${i}_type`, m.type);
      formData.set(`member_${i}_name`, m.name);
      formData.set(`member_${i}_age`, m.age);
      formData.set(`member_${i}_meal`, m.meal);
      formData.set(`member_${i}_allergies`, m.allergies);
    });

    try {
      const result = await submitAction(formData);
      if (result && !result.ok) {
        setError(result.error || "Something went wrong. Please try again.");
        setSubmitting(false);
        submittingRef.current = false;
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
      // On success the server redirects, so we leave the overlay up.
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(
        `Submission failed: ${msg}. If this keeps happening, please try smaller photos or contact Rajan +91-7708366999.`
      );
      setSubmitting(false);
      submittingRef.current = false;
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
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
              {submittingLabel}
              <AnimatedDots />
            </h2>
            <p className="text-sm text-zinc-600">
              Please wait. Do not close or refresh this page.
            </p>
            {mode === "create" && (
              <p className="text-xs text-zinc-500 mt-3 leading-relaxed">
                This may take <strong>10 – 30 seconds</strong> while your ID and
                VISA photos are uploaded.
              </p>
            )}
          </div>
        </div>
      )}
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-sm border border-zinc-200 p-8">
        {showHeader && (
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
            {mode === "create" ? (
              <p className="text-sm text-zinc-500 mt-1">
                Please register by <strong>1 July 2026</strong>. One registration per family.
              </p>
            ) : (
              <p className="text-sm text-zinc-500 mt-1">
                Editing your registration. Make changes and click{" "}
                <strong>Save changes</strong> at the bottom.
              </p>
            )}
          </header>
        )}

        <fieldset disabled={submitting} className="contents">
          <form onSubmit={handleFormSubmit} className="space-y-8">
            <Section title="1. Your details">
              <Field label="Full name" required>
                <input
                  name="registrant_name"
                  required
                  defaultValue={initial?.registrant_name}
                  className={inputCls}
                />
              </Field>
              <Field label="Email" required>
                <input
                  name="email"
                  type="email"
                  required
                  defaultValue={initial?.email}
                  className={inputCls}
                />
              </Field>
              <div className="grid grid-cols-3 gap-3">
                <Field label="Country code">
                  <input
                    name="country_code"
                    defaultValue={initial?.country_code || "+91"}
                    className={inputCls}
                  />
                </Field>
                <div className="col-span-2">
                  <Field label="Phone" required>
                    <input
                      name="phone"
                      required
                      defaultValue={initial?.phone}
                      className={inputCls}
                    />
                  </Field>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="City">
                  <input name="city" defaultValue={initial?.city} className={inputCls} />
                </Field>
                <Field label="Country of residence">
                  <input
                    name="residence_country"
                    value={residenceCountry}
                    onChange={(e) => setResidenceCountry(e.target.value)}
                    className={inputCls}
                  />
                </Field>
              </div>
              <Field label="Your meal preference">
                <select
                  name="primary_meal_pref"
                  defaultValue={initial?.primary_meal_pref || ""}
                  className={inputCls}
                >
                  <option value="">Select...</option>
                  <option value="veg">Vegetarian</option>
                  <option value="non-veg">Non-vegetarian</option>
                  <option value="vegan">Vegan</option>
                  <option value="jain">Jain</option>
                </select>
              </Field>
              <Field label="Allergies / dietary notes">
                <input
                  name="primary_allergies"
                  defaultValue={initial?.primary_allergies}
                  placeholder="e.g. peanut allergy, lactose intolerant — leave blank if none"
                  className={inputCls}
                />
              </Field>

              <div className="pt-2 border-t border-zinc-200 space-y-3">
                <p className="text-sm font-medium text-zinc-700">
                  Your ID verification
                </p>
                <p className="text-xs text-zinc-500 -mt-2">
                  Required by the resort for check-in. Stored securely and deleted
                  30 days after the event.
                </p>

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
                      defaultValue={initial?.id_type === "aadhaar" ? initial?.id_number : ""}
                      className={inputCls}
                    />
                  </Field>
                ) : (
                  <>
                    <Field label="Passport number" required>
                      <input
                        name="id_number"
                        required
                        defaultValue={initial?.id_type === "passport" ? initial?.id_number : ""}
                        className={inputCls}
                      />
                    </Field>
                    <p className="text-xs text-zinc-500 -mt-1">
                      Passport country: <strong>{residenceCountry || "—"}</strong>{" "}
                      (taken from your country of residence above).
                    </p>
                  </>
                )}

                <Field
                  label={
                    mode === "edit" && initial?.has_existing_id_document
                      ? "Replace your ID photo — FRONT (optional)"
                      : "Upload your ID photo — FRONT (JPG / PNG / PDF, max 5 MB)"
                  }
                  required={mode === "create"}
                >
                  <input
                    name="id_document"
                    type="file"
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                    required={mode === "create"}
                    className="block w-full text-sm text-zinc-600 file:mr-3 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-zinc-900 file:text-white hover:file:bg-zinc-700"
                  />
                  {mode === "edit" && initial?.has_existing_id_document && (
                    <p className="text-xs text-zinc-500 mt-1">
                      Front already on file. Uploading a new file will replace it.
                    </p>
                  )}
                </Field>

                <Field
                  label={
                    mode === "edit" && initial?.has_existing_id_document_back
                      ? "Replace your ID photo — BACK (optional)"
                      : "Upload your ID photo — BACK (optional, for cards with a back side)"
                  }
                >
                  <input
                    name="id_document_back"
                    type="file"
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                    className="block w-full text-sm text-zinc-600 file:mr-3 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-zinc-900 file:text-white hover:file:bg-zinc-700"
                  />
                  {mode === "edit" && initial?.has_existing_id_document_back && (
                    <p className="text-xs text-zinc-500 mt-1">
                      Back already on file. Uploading a new file will replace it.
                    </p>
                  )}
                </Field>

                {isInternational && (
                  <>
                    <div className="bg-amber-50 border border-amber-200 text-amber-900 text-sm rounded-md p-3">
                      <strong>For international guests:</strong> the resort also
                      requires a clear photo of your <strong>VISA page</strong>{" "}
                      for check-in. Please upload it below.
                    </div>
                    <Field
                      label={
                        mode === "edit" && initial?.has_existing_visa_document
                          ? "Replace your VISA page photo (optional)"
                          : "Upload your VISA page photo (required)"
                      }
                      required={mode === "create"}
                    >
                      <input
                        name="visa_document"
                        type="file"
                        accept="image/jpeg,image/png,image/webp,application/pdf"
                        required={mode === "create"}
                        className="block w-full text-sm text-zinc-600 file:mr-3 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-zinc-900 file:text-white hover:file:bg-zinc-700"
                      />
                      {mode === "edit" && initial?.has_existing_visa_document && (
                        <p className="text-xs text-zinc-500 mt-1">
                          A VISA document is already on file. Uploading a new
                          file will replace it.
                        </p>
                      )}
                    </Field>
                  </>
                )}
              </div>
            </Section>

            <Section
              title="2. Family attending with you"
              subtitle={
                isInternational
                  ? "Add your spouse and any children who will attend. IMPORTANT: in this section please upload each FAMILY MEMBER's own ID photos (not yours). The resort requires an ID for every guest (adults and children). As your country of residence is outside India, please also upload each guest's VISA page."
                  : "Add your spouse and any children who will attend. IMPORTANT: in this section please upload each FAMILY MEMBER's own ID photos (not yours). The resort requires an ID for every guest (adults and children)."
              }
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
                  <MemberIdUpload member={m} idx={idx} mode={mode} />
                  {isInternational && (
                    <MemberVisaUpload member={m} idx={idx} mode={mode} />
                  )}
                </div>
              ))}

              <div className="flex gap-2">
                {!members.some((m) => m.type === "spouse") && (
                  <button
                    type="button"
                    onClick={() => addMember("spouse")}
                    className={btnSecondary}
                  >
                    + Add spouse
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => addMember("child")}
                  className={btnSecondary}
                >
                  + Add child
                </button>
              </div>
            </Section>

            <Section title="3. Travel details">
              <p className="text-xs text-zinc-500">
                Resort check-in is from 3:00 PM. Checkout is by 11:30 AM.
              </p>

              <div className="space-y-3">
                <p className="text-sm font-medium text-zinc-700">Arrival</p>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Date" required>
                    <input
                      name="arrival_date"
                      type="date"
                      required
                      defaultValue={initial?.arrival_date || "2026-07-17"}
                      className={inputCls}
                    />
                  </Field>
                  <Field label="Time" required>
                    <select
                      name="arrival_time"
                      required
                      defaultValue={initial?.arrival_time || ""}
                      className={inputCls}
                    >
                      <option value="" disabled>
                        Select...
                      </option>
                      {ARRIVAL_TIMES.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>
                <Field label="Mode of arrival">
                  <select
                    name="arrival_mode"
                    defaultValue={initial?.arrival_mode || ""}
                    className={inputCls}
                  >
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
                      defaultValue={initial?.departure_date || "2026-07-19"}
                      className={inputCls}
                    />
                  </Field>
                  <Field label="Time" required>
                    <select
                      name="departure_time"
                      required
                      defaultValue={initial?.departure_time || ""}
                      className={inputCls}
                    >
                      <option value="" disabled>
                        Select...
                      </option>
                      {DEPARTURE_TIMES.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>
                <Field label="Mode of departure">
                  <select
                    name="departure_mode"
                    defaultValue={initial?.departure_mode || ""}
                    className={inputCls}
                  >
                    <option value="">Select...</option>
                    <option value="flight">Flight</option>
                    <option value="train">Train</option>
                    <option value="car">Car</option>
                    <option value="other">Other</option>
                  </select>
                </Field>
              </div>
            </Section>

            <Section title="4. Pickup from airport / station">
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
                      <input
                        name="pickup_point_other"
                        required
                        defaultValue={initial?.pickup_point_other}
                        className={inputCls}
                      />
                    </Field>
                  )}

                  <Field label="Flight / Train number" required>
                    <input
                      name="arrival_ref"
                      required
                      placeholder="e.g. AI 671 or 12695"
                      defaultValue={initial?.arrival_ref}
                      className={inputCls}
                    />
                  </Field>
                  <Field label="Arrival airport / station" required>
                    <input
                      name="arrival_location"
                      required
                      placeholder="e.g. Cochin International Airport"
                      defaultValue={initial?.arrival_location}
                      className={inputCls}
                    />
                  </Field>
                </>
              )}
            </Section>

            <Section
              title="5. Event participation"
              subtitle="For each option, please tell us how many people from your family will attend so the resort can plan accurately."
            >
              <YesNoPax
                name="lunch_jul17"
                label="Lunch on 17 July (arrival day)?"
                maxFamilySize={familySize}
                initialYes={initial?.lunch_jul17}
                initialPax={initial?.lunch_jul17_pax}
              />
              <YesNoPax
                name="lunch_jul19"
                label="Lunch on 19 July (before checkout)?"
                maxFamilySize={familySize}
                initialYes={initial?.lunch_jul19}
                initialPax={initial?.lunch_jul19_pax}
              />
              <YesNoPax
                name="trek_jul18"
                label="Trek on 18 July at 7:30 AM — opt in?"
                maxFamilySize={familySize}
                initialYes={initial?.trek_jul18}
                initialPax={initial?.trek_jul18_pax}
              />
              <YesNoPax
                name="boat_jul18"
                label="Boat trip on 18 July at 3:30 PM — opt in?"
                hint="Total duration ~2.5 hrs (1.5 hr boat ride + ~30 min travel each way)."
                maxFamilySize={familySize}
                initialYes={initial?.boat_jul18}
                initialPax={initial?.boat_jul18_pax}
              />
            </Section>

            <Section
              title="6. Driver accommodation"
              subtitle="If you are travelling with a personal driver, please let us know if they need a place to stay during the event."
            >
              <Field label="Do you need accommodation arranged for your driver?">
                <div className="flex gap-4 mt-1">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="driver_accommodation_needed"
                      value="yes"
                      defaultChecked={initial?.driver_accommodation_needed === true}
                    />
                    Yes
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="driver_accommodation_needed"
                      value="no"
                      defaultChecked={initial?.driver_accommodation_needed !== true}
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

            <Section title="7. Anything else?">
              <Field label="Notes for the organizer">
                <textarea
                  name="notes"
                  rows={3}
                  defaultValue={initial?.notes}
                  className={inputCls}
                />
              </Field>
            </Section>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-3 text-sm">
                {error}
              </div>
            )}

            <p className="text-xs text-zinc-500 text-center">
              Submitting may take <strong>10 – 30 seconds</strong> while your
              photos upload. Please don&apos;t close the page after clicking.
              Use compressed photos (under 3 MB each) if you have a slow connection.
            </p>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-zinc-900 hover:bg-zinc-700 disabled:bg-zinc-700 disabled:cursor-not-allowed text-white font-medium py-3 rounded-lg transition flex items-center justify-center gap-3"
            >
              {submitting ? (
                <>
                  <span className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  <span>
                    {submittingLabel}
                    <AnimatedDots />
                  </span>
                </>
              ) : (
                submitLabel
              )}
            </button>
          </form>
        </fieldset>

        <footer className="mt-8 pt-6 border-t border-zinc-200 text-xs text-zinc-500 text-center space-y-1">
          <p>Questions?</p>
          <p>Rajan +91-7708366999 &nbsp;·&nbsp; Dinesh +91-9894636331</p>
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

function MemberVisaUpload({
  member,
  idx,
  mode,
}: {
  member: InitialMember;
  idx: number;
  mode: Mode;
}) {
  const hasExisting = !!member.has_existing_visa_document;
  const required = mode === "create" && !hasExisting;
  const owner = member.type === "spouse" ? "Spouse's" : "Child's";

  return (
    <Field
      label={
        hasExisting
          ? `Replace ${owner} VISA page photo (optional)`
          : `Upload ${owner} VISA page photo (required)`
      }
      required={required}
    >
      <input
        name={`member_${idx}_visa_document`}
        type="file"
        accept="image/jpeg,image/png,image/webp,application/pdf"
        required={required}
        className="block w-full text-sm text-zinc-600 file:mr-3 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-zinc-900 file:text-white hover:file:bg-zinc-700"
      />
      {hasExisting && (
        <p className="text-xs text-zinc-500 mt-1">
          A VISA is already on file. Uploading a new file will replace it.
        </p>
      )}
    </Field>
  );
}

function MemberIdUpload({
  member,
  idx,
  mode,
}: {
  member: InitialMember;
  idx: number;
  mode: Mode;
}) {
  const hasFront = !!member.has_existing_id_document;
  const hasBack = !!member.has_existing_id_document_back;
  const frontRequired = mode === "create" && !hasFront;
  const owner = member.type === "spouse" ? "Spouse's" : "Child's";

  return (
    <>
      <Field
        label={
          hasFront
            ? `Replace ${owner} ID photo — FRONT (optional)`
            : `Upload ${owner} ID photo — FRONT (required)`
        }
        required={frontRequired}
      >
        <input
          name={`member_${idx}_id_document`}
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          required={frontRequired}
          className="block w-full text-sm text-zinc-600 file:mr-3 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-zinc-900 file:text-white hover:file:bg-zinc-700"
        />
        {hasFront && (
          <p className="text-xs text-zinc-500 mt-1">
            Front already on file. Uploading a new file will replace it.
          </p>
        )}
      </Field>

      <Field
        label={
          hasBack
            ? `Replace ${owner} ID photo — BACK (optional)`
            : `Upload ${owner} ID photo — BACK (optional, for cards with a back side)`
        }
      >
        <input
          name={`member_${idx}_id_document_back`}
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          className="block w-full text-sm text-zinc-600 file:mr-3 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-zinc-900 file:text-white hover:file:bg-zinc-700"
        />
        {hasBack && (
          <p className="text-xs text-zinc-500 mt-1">
            Back already on file. Uploading a new file will replace it.
          </p>
        )}
      </Field>
    </>
  );
}

function YesNoPax({
  name,
  label,
  hint,
  maxFamilySize,
  initialYes,
  initialPax,
}: {
  name: string;
  label: string;
  hint?: string;
  maxFamilySize: number;
  initialYes?: boolean;
  initialPax?: number;
}) {
  const [yes, setYes] = useState(!!initialYes);
  const [pax, setPax] = useState(initialPax && initialPax > 0 ? initialPax : 1);

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
        <div className="mt-2 flex items-center gap-2 flex-wrap">
          <label className="text-sm text-zinc-700">How many people?</label>
          <select
            name={`${name}_pax`}
            value={Math.min(pax, Math.max(maxFamilySize, 1))}
            onChange={(e) => setPax(parseInt(e.target.value, 10))}
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm bg-white"
            required
          >
            {Array.from({ length: Math.max(maxFamilySize, 1) }, (_, i) => i + 1).map(
              (n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              )
            )}
          </select>
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
