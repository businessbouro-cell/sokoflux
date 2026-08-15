# SokoFlux — CLAUDE.md

Fichier de référence complet pour les sessions Claude Code. Contient l'architecture, l'état des modules, les faits critiques sur le schéma Prisma, et les corrections déjà appliquées.

---

## Vue d'ensemble du projet

**SokoFlux** est une marketplace e-commerce pan-africaine ciblant la Guinée. Elle connecte :
- Fournisseurs chinois (Guangzhou, Yiwu, Shenzhen)
- Importateurs guinéens
- Commerçants locaux (vente en gros B2B)
- Particuliers (occasion C2C)

**Stack :** Next.js 16.2.4 (App Router, Turbopack) · TypeScript · Tailwind v4 · Prisma 7 + SQLite (`prisma/sokoflux.db`) via `@prisma/adapter-libsql` · NextAuth v4 · Zod · React Hook Form · shadcn/ui · Zustand · Recharts

**Langue interface :** Français  
**Devise principale :** GNF (Franc Guinéen) ; USD pour les produits import Chine  
**Taux de conversion dev :** 1 USD = 8 600 GNF (hardcodé dans `lib/utils/currency.ts`)

---

## Commandes essentielles

```bash
# Développement
"C:\Program Files\nodejs\node.exe" node_modules/next/dist/bin/next dev --port 3000

# Build production (doit passer à zéro erreur)
"C:\Program Files\nodejs\node.exe" node_modules/next/dist/bin/next build

# Seed base de données
"C:\Program Files\nodejs\node.exe" node_modules/tsx/dist/cli.mjs prisma/seed.ts

# Génération Prisma (après modification schema)
"C:\Program Files\nodejs\node.exe" node_modules/.bin/prisma generate

# Migration (après modification schema)
"C:\Program Files\nodejs\node.exe" node_modules/.bin/prisma migrate dev --name <nom>
```

**Note :** `npm` n'est pas dans le PATH système. Toujours utiliser les chemins complets ci-dessus.

---

## Architecture des dossiers

```
sokoflux/
├── app/
│   ├── (auth)/              # login, register (layout sans Navbar/BottomNav)
│   ├── api/                 # Route Handlers Next.js
│   │   ├── admin/           # orders, products, users (ADMIN only)
│   │   ├── auth/            # NextAuth + verify-otp
│   │   ├── listings/        # CRUD annonces occasion
│   │   ├── messages/        # messagerie
│   │   ├── notifications/   # notifications
│   │   ├── orders/          # commandes
│   │   ├── payments/        # orange-money, mtn-momo, stripe
│   │   ├── products/        # catalogue fournisseurs
│   │   ├── shipments/       # conteneurs import
│   │   ├── suppliers/       # profils fournisseurs
│   │   └── users/           # inscription + profil (me)
│   ├── admin/               # Panel admin (orders, products, shipments, users)
│   ├── dashboard/
│   │   ├── importer/        # Dashboard importateur
│   │   ├── merchant/        # Dashboard commerçant
│   │   └── supplier/        # Dashboard fournisseur + products/new
│   ├── listings/            # [id], new — Occasion C2C
│   ├── messages/            # Messagerie
│   ├── notifications/       # Notifications
│   ├── orders/              # Mes commandes
│   ├── products/            # [id] — Catalogue import Chine
│   ├── profile/             # Profil utilisateur
│   ├── settings/            # Paramètres compte
│   ├── shipments/           # [id] — Conteneurs + tracking
│   ├── suppliers/           # [id] — Profil fournisseur
│   ├── layout.tsx           # Root layout (SessionProvider, ThemeProvider)
│   ├── page.tsx             # Page d'accueil
│   └── providers.tsx        # SessionProvider wrapper
├── components/
│   ├── common/              # ConditionBadge, CurrencyDisplay, EmptyState,
│   │                        # ImageUpload, PhoneInput, RegionSelect, SearchBar,
│   │                        # ShipmentProgress, StarRating
│   ├── layout/              # Navbar, BottomNav, Footer, Sidebar
│   ├── listings/            # ListingCard
│   ├── payments/            # PaymentModal
│   ├── products/            # ProductCard
│   └── ui/                  # shadcn/ui (button, input, label, avatar, etc.)
├── constants/
│   ├── categories.ts        # PRODUCT_CATEGORIES, ITEM_CONDITIONS, SHIPPING_TYPES
│   ├── currencies.ts        # GNF_PER_USD, PLATFORM_COMMISSION_RATE
│   └── regions.ts           # GUINEA_REGIONS (8 régions + préfectures)
├── lib/
│   ├── auth.ts              # NextAuth config (CredentialsProvider, JWT callbacks)
│   ├── prisma.ts            # PrismaClient singleton avec adapter libsql
│   ├── utils/
│   │   ├── currency.ts      # formatGNF, usdToGnf, gnfToUsd
│   │   └── formatters.ts    # formatRelative, parseJsonField
│   ├── notifications/
│   │   ├── email.ts         # Resend (sandbox en dev)
│   │   ├── push.ts          # Web Push
│   │   └── sms.ts           # Africa's Talking via REST fetch (IS_MOCK en dev)
│   └── payments/
│       ├── escrow.ts        # initiateEscrow, releaseEscrow, refundEscrow
│       ├── mtn-momo.ts      # Mock MTN MoMo
│       ├── orange-money.ts  # Mock Orange Money
│       └── stripe.ts        # Stripe checkout (apiVersion: "2026-04-22.dahlia")
├── prisma/
│   ├── schema.prisma        # Schéma DB complet
│   ├── seed.ts              # Données de test (déjà exécuté)
│   └── sokoflux.db          # SQLite dev
├── stores/
│   ├── useAuthStore.ts      # Zustand auth
│   └── useCartStore.ts      # Zustand panier
├── types/
│   └── index.ts             # SessionUser, module augmentation next-auth
├── middleware.ts             # Protection routes par rôle
├── next.config.ts            # Config Next.js
└── CLAUDE.md                # Ce fichier
```

