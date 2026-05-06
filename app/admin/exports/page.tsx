const exports_list = [
  {
    href: "/admin/export/registrations",
    title: "Registrations (full)",
    desc: "All families with their travel, event, meal, pickup, payment status, and family members consolidated into one row per family. Best for sharing with the resort or doing analysis in Excel.",
    file: "aloha-registrations-{date}.csv",
  },
  {
    href: "/admin/export/members",
    title: "Members (one row per spouse / child)",
    desc: "One row per family member with their meal pref, allergies, and ID/VISA upload status. Useful for headcount and meal-mix planning.",
    file: "aloha-members-{date}.csv",
  },
  {
    href: "/admin/export/payments",
    title: "Payments",
    desc: "Every payment recorded so far with amount, mode, date, and notes. Use it for reconciliation and accounting.",
    file: "aloha-payments-{date}.csv",
  },
];

export default function ExportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">Exports</h1>
        <p className="text-sm text-zinc-500 mt-1">
          Download CSV files of your data. They open in Excel or Google Sheets.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        {exports_list.map((e) => (
          <div
            key={e.href}
            className="bg-white border border-zinc-200 rounded-lg p-5 flex flex-col"
          >
            <div className="font-semibold text-zinc-900">{e.title}</div>
            <div className="text-sm text-zinc-600 mt-1 mb-4 flex-1">{e.desc}</div>
            <div className="text-xs text-zinc-400 font-mono mb-3">{e.file}</div>
            <a
              href={e.href}
              className="inline-block bg-zinc-900 hover:bg-zinc-700 text-white text-sm font-medium px-4 py-2 rounded-md text-center"
            >
              Download CSV
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
