import Link from "next/link";

const reports = [
  {
    href: "/admin/printables/families",
    title: "Family details (all)",
    desc: "One full page per family with ID number, ID photo, contact, meal selections, check-in/out times, pickup details and event opt-ins. For resort check-in.",
  },
  {
    href: "/admin/printables/meals",
    title: "Day-wise meal pax",
    desc: "Lunch 17 Jul + Lunch 19 Jul totals broken down by veg / non-veg / vegan / jain.",
  },
  {
    href: "/admin/printables/trek",
    title: "Trek roster (18 Jul, 7:30 AM)",
    desc: "Families opting in with pax counts.",
  },
  {
    href: "/admin/printables/boat",
    title: "Boat trip roster (18 Jul, 3:30 PM)",
    desc: "Families opting in with pax counts.",
  },
  {
    href: "/admin/printables/pickup",
    title: "Pickup schedule",
    desc: "Sorted by arrival time. Shows pickup point, flight/train ref, family contact.",
  },
];

export default function PrintablesIndex() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">Resort Printables</h1>
        <p className="text-sm text-zinc-500 mt-1">
          Open any report and use your browser's Print (Ctrl/Cmd + P) — the page is
          formatted for A4 with navigation hidden in the print preview.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        {reports.map((r) => (
          <Link
            key={r.href}
            href={r.href}
            className="block bg-white border border-zinc-200 rounded-lg p-5 hover:border-zinc-400 transition"
          >
            <div className="font-semibold text-zinc-900">{r.title}</div>
            <div className="text-sm text-zinc-600 mt-1">{r.desc}</div>
            <div className="text-sm text-blue-700 mt-2">Open →</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