---

## Schéma Prisma — faits critiques

> **TOUJOURS vérifier ici avant d'écrire du code Prisma.** Ces noms de champs sont authorisés ; les noms incorrects causaient tous les bugs de build.

### User
```prisma
id, phone (unique), email, name, passwordHash, avatar, city, region, country
isVerified, isActive, createdAt, updatedAt
roles         UserRole[]        # relation, PAS un champ JSON
wallet        Wallet?
importerProfile ImporterProfile?
merchantProfile MerchantProfile?
supplierProfile SupplierProfile?
buyerOrders   Order[] @relation("BuyerOrders")
sellerOrders  Order[] @relation("SellerOrders")
listings      Listing[]
reviews       Review[] @relation("ReviewAuthor")
reviewsReceived Review[] @relation("ReviewTarget")
sentMessages  Message[] @relation("MessageSender")
receivedMessages Message[] @relation("MessageReceiver")
notifications Notification[]
```

### UserRole
```prisma
id, userId, role  # role = "IMPORTER"|"LOCAL_MERCHANT"|"INDIVIDUAL"|"SUPPLIER"|"ADMIN"
```

### Wallet
```prisma
id, userId (unique), balanceGNF  # PAS balance+currency — juste balanceGNF
```

### SupplierProfile
```prisma
id, userId (unique), companyName, companyNameCn?, city, province, description
logo?, banner?, businessLicense?, isVerified, verifiedAt?, rating, totalSales
responseTime?, minOrderValue, shippingPorts, categories, certifications
# PAS de champ country
# Les Products appartiennent à SupplierProfile (supplierId = SupplierProfile.id)
```

### ImporterProfile
```prisma
id, userId (unique), businessName?, taxId?, importLicense?, isVerified, totalImports
# PAS companyName, PAS region, PAS address
```

### MerchantProfile
```prisma
id, userId (unique), shopName, shopBanner?, description?, city, region, address?, isVerified
```

