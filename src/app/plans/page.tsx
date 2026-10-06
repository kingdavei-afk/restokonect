import Link from "next/link";
import Logo from "@/components/logo";

const WHATSAPP_URL =
  "https://wa.me/2250748323191?text=" +
  encodeURIComponent(
    "Bonjour RestoKonect ! J'ai une question sur vos tarifs pour mon restaurant."
  );

const plans = [
  {
    name: "Découverte",
    price: "Gratuit",
    period: "pour toujours",
    highlight: false,
    features: [
      "Caisse complète (espèces & Mobile Money)",
      "Menu digital avec catégories",
      "Journal des ventes",
      "1 compte gérant",
    ],
    cta: "Commencer gratuitement",
  },
  {
    name: "Starter",
    price: "5 000 F",
    period: "par mois",
    highlight: true,
    features: [
      "Tout le plan Découverte",
      "Menu QR + commandes WhatsApp",
      "Notifications temps réel à la caisse",
      "Impression des tickets",
      "Jusqu'à 3 comptes (gérant, caissier, serveur)",
    ],
    cta: "Essayer gratuitement",
  },
  {
    name: "Pro",
    price: "12 500 F",
    period: "par mois",
    highlight: false,
    features: [
      "Tout le plan Starter",
      "Gestion du stock avec alertes",
      "Personnel & pointage",
      "Statistiques avancées + export Excel",
      "Comptes illimités & support prioritaire",
    ],
    cta: "Essayer gratuitement",
  },
];

export default function PlansPage() {
  return (
    <main className="min-h-screen">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
          <Logo />
          <div className="flex items-center gap-2">
            <Link href="/" className="btn btn-secondary">
              Retour
            </Link>
            <Link href="/register" className="btn btn-primary">
              Créer un compte
            </Link>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-6 py-12">
        <h1 className="text-center text-3xl font-bold sm:text-4xl">
          Nos Tarifs
        </h1>
        <p className="mt-3 text-center text-lg text-stone-600">
          Simple et transparent. En FCFA, sans engagement.
          <br />
          <span className="font-semibold text-orange-600">
            🎉 Tout est gratuit pendant la période de lancement !
          </span>
        </p>

        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`card flex flex-col ${
                plan.highlight
                  ? "border-2 border-orange-500 shadow-lg"
                  : ""
              }`}
            >
              {plan.highlight && (
                <p className="-mt-1 mb-2 text-center text-xs font-bold uppercase tracking-wide text-orange-600">
                  ⭐ Le plus populaire
                </p>
              )}
              <h2 className="text-xl font-bold">{plan.name}</h2>
              <p className="mt-2">
                <span className="text-3xl font-bold">{plan.price}</span>{" "}
                <span className="text-sm text-stone-500">/ {plan.period}</span>
              </p>
              <ul className="mt-4 flex-1 space-y-2 text-sm text-stone-700">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex gap-2">
                    <span className="text-green-600">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>
              <Link
                href="/register"
                className={`btn mt-6 w-full py-2.5 ${
                  plan.highlight ? "btn-primary" : "btn-secondary"
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>

        <div className="card mt-10 flex flex-col items-center gap-2 text-center">
          <h2 className="text-lg font-semibold">Une question sur les tarifs ?</h2>
          <p className="text-sm text-stone-600">
            Écrivez-nous directement sur WhatsApp, nous répondons en français.
          </p>
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="btn mt-1 bg-[#25D366] px-6 py-2.5 text-white hover:brightness-95"
          >
            💬 Discuter sur WhatsApp
          </a>
          <a
            href="/guide-restokonect.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 text-sm font-semibold text-orange-600 hover:underline"
          >
            📖 Découvrir l&apos;app avec le guide de démarrage (PDF)
          </a>
        </div>
      </section>
    </main>
  );
}