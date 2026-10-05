"use client";

import { useActionState } from "react";
import { createUserAction, type EquipeState } from "./actions";
import { ROLE_LABELS, type Role } from "@/lib/permissions";

const initialState: EquipeState = {};

export default function AddUserForm() {
  const [state, formAction, pending] = useActionState(
    createUserAction,
    initialState
  );

  return (
    <form action={formAction} className="card space-y-4">
      <h2 className="font-semibold">Créer un compte</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="mb-1 block text-sm font-medium">
            Nom
          </label>
          <input id="name" name="name" required className="input" />
        </div>
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="input"
            placeholder="serveur@restaurant.ci"
          />
        </div>
        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-medium">
            Mot de passe
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={6}
            className="input"
            placeholder="6 caractères minimum"
          />
        </div>
        <div>
          <label htmlFor="role" className="mb-1 block text-sm font-medium">
            Rôle
          </label>
          <select id="role" name="role" className="input" defaultValue="SERVEUR">
            {(Object.keys(ROLE_LABELS) as Role[])
              .filter((r) => r !== "GERANT")
              .map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABELS[r]}
                </option>
              ))}
            <option value="GERANT">Gérant</option>
          </select>
        </div>
      </div>

      <p className="text-xs text-stone-500">
        <strong>Serveur</strong> : prise de commande seulement.{" "}
        <strong>Caissier</strong> : caisse complète + journal.{" "}
        <strong>Gérant</strong> : tout.
      </p>

      {state.error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}
      {state.success && (
        <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">
          {state.success}
        </p>
      )}

      <button type="submit" disabled={pending} className="btn btn-primary w-fit">
        {pending ? "Création..." : "Créer le compte"}
      </button>
    </form>
  );
}