### Product
```prisma
id, supplierId (→ SupplierProfile), title, description, priceUSD, images (JSON string)
category, minOrderQty, stockQty, weight?, dimensions?, shippingType, shippingPort?
leadTimeDays, isVerified, isActive, viewCount, createdAt, updatedAt
# PAS name, PAS price, PAS isApproved, PAS moq, PAS stock, PAS views
```

### Listing
```prisma
id, sellerId (→ User), title, description, price, images (JSON string)
category, condition, city, region, isActive, isSold, viewCount
# PAS views — c'est viewCount
# PAS de champ phone sur le modèle Listing
```

### Order
```prisma
id, buyerId, sellerId, reference, type, status, totalGNF
paymentMethod, paymentStatus, shipmentId?, deliveryAddress?, deliveryCity?, deliveryRegion?
notes?, escrowReleased, createdAt, updatedAt
items  OrderItem[]
# PAS totalAmount, PAS orderType, PAS shippingAddress
```

### OrderItem
```prisma
id, orderId, productId?, listingId?, title, image?, quantity, priceGNF
# PAS unitPrice, PAS totalPrice
# title et priceGNF sont REQUIS
```

### Shipment
```prisma
id, reference, importerId (→ ImporterProfile), supplierId?, type, status
origin, destination, capacityM3, usedM3, departureDate?, arrivalDate?
portOfLoading?, portOfDischarge?, vesselName?, containerNumber?
pricePerM3, notes?, createdAt, updatedAt
trackingEvents  TrackingEvent[]
# PAS totalCapacity, PAS usedCapacity, PAS estimatedDeparture, PAS actualDeparture
```

### TrackingEvent
```prisma
id, shipmentId, status, location?, description, timestamp  # PAS occurredAt
```

### Notification
```prisma
id, userId, type, title, body, data?, isRead, createdAt
# PAS message, PAS link — c'est body et data
```

### Review
```prisma
id, rating, comment?, authorId (→ User "ReviewAuthor"), targetId (→ User "ReviewTarget")
productId?, orderId?, createdAt
# PAS supplierId, PAS reviewer — utiliser targetId et author
```

### Message
```prisma
id, senderId, receiverId, content, isRead, createdAt
```

### Transaction
```prisma
id, walletId, orderId? (unique), type, amount, currency, status, description?, createdAt
# type = "DEPOSIT"|"WITHDRAWAL"|"ESCROW_LOCK"|"ESCROW_RELEASE"|"REFUND"|"COMMISSION"
```

---

## Authentification (NextAuth)

**Config :** `lib/auth.ts`  
**Strategy :** JWT, sessions 30 jours  
**Provider :** Credentials (phone + password)  
**Type augmentation :** `types/index.ts`

```typescript
// SessionUser dans types/index.ts
interface SessionUser {
  id: string; name: string; phone: string; email?: string;
  roles: string[];  // string[], PAS RoleType[]
  isVerified: boolean;
}

// Dans lib/auth.ts — authorize() retourne :
{ id, name, email, phone, roles: string[], isVerified }

// JWT callbacks ajoutent : token.id, token.phone, token.roles, token.isVerified
// Session callbacks ajoutent : session.user.id, .phone, .roles, .isVerified
```

**Middleware** (`middleware.ts`) protège les routes par rôle :
- `/dashboard/supplier` → SUPPLIER
- `/dashboard/importer` → IMPORTER
- `/dashboard/merchant` → LOCAL_MERCHANT
- `/admin/*` → ADMIN
- `/orders`, `/messages`, `/profile`, `/settings` → authentifié

---

## Paiements & Escrow

### Mocks (dev)
- `lib/payments/orange-money.ts` — IS_MOCK = true en dev, log console + délai simulé
- `lib/payments/mtn-momo.ts` — idem, utilise uuid via dynamic import
- `lib/payments/stripe.ts` — vrai client Stripe sandbox, apiVersion `"2026-04-22.dahlia"`

### Escrow (`lib/payments/escrow.ts`)
```typescript
initiateEscrow(orderId: string): Promise<void>   // 1 seul argument
releaseEscrow(orderId: string): Promise<void>
refundEscrow(orderId: string): Promise<void>
```
- Décrémente `wallet.balanceGNF` de l'acheteur
- Crée une `Transaction` de type `ESCROW_LOCK`
- Met `order.paymentStatus = "IN_ESCROW"`

