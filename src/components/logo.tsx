import Image from "next/image";
import Link from "next/link";

// Logo RestoKonect cliquable, pointe vers l'accueil par défaut.
// Dans l'espace connecté, passer href="/dashboard" (l'accueil du restaurant).
export default function Logo({
  href = "/",
  size = 64,
}: {
  href?: string;
  size?: number;
}) {
  return (
    <Link href={href} aria-label="RestoKonect — Accueil">
      <Image
        src="/logo.png"
        alt="Logo RestoKonect"
        width={size}
        height={size}
        className="rounded-lg"
      />
    </Link>
  );
}