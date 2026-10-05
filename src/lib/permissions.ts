// Rôles et permissions RestoKonect
export type Role = "GERANT" | "SERVEUR" | "CAISSIER";

export type Permission =
  | "caisse" // utiliser la caisse (prise de commande)
  | "caisse.pay" // encaisser / annuler des commandes
  | "menu"
  | "stock"
  | "personnel"
  | "journal"
  | "stats"
  | "settings"
  | "equipe"; // gérer les comptes utilisateurs

const ALL: Permission[] = [
  "caisse",
  "caisse.pay",
  "menu",
  "stock",
  "personnel",
  "journal",
  "stats",
  "settings",
  "equipe",
];

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  GERANT: ALL,
  // Caissier : caisse complète + journal des ventes
  CAISSIER: ["caisse", "caisse.pay", "journal"],
  // Serveur : prise de commande uniquement (pas d'encaissement)
  SERVEUR: ["caisse"],
};

export const ROLE_LABELS: Record<Role, string> = {
  GERANT: "Gérant",
  CAISSIER: "Caissier",
  SERVEUR: "Serveur",
};

export function can(user: { role: string }, permission: Permission): boolean {
  const perms = ROLE_PERMISSIONS[user.role as Role];
  return perms?.includes(permission) ?? false;
}

export function isRole(value: string): value is Role {
  return value === "GERANT" || value === "SERVEUR" || value === "CAISSIER";
}