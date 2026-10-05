"use client";

import Link from "next/link";
import { useActionState } from "react";
import { registerAction, type RegisterState } from "./actions";

const initialState: RegisterState = {};

export default function RegisterPage() {
  const [state, formAction, pending] = useActionState(
    registerAction,
    initialState
  );

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-10">
      <div className="card w-full max-w-sm">
        <h1 className="text-xl font-bold">Créer votre restaurant</h1>
        <p className="mt-1 text-sm text-stone-500">
          Gratuit pendant le MVP. Aucune carte bancaire requise.
        </p>

        <form action={formAction} className="mt-6 space-y-4">
          <div>
            <label
              htmlFor="restaurantName"
              className="mb-1 block text-sm font-medium"
            >
              Nom du restaurant
            </label>
            <input
              id="restaurantName"
              name="restaurantName"
              required
              className="input"
              placeholder="Maquis Chez Tantie"
            />
          </div>
          <div>
            <label htmlFor="name" className="mb-1 block text-sm font-medium">
              Votre nom
            </label>
            <input
              id="name"
              name="name"
              required
              className="input"
              placeholder="Awa Koné"
            />
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
              placeholder="vous@restaurant.ci"
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="mb-1 block text-sm font-medium"
            >
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

          {state.error && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              {state.error}
            </p>
          )}

          <button type="submit" disabled={pending} className="btn btn-primary w-full">
            {pending ? "Création..." : "Créer mon compte"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-stone-500">
          Déjà un compte ?{" "}
          <Link href="/login" className="font-semibold text-orange-600">
            Se connecter
          </Link>
        </p>
      </div>
    </main>
  );
}