export default async function ThanksPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return (
    <main className="min-h-screen bg-zinc-50 flex items-center justify-center px-6 py-16">
      <div className="max-w-xl w-full bg-white rounded-2xl shadow-sm border border-zinc-200 p-10 text-center">
        <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center text-green-700 text-2xl">
          ✓
        </div>
        <h1 className="text-2xl font-semibold text-zinc-900 mb-3">
          Registration received
        </h1>
        <p className="text-zinc-600 mb-6">
          Thank you for registering for the Aloha Batch 35th Year Reunion.
          We'll send a confirmation by email shortly.
        </p>

        {token && (
          <div className="bg-zinc-50 border border-zinc-200 rounded-md p-4 text-left text-sm">
            <p className="text-zinc-700 font-medium mb-1">Your reference:</p>
            <p className="font-mono text-xs text-zinc-600 break-all">{token}</p>
            <p className="text-xs text-zinc-500 mt-2">
              Save this if you'd like to update your details later.
            </p>
          </div>
        )}

        <div className="text-xs text-zinc-400 mt-8 space-y-1">
          <p>Questions?</p>
          <p>Rajan +91-7708366999 · Dinesh +91-9894636331</p>
        </div>
      </div>
    </main>
  );
}
