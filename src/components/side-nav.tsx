"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import type { Permission } from "@/lib/permissions";

const links: {
  href: string;
  label: string;
  perm: Permission | null;
}[] = [
  { href: "/dashboard", label: "Tableau de bord", perm: null },
  { href: "/caisse", label: "Caisse", perm: "caisse" },
  { href: "/menu", label: "Menu & plats", perm: "menu" },
  { href: "/stock", label: "Stock", perm: "stock" },
  { href: "/personnel", label: "Personnel", perm: "personnel" },
  { href: "/journal", label: "Journal des ventes", perm: "journal" },
  { href: "/stats", label: "Statistiques", perm: "stats" },
  { href: "/reglages", label: "Réglages & QR", perm: "settings" },
  { href: "/equipe", label: "Comptes", perm: "equipe" },
];

export default function SideNav({
  permissions,
}: {
  permissions: Permission[];
}) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1 p-3">
      {links
        .filter((link) => !link.perm || permissions.includes(link.perm))
        .map((link) => {
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-lg px-3 py-2 text-sm font-medium ${
                active
                  ? "bg-orange-50 text-orange-700"
                  : "text-stone-600 hover:bg-stone-100"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
    </nav>
  );
}