### API Routes paiements
- `POST /api/payments/orange-money` → initie paiement OM
- `GET /api/payments/mtn-momo?referenceId=&orderId=` → vérifie statut + déclenche escrow
- `POST /api/payments/stripe` → crée Stripe Checkout session

---

## Notifications & SMS

### SMS (`lib/notifications/sms.ts`)
- Africa's Talking SDK **non installé** — utilise `fetch()` REST API directement
- `IS_MOCK = process.env.NODE_ENV !== 'production'`
- En dev : `console.log("[SMS→${phone}]: ${message}")`
- Fonctions : `sendOTP(phone, code)`, `sendNotification(phone, message)`

### Email (`lib/notifications/email.ts`)
- Resend, sandbox domain en dev
- `sendWelcomeEmail(email, name)`, `sendOrderConfirmation(...)`

---

## Formulaires React Hook Form + Zod

**Problème connu :** `z.coerce.number()` avec `@hookform/resolvers` v5 crée un type `unknown` qui casse TypeScript.

**Solution :** Utiliser `z.number()` dans le schéma Zod + `{ valueAsNumber: true }` dans `register()` :

```typescript
// Schema
const Schema = z.object({
  price: z.number().positive(),
  qty: z.number().int().positive(),
});

// Dans le JSX
<Input {...register("price", { valueAsNumber: true })} type="number" />
<Input {...register("qty", { valueAsNumber: true })} type="number" />
```

---

## useSearchParams — Suspense obligatoire

Toute page `"use client"` qui utilise `useSearchParams()` doit être wrappée dans `<Suspense>` sinon Next.js échoue au build (prerendering error).

**Pattern à respecter :**
```typescript
"use client";

import { Suspense, ... } from "react";
import { useSearchParams } from "next/navigation";

function PageContent() {
  const searchParams = useSearchParams();
  // ... logique
  return <div>...</div>;
}

export default function Page() {
  return <Suspense><PageContent /></Suspense>;
}
```

**Pages déjà corrigées :** `/admin/orders`, `/admin/users`, `/listings`, `/products`, `/messages`

---

## RegionSelect / CitySelect

**Composant :** `components/common/RegionSelect.tsx`

Props correctes :
```typescript
<RegionSelect
  value={selectedRegion}
  onValueChange={(v) => { ... }}  // PAS onChange
/>
<CitySelect
  regionName={selectedRegion}     // PAS region
  value={watch("city")}
  onValueChange={(v) => { ... }}  // PAS onChange
/>
```

---

## SearchBar

**Composant :** `components/common/SearchBar.tsx`

Props : `placeholder`, `onSearch`, `debounceMs`, `className`  
**PAS de prop `defaultValue`** — gérer l'état dans le composant parent si nécessaire.

---

## Pages et routes existantes (build ✓ 2026-08-05 — 53 routes, 0 erreur)

