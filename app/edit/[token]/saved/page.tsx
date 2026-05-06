import Link from "next/link";

export default async function SavedPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  return (
    <main className="min-h-screen bg-zinc-50 flex items-center justify-center px-6 py-16">
      <div className="max-w-xl w-full bg-white rounded-2xl shadow-sm border border-zinc-200 p-10 text-center">
        <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center text-green-700 text-2xl">
          ✓
        </div>
        <h1 className="text-2xl font-semibold text-zinc-900 mb-3">
          Changes saved
        </h1>
        <p className="text-zinc-600 mb-6">
          Your registration has been updated. You can edit again any time using the
          same link.
        </p>

        <Link
          href={`/edit/${token}`}
          className="inline-block bg-zinc-900 hover:bg-zinc-700 text-white font-medium px-5 py-2.5 rounded-lg"
        >
          Edit again
        </Link>

        <div className="text-xs text-zinc-400 mt-8 space-y-1">
          <p>Questions?</p>
          <p>Rajan +91-7708366999 · Dinesh +91-9894636331</p>
        </div>
      </div>
    </main>
  );
}
