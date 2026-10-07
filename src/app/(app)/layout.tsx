import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { ROLE_PERMISSIONS, type Permission } from "@/lib/permissions";
import SideNav from "@/components/side-nav";
import Logo from "@/components/logo";
import { getPlanInfo, whatsappSubscribeUrl } from "@/lib/plans";
import { logoutAction } from "./actions";

export default async function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  // Le super-admin a sa propre section (/admin)
  if (user.role === "SUPERADMIN") redirect("/admin");
  // Restaurant suspendu : session coupée
  if (!user.restaurant) redirect("/login");

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

      <main className="flex-1 p-6">
        {(() => {
          const info = getPlanInfo(user.restaurant);
          if (info.trialExpired) {
            return (
              <a
                href={whatsappSubscribeUrl(user.restaurant.name)}
                target="_blank"
                rel="noopener noreferrer"
                className="mb-4 block rounded-lg bg-orange-600 px-4 py-3 text-center text-sm font-bold text-white shadow hover:bg-orange-700"
              >
                ⏳ Votre période d&apos;essai gratuite est terminée — Cliquez ici
                pour vous abonner via WhatsApp
              </a>
            );
          }
          if (info.onTrial) {
            return (
              <div className="mb-4 rounded-lg bg-orange-100 px-4 py-2 text-center text-sm text-orange-800">
                🎁 Période d&apos;essai — <strong>{info.daysLeft} jour(s) restant(s)</strong>{" "}
                (limité à {info.limits.users} compte et {info.limits.products} plats)
              </div>
            );
          }
          return null;
        })()}
        {children}
      </main>
    </div>
  );
}