| Route | Type | Description |
|-------|------|-------------|
| `/` | Static | Page d'accueil (données live Prisma) |
| `/login` | Static | Connexion téléphone + mot de passe |
| `/register` | Static | Inscription multi-étapes par rôle |
| `/listings` | Static+Suspense | Grille annonces occasion + infinite scroll |
| `/listings/[id]` | Dynamic | Détail annonce + contact vendeur |
| `/listings/new` | Static | Publier annonce (upload images réel) |
| `/products` | Static+Suspense | Catalogue import Chine + infinite scroll |
| `/products/[id]` | Dynamic | Fiche produit + PaymentModal + avis |
| `/suppliers` | Static | Liste fournisseurs vérifiés |
| `/suppliers/[id]` | Dynamic | Profil boutique fournisseur + avis |
| `/shipments` | Static | Conteneurs disponibles + jauge remplissage |
| `/shipments/[id]` | Dynamic | Tracking conteneur + timeline |
| `/orders` | Static | Mes commandes (liens vers détail) |
| `/orders/[id]` | Dynamic | Détail commande + progression + avis |
| `/messages` | Static+Suspense | Messagerie + Pusher temps réel |
| `/notifications` | Static | Notifications + marquer lu |
| `/profile` | Static | Profil utilisateur + dashboards par rôle |
| `/settings` | Static | Paramètres + changement de mot de passe |
| `/wallet` | Static | Portefeuille GNF + historique + recharge |
| `/dashboard/supplier` | Static | Dashboard fournisseur + stats réelles |
| `/dashboard/supplier/products` | Static | Mes produits (liste complète) |
| `/dashboard/supplier/products/new` | Static | Nouveau produit (upload images réel) |
| `/dashboard/importer` | Static | Dashboard importateur + conteneurs |
| `/dashboard/merchant` | Static | Dashboard commerçant + commandes |
| `/admin` | Static | Panel admin + stats plateforme |
| `/admin/orders` | Static+Suspense | Gestion commandes + libération escrow |
| `/admin/users` | Static+Suspense | Gestion utilisateurs |
| `/admin/products` | Static | Validation/rejet produits |
| `/admin/shipments` | Static | Gestion conteneurs + avancement statut |

---

## APIs existantes

| Endpoint | Méthodes | Description |
|----------|----------|-------------|
| `/api/auth/[...nextauth]` | GET, POST | NextAuth |
| `/api/auth/verify-otp` | POST | Vérification OTP |
| `/api/users` | POST | Inscription |
| `/api/users/me` | GET, PATCH | Profil connecté (GET ajouté 2026-08-05) |
| `/api/users/me/password` | POST | Changement de mot de passe |
| `/api/upload` | POST | Upload image → `public/uploads/` (max 5 Mo) |
| `/api/listings` | GET, POST | Annonces occasion |
| `/api/listings/[id]` | GET, PATCH, DELETE | Détail annonce |
| `/api/products` | GET, POST | Catalogue produits |
| `/api/products/[id]` | GET, PATCH, DELETE | Détail produit |
| `/api/suppliers` | GET | Liste fournisseurs |
| `/api/suppliers/[id]` | GET | Profil fournisseur |
| `/api/shipments` | GET, POST | Conteneurs |
| `/api/shipments/[id]` | GET, PATCH | Détail + tracking |
| `/api/orders` | GET, POST | Commandes |
| `/api/orders/[id]` | GET | Détail commande + items + fournisseur |
| `/api/reviews` | GET, POST | Avis produits/commandes |
| `/api/wallet` | GET | Solde + historique transactions |
| `/api/messages` | GET, POST | Messages |
| `/api/notifications` | GET, POST | Notifications |
| `/api/notifications/[id]/read` | PATCH | Marquer lue |
| `/api/notifications/read-all` | PATCH | Tout marquer lu |
| `/api/payments/orange-money` | POST, GET | Paiement OM |
| `/api/payments/mtn-momo` | POST, GET | Paiement MTN |
| `/api/payments/stripe` | POST | Checkout Stripe |
| `/api/admin/stats` | GET | Statistiques globales (ADMIN) |
| `/api/admin/users` | GET | Liste users (ADMIN) |
| `/api/admin/users/[id]` | PATCH | Modifier user (ADMIN) |
| `/api/admin/products` | GET | Tous produits (ADMIN) |
| `/api/admin/orders` | GET | Toutes commandes (ADMIN) |
| `/api/admin/orders/[id]` | PATCH | Modifier statut + libérer escrow (ADMIN) |

---

## État d'avancement des modules

