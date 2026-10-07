"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/admin", label: "Vue d'ensemble" },
  { href: "/admin/restaurants", label: "Restaurants" },
];

export default function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1 p-3">
      {links.map((link) => {
        const active =
          pathname === link.href ||
          (link.href !== "/admin" && pathname.startsWith(link.href));
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`rounded-lg px-3 py-2 text-sm font-medium ${
              active
                ? "bg-stone-700 text-white"
                : "text-stone-300 hover:bg-stone-800"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
      <a
        href="/"
        target="_blank"
        rel="noopener noreferrer"
        className="rounded-lg px-3 py-2 text-sm font-medium text-stone-300 hover:bg-stone-800"
      >
        Voir le site ↗
      </a>
    </nav>
  );
}