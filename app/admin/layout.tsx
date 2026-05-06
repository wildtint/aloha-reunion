import { createServerSupabase } from "@/lib/supabase/server";
import { signOut } from "./login/actions";
import Link from "next/link";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Login page renders without the chrome
  if (!user) return <>{children}</>;

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="bg-white border-b border-zinc-200">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/admin" className="font-semibold text-zinc-900">
              Aloha Admin
            </Link>
            <nav className="flex gap-4 text-sm">
              <Link href="/admin" className="text-zinc-600 hover:text-zinc-900">
                Registrations
              </Link>
              <span className="text-zinc-300">·</span>
              <Link href="/admin/payments" className="text-zinc-600 hover:text-zinc-900">
                Payments
              </Link>
              <span className="text-zinc-300">·</span>
              <Link href="/admin/printables" className="text-zinc-600 hover:text-zinc-900">
                Printables
              </Link>
              <span className="text-zinc-300">·</span>
              <Link href="/admin/exports" className="text-zinc-600 hover:text-zinc-900">
                Exports
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-zinc-500 hidden sm:inline">{user.email}</span>
            <form action={signOut}>
              <button className="text-zinc-700 hover:text-zinc-900 underline">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-6 py-8">{children}</main>
    </div>
  );
}
