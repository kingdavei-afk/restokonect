"use client";

import Link from "next/link";
import { useActionState } from "react";
import Logo from "@/components/logo";
import { loginAction, type LoginState } from "./actions";

const initialState: LoginState = {};

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="card w-full max-w-sm">
        <div className="flex justify-center">
          <Logo href="/" size={120} />
        </div>
        <h1 className="mt-4 text-center text-xl font-bold">Connexion</h1>
        <p className="mt-1 text-center text-sm text-stone-500">
          Accédez à l&apos;espace de votre restaurant.
        </p>

        <form action={formAction} className="mt-6 space-y-4">
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
              className="input"
              placeholder="••••••••"
            />
          </div>

          {state.error && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              {state.error}
            </p>
          )}

          <button type="submit" disabled={pending} className="btn btn-primary w-full">
            {pending ? "Connexion..." : "Se connecter"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-stone-500">
          Pas encore de compte ?{" "}
          <Link href="/register" className="font-semibold text-orange-600">
            Créer un restaurant
          </Link>
        </p>
      </div>
    </main>
  );
}