import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { formatDateTime, formatFCFA } from "@/lib/format";
import {
  addEmployeeAction,
  toggleEmployeeAction,
  deleteEmployeeAction,
  clockAction,
} from "./actions";

const roleLabels: Record<string, string> = {
  GERANT: "Gérant",
  CUISINE: "Cuisine",
  SERVEUR: "Serveur",
  LIVREUR: "Livreur",
  CAISSIER: "Caissier",
};

export default async function PersonnelPage() {
  const user = await getSessionUser();
  if (!user) return null;
  if (!can(user, "personnel")) redirect("/dashboard");

  const employees = await prisma.employee.findMany({
    where: { restaurantId: user.restaurantId },
    orderBy: { name: "asc" },
    include: { timeEntries: { orderBy: { clockIn: "desc" }, take: 3 } },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold">Personnel</h1>
      <p className="mt-1 text-sm text-stone-500">
        Votre équipe et le pointage journalier.
      </p>

      {/* Ajouter un employé */}
      <form
        action={addEmployeeAction}
        className="card mt-6 flex flex-wrap gap-2"
      >
        <input
          name="name"
          required
          className="input flex-1 min-w-40"
          placeholder="Nom de l'employé"
        />
        <select name="role" className="input w-36">
          {Object.entries(roleLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <input
          name="phone"
          className="input w-36"
          placeholder="Téléphone (optionnel)"
        />
        <input
          name="monthlySalary"
          type="number"
          min={0}
          className="input w-40"
          placeholder="Salaire mensuel (FCFA)"
        />
        <button type="submit" className="btn btn-primary">
          Ajouter
        </button>
      </form>

      {/* Liste */}
      <div className="mt-6 grid gap-3 lg:grid-cols-2">
        {employees.length === 0 && (
          <p className="card text-sm text-stone-500">
            Aucun employé enregistré.
          </p>
        )}
        {employees.map((employee) => {
          const onDuty = employee.timeEntries.some((t) => !t.clockOut);
          return (
            <div
              key={employee.id}
              className={`card ${employee.active ? "" : "opacity-50"}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold">
                    {employee.name}{" "}
                    {onDuty && (
                      <span className="ml-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                        En service
                      </span>
                    )}
                  </p>
                  <p className="mt-0.5 text-sm text-stone-500">
                    {roleLabels[employee.role] ?? employee.role}
                    {employee.phone && ` · ${employee.phone}`}
                    {employee.monthlySalary != null &&
                      ` · ${formatFCFA(employee.monthlySalary)}/mois`}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <form action={clockAction}>
                    <input type="hidden" name="employeeId" value={employee.id} />
                    <button
                      type="submit"
                      className={`btn px-3 py-1 text-xs ${
                        onDuty ? "btn-secondary" : "btn-primary"
                      }`}
                    >
                      {onDuty ? "Fin de service" : "Début de service"}
                    </button>
                  </form>
                  <div className="flex gap-2 text-xs">
                    <form action={toggleEmployeeAction}>
                      <input type="hidden" name="id" value={employee.id} />
                      <button type="submit" className="text-stone-500 hover:underline">
                        {employee.active ? "Désactiver" : "Réactiver"}
                      </button>
                    </form>
                    <form action={deleteEmployeeAction}>
                      <input type="hidden" name="id" value={employee.id} />
                      <button type="submit" className="text-red-600 hover:underline">
                        Supprimer
                      </button>
                    </form>
                  </div>
                </div>
              </div>

              {employee.timeEntries.length > 0 && (
                <ul className="mt-3 space-y-1 border-t border-stone-100 pt-2 text-xs text-stone-500">
                  {employee.timeEntries.map((entry) => (
                    <li key={entry.id}>
                      {formatDateTime(entry.clockIn)}
                      {" → "}
                      {entry.clockOut ? formatDateTime(entry.clockOut) : "en cours…"}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}