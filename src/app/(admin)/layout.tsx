import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import Logo from "@/components/logo";
import AdminNav from "@/components/admin-nav";
import { adminLogoutAction } from "./actions";

export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.role !== "SUPERADMIN") redirect("/dashboard");

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-60 shrink-0 flex-col bg-stone-900 text-white">
        <div className="border-b border-stone-700 px-4 py-4">
          <Logo href="/admin" size={40} />
          <p className="mt-2 text-xs font-semibold uppercase tracking-widest text-stone-400">
            Supervision
          </p>
          <p className="truncate text-sm font-semibold">{user.name}</p>
        </div>

        <AdminNav />

        <div className="mt-auto border-t border-stone-700 p-3">
          <form action={adminLogoutAction}>
            <button
              type="submit"
              className="w-full rounded-lg border border-stone-600 px-3 py-2 text-sm font-medium text-stone-200 hover:bg-stone-800"
            >
              Se déconnecter
            </button>
          </form>
        </div>
      </aside>

      <main className="flex-1 bg-stone-50 p-6">{children}</main>
    </div>
  );
}