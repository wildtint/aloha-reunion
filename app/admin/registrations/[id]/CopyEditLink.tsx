"use client";

import { useState, useTransition } from "react";
import { sendEditLinkEmailAction } from "./sendActions";

export default function CopyEditLink({
  editUrl,
  registrantName,
  familyId,
  email,
}: {
  editUrl: string;
  registrantName: string;
  familyId: string;
  email: string;
}) {
  const [copied, setCopied] = useState(false);
  const [emailStatus, setEmailStatus] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function sendEmail() {
    setEmailStatus(null);
    startTransition(async () => {
      const r = await sendEditLinkEmailAction(familyId);
      setEmailStatus(r.ok ? `Sent to ${email}` : `Error: ${r.error}`);
    });
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(editUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      alert(`Could not copy. Use this link:\n\n${editUrl}`);
    }
  }

  const waMessage = encodeURIComponent(
    `Hi ${registrantName},\n\nIf you'd like to update your registration for the Aloha Batch 35th Year Reunion, please use this link:\n\n${editUrl}\n\nRegards,\nRajan +91-7708366999 / Dinesh +91-9894636331`
  );
  const mailSubject = encodeURIComponent(
    "Update your Aloha Reunion registration"
  );
  const mailBody = waMessage;

  return (
    <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-4 space-y-3">
      <div>
        <div className="text-xs uppercase tracking-wider text-zinc-500 font-medium mb-1">
          Edit link (share with guest)
        </div>
        <input
          readOnly
          value={editUrl}
          className="w-full text-xs font-mono bg-white border border-zinc-300 rounded px-2 py-1.5"
          onFocus={(e) => e.target.select()}
        />
      </div>
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={copy}
          className="text-xs px-3 py-1.5 bg-zinc-900 hover:bg-zinc-700 text-white rounded"
        >
          {copied ? "Copied ✓" : "Copy link"}
        </button>
        <button
          onClick={sendEmail}
          disabled={pending}
          className="text-xs px-3 py-1.5 bg-blue-700 hover:bg-blue-800 disabled:bg-blue-400 text-white rounded"
        >
          {pending ? "Sending..." : "Send by email"}
        </button>
        <a
          href={`https://wa.me/?text=${waMessage}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs px-3 py-1.5 border border-zinc-300 rounded hover:bg-white text-zinc-700"
        >
          Share via WhatsApp
        </a>
        <a
          href={`mailto:?subject=${mailSubject}&body=${mailBody}`}
          className="text-xs px-3 py-1.5 border border-zinc-300 rounded hover:bg-white text-zinc-700"
        >
          Open mail app
        </a>
      </div>
      {emailStatus && (
        <p
          className={`text-xs ${emailStatus.startsWith("Error") ? "text-red-700" : "text-green-700"}`}
        >
          {emailStatus}
        </p>
      )}
      <p className="text-xs text-zinc-500">
        Anyone with this link can edit this registration.
      </p>
    </div>
  );
}
