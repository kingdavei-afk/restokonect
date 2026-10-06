import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { ROLE_PERMISSIONS, type Permission } from "@/lib/permissions";
import SideNav from "@/components/side-nav";
import Logo from "@/components/logo";
import { logoutAction } from "./actions";

export default async function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const permissions: Permission[] =
    ROLE_PERMISSIONS[user.role as keyof typeof ROLE_PERMISSIONS] ?? [];

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-56 shrink-0 flex-col border-r border-stone-200 bg-white">
        <div className="border-b border-stone-200 px-4 py-4">
          <Logo href="/dashboard" size={56} />
          <p className="mt-2 truncate text-sm font-semibold text-stone-800">
            {user.restaurant.name}
          </p>
          <p className="truncate text-xs text-stone-500">{user.name}</p>
        </div>

        <SideNav permissions={permissions} />

        <div className="mt-auto border-t border-stone-200 p-3">
          <form action={logoutAction}>
            <button type="submit" className="btn btn-secondary w-full">
              Se déconnecter
            </button>
          </form>
        </div>
      </aside>

      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}