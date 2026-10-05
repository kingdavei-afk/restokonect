import Link from "next/link";
import Image from "next/image";

const features = [
  {
    title: "Caisse rapide",
    description:
      "Prenez les commandes en deux taps, encaissez en espèces ou Mobile Money (Wave, MoMo, OM), imprimez le ticket.",
    image: "/images/waitress-counter.jpg",
    alt: "Caissière souriante derrière la caisse d'un restaurant",
  },
  {
    title: "Menu QR + WhatsApp",
    description:
      "Un QR code sur chaque table. Le client scanne, choisit et commande directement sur votre WhatsApp.",
    image: "/images/waitress-notepad.jpg",
    alt: "Serveuse prenant une commande au carnet dans un restaurant",
  },
  {
    title: "Stock sous contrôle",
    description:
      "Riz, huile, poulet, charbon… Suivez vos entrées et sorties, soyez alerté avant la rupture.",
    image: "/images/chef.jpg",
    alt: "Chef africain souriant devant le buffet de son restaurant",
  },
  {
    title: "Équipe & pointage",
    description:
      "Comptes serveur, caissier et gérant avec droits limités. Pointage début et fin de service.",
    image: "/images/cashier-cap.jpg",
    alt: "Caissière africaine en casquette rouge derrière son comptoir",
  },
];

export default function Home() {
  return (
    <main>
      {/* Barre de navigation */}
      <header className="sticky top-0 z-10 border-b border-stone-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <p className="text-lg font-bold tracking-tight">
            Resto<span className="text-orange-600">Konect</span>
          </p>
          <div className="flex items-center gap-2">
            <Link href="/login" className="btn btn-secondary">
              Se connecter
            </Link>
            <Link href="/register" className="btn btn-primary">
              Créer un compte
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-6 py-14 lg:grid-cols-2 lg:py-20">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-700">
            🇨🇮 Conçu pour les restaurants d&apos;Abidjan
          </p>
          <h1 className="mt-4 text-4xl font-bold leading-tight sm:text-5xl">
            Votre maquis, géré comme un{" "}
            <span className="text-orange-600">grand restaurant.</span>
          </h1>
          <p className="mt-4 text-lg text-stone-600">
            La caisse, le stock et le personnel de votre restaurant — en un
            seul endroit. Simple, rapide, et pensé pour le Mobile Money.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/register"
              className="btn btn-primary px-6 py-3 text-base"
            >
              Essayer gratuitement
            </Link>
            <Link
              href="/login"
              className="btn btn-secondary px-6 py-3 text-base"
            >
              J&apos;ai déjà un compte
            </Link>
          </div>
          <p className="mt-4 text-sm text-stone-500">
            Sans carte bancaire · Prêt en 5 minutes · Support en français
          </p>
        </div>

        {/* Collage photos */}
        <div className="relative">
          <Image
            src="/images/waitress-counter.jpg"
            alt="Serveuse africaine souriante derrière la caisse de son restaurant"
            width={900}
            height={600}
            priority
            className="w-full rounded-2xl object-cover shadow-lg"
          />
          <Image
            src="/images/waitress-notepad.jpg"
            alt="Serveuse africaine prenant la commande d'un client"
            width={900}
            height={600}
            className="absolute -bottom-8 -left-4 hidden w-44 rounded-xl border-4 border-white object-cover shadow-xl sm:block lg:w-56"
          />
          <div className="absolute -right-3 -top-4 rounded-xl bg-orange-600 px-4 py-3 text-white shadow-lg">
            <p className="text-xs font-medium opacity-90">Encaissé aujourd&apos;hui</p>
            <p className="text-xl font-bold">184 500 F</p>
          </div>
        </div>
      </section>

      {/* Fonctionnalités */}
      <section className="border-y border-stone-200 bg-white py-16">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-center text-3xl font-bold">
            Tout ce qu&apos;il faut pour tenir votre restaurant
          </h2>
          <p className="mt-2 text-center text-stone-600">
            Du comptoir à la cuisine, RestoKonect remplace le carnet et la
            calculatrice.
          </p>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="card overflow-hidden p-0 transition hover:shadow-md"
              >
                <Image
                  src={feature.image}
                  alt={feature.alt}
                  width={900}
                  height={600}
                  className="h-40 w-full object-cover"
                />
                <div className="p-4">
                  <h3 className="font-semibold">{feature.title}</h3>
                  <p className="mt-1 text-sm text-stone-600">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bandeau confiance */}
      <section className="mx-auto max-w-6xl px-6 py-14">
        <div className="grid gap-6 rounded-2xl bg-orange-600 px-8 py-10 text-white sm:grid-cols-3">
          <div className="text-center">
            <p className="text-3xl font-bold">100 % FCFA</p>
            <p className="mt-1 text-sm text-orange-100">
              Prix en francs CFA, sans centimes ni conversion
            </p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold">📱 Mobile Money</p>
            <p className="mt-1 text-sm text-orange-100">
              Espèces, Wave, Orange Money et MTN MoMo à la caisse
            </p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold">3 rôles</p>
            <p className="mt-1 text-sm text-orange-100">
              Gérant, caissier et serveur, chacun avec ses droits
            </p>
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="mx-auto max-w-6xl px-6 pb-20 text-center">
        <h2 className="text-3xl font-bold">
          Prêt à digitaliser votre restaurant ?
        </h2>
        <p className="mx-auto mt-2 max-w-xl text-stone-600">
          Créez votre compte, ajoutez vos plats et encaissez votre premier
          ticket aujourd&apos;hui même.
        </p>
        <Link
          href="/register"
          className="btn btn-primary mt-6 px-8 py-3 text-base"
        >
          Créer mon compte restaurant
        </Link>
      </section>

      <footer className="border-t border-stone-200 py-6 text-center text-sm text-stone-500">
        RestoKonect — Fait avec ❤️ pour les restaurants d&apos;Abidjan
      </footer>
    </main>
  );
}