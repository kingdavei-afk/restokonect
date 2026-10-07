# RestoKonect

MVP de SaaS de gestion pour restaurants à Abidjan : **caisse, menu, stock, personnel**.

## Démarrage rapide

```bash
npm install
npx prisma db push        # crée la base SQLite (prisma/dev.db)
npm run dev               # http://localhost:3000
```

1. Ouvrir http://localhost:3000 et cliquer « Créer un compte restaurant ».
2. Ajouter des catégories et des plats dans **Menu & plats**.
3. Encaisser des tickets dans **Caisse** (espèces ou Mobile Money saisi manuellement).
4. Suivre stock et pointage dans **Stock** et **Personnel**.

## Stack

- Next.js 15 (App Router) + TypeScript + Tailwind CSS 4
- Prisma + SQLite (fichier local `prisma/dev.db`, migrer vers PostgreSQL en prod)
- Auth maison : bcrypt + cookie de session signé (HMAC)
- Prix en **FCFA entiers** (pas de centimes)

## Structure

```
prisma/schema.prisma        # modèles : Restaurant, User, Category, Product,
                            # Order, StockItem, StockMovement, Employee, TimeEntry
src/app/(app)/              # espace connecté : dashboard, caisse, menu, stock,
                            # personnel, journal
src/lib/                    # db (Prisma), auth (session), format (FCFA)
```

## Scripts

| Commande            | Rôle                          |
| ------------------- | ----------------------------- |
| `npm run dev`       | Serveur de développement      |
| `npm run build`     | Build de production           |
| `npm run db:push`   | Synchroniser le schéma Prisma |
| `npm run db:studio` | Explorateur de base (Prisma Studio) |

## Rôles & permissions

| Rôle | Accès |
| ---- | ----- |
| **Super-admin** | Supervision de toute la plateforme (`/admin`) |
| **Gérant** | Tout (menu, stock, personnel, stats, réglages, comptes) |
| **Caissier** | Caisse complète (encaissement) + journal des ventes |
| **Serveur** | Caisse en prise de commande uniquement (pas d'encaissement) |

Créer ou promouvoir un super-admin : `npx tsx scripts/create-superadmin.ts <email> <motdepasse> <nom>`

Les comptes se créent dans **Comptes** (réservé au gérant). Les permissions sont
vérifiées côté serveur dans chaque page et chaque action.

## Feuille de route MVP

- [x] Caisse, menu, stock, personnel, journal
- [x] QR code menu client + commandes WhatsApp (enregistrées à la caisse)
- [x] Notification temps réel à la caisse
- [x] Statistiques (jour / 7 j / 30 j) + export Excel
- [x] Impression du ticket (reçu 72 mm)
- [x] Multi-utilisateurs (gérant / caissier / serveur)
- [x] Super-admin : supervision de tous les restaurants
- [ ] Intégration paiement Mobile Money marchand (CinetPay / Wave)
- [ ] Déploiement production (PostgreSQL)
