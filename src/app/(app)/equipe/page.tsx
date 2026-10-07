import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { can, ROLE_LABELS, type Role } from "@/lib/permissions";
import { getPlanInfo } from "@/lib/plans";
import { prisma } from "@/lib/db";
import { formatDateTime } from "@/lib/format";
import AddUserForm from "./add-user-form";
import { deleteUserAction } from "./actions";

export default async function EquipePage() {
  const user = await getSessionUser();
  if (!user) return null;
  if (!can(user, "equipe")) redirect("/dashboard");

  const users = await prisma.user.findMany({
    where: { restaurantId: user.restaurantId },
    orderBy: { createdAt: "asc" },
  });
  const info = getPlanInfo(user.restaurant);

  return (
    <div>
      <h1 className="text-2xl font-bold">Comptes</h1>
      <p className="mt-1 text-sm text-stone-500">
        Qui peut se connecter à RestoKonect pour {user.restaurant.name}, et
        avec quels droits.
      </p>

      <div className="mt-6">
        <AddUserForm />
      </div>

      <div className="card mt-6">
        <h2 className="font-semibold">
          Comptes existants ({users.length}/{info.limits.users} — plan{" "}
          {info.limits.label})
        </h2>
        <ul className="mt-3 divide-y divide-stone-100">
          {users.map((account) => (
            <li
              key={account.id}
              className="flex flex-wrap items-center gap-3 py-3"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">
                  {account.name}
                  {account.id === user.id && (
                    <span className="ml-2 rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700">
                      vous
                    </span>
                  )}
                </p>
                <p className="text-xs text-stone-500">
                  {account.email} · créé le {formatDateTime(account.createdAt)}
                </p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-medium ${
                  account.role === "GERANT"
                    ? "bg-orange-100 text-orange-800"
                    : "bg-stone-100 text-stone-700"
                }`}
              >
                {ROLE_LABELS[account.role as Role] ?? account.role}
              </span>
              {account.id !== user.id && (
                <form action={deleteUserAction}>
                  <input type="hidden" name="id" value={account.id} />
                  <button
                    type="submit"
                    className="text-xs font-medium text-red-600 hover:underline"
                  >
                    Supprimer
                  </button>
                </form>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}