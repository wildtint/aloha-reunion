import { createServerSupabase } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createServerSupabase();
  const { error } = await supabase.from("families").select("id").limit(1);

  const connectionOk = !error;

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 px-6 py-16">
      <div className="max-w-xl w-full bg-white rounded-2xl shadow-sm border border-zinc-200 p-10 text-center">
        <p className="text-sm uppercase tracking-widest text-zinc-500 mb-3">
          Aloha Batch
        </p>
        <h1 className="text-3xl font-semibold text-zinc-900 mb-4">
          Get-Together 35th Year Reunion
        </h1>
        <p className="text-zinc-600 mb-2">
          17 – 19 July 2026
        </p>
        <p className="text-zinc-600 mb-8">
          Spice Village – CGH Earth, Thekkady
        </p>

        <div className="border-t border-zinc-200 pt-6 mt-6 text-sm">
          <p className="text-zinc-500 mb-2">Setup status</p>
          {connectionOk ? (
            <p className="text-green-700 font-medium">
              ✓ Connected to Supabase
            </p>
          ) : (
            <p className="text-red-700 font-medium">
              ✗ Supabase connection failed: {error?.message}
            </p>
          )}
        </div>

        <a
          href="/register"
          className="inline-block mt-8 bg-zinc-900 hover:bg-zinc-700 text-white font-medium px-6 py-3 rounded-lg transition"
        >
          Register now
        </a>
        <p className="text-xs text-zinc-400 mt-6">
          Registration closes 1 July 2026
        </p>
      </div>
    </main>
  );
}