| Module | État | Notes |
|--------|------|-------|
| M1 — Auth (NextAuth + OTP) | ✅ Complet | Login, register, middleware, JWT |
| M2 — Catalogue fournisseurs | ✅ Complet | CRUD produits, profil supplier, dashboard |
| M3 — Import Chine (shipments) | ✅ Complet | Tracking timeline, booking, dashboard |
| M4 — Vente en gros B2B | ✅ Complet | Dashboards importer + merchant |
| M5 — Occasion C2C | ✅ Complet | Listings CRUD, grille, détail, formulaire |
| M6 — Paiements & Escrow | ✅ Complet | OM mock, MTN mock, Stripe, escrow logic |
| M7 — Messagerie | ✅ Complet | API + page + Pusher client intégré |
| M8 — Notifications | ✅ Complet | API + page + marquer lu + tout marquer lu |
| M9 — Dashboards complets | ✅ Complet | Supplier, Importer, Merchant, Admin panel |
| M10 — PWA & Performance | ✅ Complet | manifest.json + next-pwa + icons (désactivé en dev) |

---

## Données seed (déjà en base)

- 2 fournisseurs chinois (Guangzhou Tech Co., Yiwu Fashion House)
- 20 produits (Electronics + Textile)
- 3 importateurs guinéens (Conakry)
- 2 commerçants locaux (Labé, Kindia)
- 5 particuliers
- 2 conteneurs (1 IN_TRANSIT, 1 DELIVERED)
- 10 annonces occasion
- Utilisateur admin : phone `+224600000000` / password `admin123`

---

## Variables d'environnement (.env.local)

```env
DATABASE_URL="file:./prisma/sokoflux.db"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="sokoflux-dev-secret-change-in-prod"

# Stripe (sandbox)
STRIPE_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."

# Africa's Talking (SMS)
AT_API_KEY="sandbox"
AT_USERNAME="sandbox"
AT_SENDER_ID="SokoFlux"

# Resend (email)
RESEND_API_KEY="re_..."

# Pusher (messagerie temps réel)
PUSHER_APP_ID="..."
PUSHER_KEY="..."
PUSHER_SECRET="..."
PUSHER_CLUSTER="eu"
NEXT_PUBLIC_PUSHER_KEY="..."
NEXT_PUBLIC_PUSHER_CLUSTER="eu"

# Cloudinary (images)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="..."
CLOUDINARY_API_KEY="..."
CLOUDINARY_API_SECRET="..."
```

---

## Design tokens

```css
--color-primary: #1D9E75       /* Vert principal */
--color-primary-dark: #0F6E56  /* Vert foncé hover */
--color-gold: #EF9F27          /* Accent doré */
--color-surface: #F7F5F0       /* Fond chaud */
--color-border: #E8E4DB        /* Bordures */
```

Fonte principale : Inter  
Arrondis : `rounded-xl` (12px) standard, `rounded-2xl` pour cards  
Bottom Nav mobile : 5 onglets (Accueil / Produits / Occasion / Commandes / Profil)

---

## Corrections appliquées (2026-08-05)

| Problème | Fichier | Fix |
|----------|---------|-----|
| `reviewCount` inexistant dans schéma | `app/suppliers/page.tsx` | Remplacé par `totalSales` |
| `country` inexistant dans SupplierProfile | `app/suppliers/page.tsx` | Remplacé par `province` |
| `estimatedArrival` nullable crash | `app/dashboard/importer/page.tsx` | Ajouté `string \| null` + guard ternaire |
| Mock Unsplash IDs invalides | `app/listings/new/page.tsx` | Remplacé par vrai `/api/upload` |
| Mock Unsplash IDs invalides | `app/dashboard/supplier/products/new/page.tsx` | Remplacé par vrai `/api/upload` |
| Images localhost bloquées | `next.config.ts` | Ajouté `{ protocol: "http", hostname: "localhost" }` |
| `/api/users/me` GET manquant | `app/api/users/me/route.ts` | Handler GET ajouté |

---

## Prochaines étapes (optionnelles)

1. **Push notifications** — service worker + subscription dans `lib/notifications/push.ts`
2. **Webhooks paiements** — `/api/webhooks/orange-money` et `/api/webhooks/mtn-momo` (actuellement mocks)
3. **Image upload Cloudinary** — remplacer `public/uploads/` local par Cloudinary en production
4. **Tests E2E** — Playwright sur les flows critiques (auth, commande, paiement)
5. **Déploiement** — Vercel + Turso (SQLite distribué) ou Railway (Postgres)
