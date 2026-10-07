import Link from "next/link";
import Logo from "@/components/logo";
import { whatsappSubscribeUrlForPlan } from "@/lib/plans";

const plans = [
  {
    name: "Starter",
    price: "5 900 F",
    period: "par mois",
    highlight: false,
    features: [
      "Jusqu'à 3 comptes (gérant, caissier, serveur)",
      "20 produits maximum dans le menu",
      "Caisse complète (espèces & Mobile Money)",
      "Menu QR + commandes WhatsApp en temps réel",
      "Impression des tickets",
      "Journal des ventes",
    ],
  },
  {
    name: "Pro",
    price: "11 900 F",
    period: "par mois",
    highlight: true,
    features: [
      "Jusqu'à 7 comptes",
      "60 produits maximum dans le menu",
      "Tout le plan Starter",
      "Gestion du stock avec alertes",
      "Personnel & pointage",
      "Statistiques avancées + export Excel",
    ],
  },
  {
    name: "Business",
    price: "24 900 F",
    period: "par mois",
    highlight: false,
    features: [
      "Jusqu'à 15 comptes",
      "200 produits maximum dans le menu",
      "Tout le plan Pro",
      "Accompagnement et formation sur place",
      "Support prioritaire 7j/7",
    ],
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
              Essai gratuit
            </Link>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-6 py-12">
        <h1 className="text-center text-3xl font-bold sm:text-4xl">
          Nos Tarifs
        </h1>
        <p className="mt-3 text-center text-lg text-stone-600">
          Simple et transparent, en FCFA, sans engagement.
          <br />
          <span className="font-semibold text-orange-600">
            🎁 Commencez par 14 jours d&apos;essai gratuit — sans carte
            bancaire.
          </span>
        </p>

        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          {plans.map((plan) => {
            const waUrl = whatsappSubscribeUrlForPlan(plan.name, plan.price);
            return (
              <div
                key={plan.name}
                className={`card flex flex-col ${
                  plan.highlight ? "border-2 border-orange-500 shadow-lg" : ""
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
                <a
                  href={waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`btn mt-6 w-full py-2.5 ${
                    plan.highlight ? "btn-primary" : "btn-secondary"
                  }`}
                >
                  💬 S&apos;abonner via WhatsApp
                </a>
              </div>
            );
          })}
        </div>

        <div className="mt-10 rounded-2xl bg-stone-100 px-6 py-5 text-center text-sm text-stone-600">
          <p>
            <strong>Comment ça marche :</strong> créez votre compte, testez
            gratuitement pendant 14 jours (1 compte, 10 plats). À la fin de
            l&apos;essai, choisissez votre plan et abonnez-vous en deux
            messages sur WhatsApp. Paiement par Mobile Money accepté.
          </p>
          <p className="mt-2">
            Une question ?{" "}
            <a
              href="https://wa.me/2250748323191?text=Bonjour%20RestoKonect%20!%20J'ai%20une%20question%20sur%20vos%20tarifs."
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-[#128C4A] hover:underline"
            >
              💬 Écrivez-nous sur WhatsApp
            </a>{" "}
            ou consultez le{" "}
            <a
              href="/guide-restokonect.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-orange-600 hover:underline"
            >
              guide de démarrage
            </a>
            .
          </p>
        </div>
      </section>
    </main>
  );
}