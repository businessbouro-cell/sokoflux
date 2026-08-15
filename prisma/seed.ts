import { config } from "dotenv";
config({ path: ".env.local" });

import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaClient } from "../lib/generated/prisma/client";
import bcrypt from "bcryptjs";
import path from "path";

function toLibsqlUrl(raw: string): string {
  if (raw.startsWith("file:./") || raw.startsWith("file:.\\")) {
    return `file:${path.resolve(process.cwd(), raw.slice(7).replace(/\\/g, "/"))}`;
  }
  if (raw.startsWith("file:") && !raw.startsWith("file:/")) {
    return `file:${path.resolve(process.cwd(), raw.slice(5))}`;
  }
  return raw;
}

const rawUrl = process.env["DATABASE_URL"] ?? "file:dev.db";
const dbUrl = toLibsqlUrl(rawUrl);
const authToken = process.env["TURSO_AUTH_TOKEN"];
console.log("DB URL:", dbUrl);

const adapter = new PrismaLibSql({ url: dbUrl, ...(authToken ? { authToken } : {}) });
const prisma = new PrismaClient({ adapter } as never);

async function main() {
  console.log("🌱 Seeding SokoFlux database...");

  const passwordHash = await bcrypt.hash("password123", 10);

  // ── Fournisseurs chinois ──────────────────────────────────────────────────
  const supplier1 = await prisma.user.create({
    data: {
      phone: "+8613800000001",
      email: "guangzhou@sokoflux.com",
      name: "Guangzhou Tech Co.",
      passwordHash,
      city: "Guangzhou",
      region: "Guangdong",
      country: "CN",
      isVerified: true,
      roles: { create: [{ role: "SUPPLIER" }] },
      supplierProfile: {
        create: {
          companyName: "Guangzhou Tech Co. Ltd",
          companyNameCn: "广州科技有限公司",
          city: "Guangzhou",
          province: "Guangdong",
          description: "Fabricant d'électronique grand public depuis 2008. Certifié ISO 9001 et CE. Spécialité : smartphones, accessoires, électroménager.",
          isVerified: true,
          verifiedAt: new Date(),
          rating: 4.7,
          totalSales: 1240,
          responseTime: 2,
          minOrderValue: 500,
          shippingPorts: JSON.stringify(["Guangzhou", "Shenzhen"]),
          categories: JSON.stringify(["ELECTRONICS", "HOME_FURNITURE"]),
          certifications: JSON.stringify(["ISO 9001", "CE", "RoHS"]),
        },
      },
    },
  });

  const supplier2 = await prisma.user.create({
    data: {
      phone: "+8613800000002",
      email: "yiwu@sokoflux.com",
      name: "Yiwu Fashion House",
      passwordHash,
      city: "Yiwu",
      region: "Zhejiang",
      country: "CN",
      isVerified: true,
      roles: { create: [{ role: "SUPPLIER" }] },
      supplierProfile: {
        create: {
          companyName: "Yiwu Fashion House International",
          companyNameCn: "义乌时尚屋国际",
          city: "Yiwu",
          province: "Zhejiang",
          description: "Leader dans le textile et la mode africaine. Plus de 5000 références disponibles. Délai rapide 7-10 jours.",
          isVerified: true,
          verifiedAt: new Date(),
          rating: 4.5,
          totalSales: 890,
          responseTime: 4,
          minOrderValue: 200,
          shippingPorts: JSON.stringify(["Ningbo", "Shanghai"]),
          categories: JSON.stringify(["TEXTILE_FASHION", "COSMETICS_BEAUTY"]),
          certifications: JSON.stringify(["SGS", "OEKO-TEX"]),
        },
      },
    },
  });

  // ── Produits fournisseur 1 (Électronique) ─────────────────────────────────
  const electronicsImages = JSON.stringify([
    "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600",
    "https://images.unsplash.com/photo-1523206489230-c012c64b2b48?w=600",
  ]);

  const supplier1Profile = await prisma.supplierProfile.findUnique({
    where: { userId: supplier1.id },
  });

  const electronicProducts = [
    { title: "Smartphone Android 4G 6.5\"", priceUSD: 45, stock: 500, moq: 10, port: "Guangzhou", lead: 7 },
    { title: "Écouteurs Bluetooth 5.0", priceUSD: 8, stock: 2000, moq: 50, port: "Shenzhen", lead: 5 },
    { title: "Chargeur USB-C 65W", priceUSD: 6, stock: 3000, moq: 100, port: "Guangzhou", lead: 3 },
    { title: "Batterie externe 20000mAh", priceUSD: 15, stock: 800, moq: 20, port: "Shenzhen", lead: 5 },
    { title: "Montre connectée Sport", priceUSD: 25, stock: 400, moq: 10, port: "Guangzhou", lead: 10 },
    { title: "Mini ventilateur USB portable", priceUSD: 4, stock: 5000, moq: 100, port: "Guangzhou", lead: 3 },
    { title: "Lampe LED solaire 30W", priceUSD: 12, stock: 1000, moq: 20, port: "Shenzhen", lead: 7 },
    { title: "Câble HDMI 2m 4K", priceUSD: 3, stock: 8000, moq: 200, port: "Guangzhou", lead: 2 },
    { title: "Barre de son Bluetooth 40W", priceUSD: 35, stock: 300, moq: 5, port: "Guangzhou", lead: 14 },
    { title: "Climatiseur portable 9000 BTU", priceUSD: 180, stock: 100, moq: 2, port: "Shenzhen", lead: 21 },
  ];

  for (const p of electronicProducts) {
    await prisma.product.create({
      data: {
        title: p.title,
        description: `Produit de qualité exportation. Emballage individuel. ${p.title} certifié CE et RoHS. Idéal pour le marché africain.`,
        images: electronicsImages,
        category: "ELECTRONICS",
        priceUSD: p.priceUSD,
        minOrderQty: p.moq,
        stockQty: p.stock,
        unit: "unit",
        shippingPort: p.port,
        shippingType: "LCL",
        leadTimeDays: p.lead,
        certifications: JSON.stringify(["CE", "RoHS"]),
        tags: JSON.stringify(["électronique", "export", "Guinée"]),
        isActive: true,
        isVerified: true,
        rating: 4.3 + Math.random() * 0.5,
        supplierId: supplier1Profile!.id,
      },
    });
  }

  // ── Produits fournisseur 2 (Textile) ──────────────────────────────────────
  const textileImages = JSON.stringify([
    "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600",
    "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=600",
  ]);

  const supplier2Profile = await prisma.supplierProfile.findUnique({
    where: { userId: supplier2.id },
  });

  const textileProducts = [
    { title: "Tissu bazin riche 10 yards", priceUSD: 22, stock: 1000, moq: 20 },
    { title: "Robe boubou femme motifs africains", priceUSD: 18, stock: 500, moq: 10 },
    { title: "Ensemble tenue homme cérémonie", priceUSD: 35, stock: 300, moq: 5 },
    { title: "Pagne wax Holland 6 yards", priceUSD: 28, stock: 800, moq: 20 },
    { title: "Chaussures femme sandales cuir synthétique", priceUSD: 12, stock: 2000, moq: 24 },
    { title: "Sac à main femme mode africaine", priceUSD: 15, stock: 600, moq: 12 },
    { title: "Ceinture homme cuir PU", priceUSD: 5, stock: 3000, moq: 50 },
    { title: "Écharpe soie imprimée", priceUSD: 8, stock: 1500, moq: 30 },
    { title: "Hijab mousseline de soie x5", priceUSD: 20, stock: 800, moq: 10 },
    { title: "Chemise homme coton slim fit", priceUSD: 9, stock: 2500, moq: 24 },
  ];

  for (const p of textileProducts) {
    await prisma.product.create({
      data: {
        title: p.title,
        description: `Collection printemps-été. Qualité export. ${p.title}. Disponible en plusieurs coloris. Packaging individuel soigné.`,
        images: textileImages,
        category: "TEXTILE_FASHION",
        priceUSD: p.priceUSD,
        minOrderQty: p.moq,
        stockQty: p.stock,
        unit: "unit",
        shippingPort: "Ningbo",
        shippingType: "LCL",
        leadTimeDays: 10,
        certifications: JSON.stringify(["OEKO-TEX", "SGS"]),
        tags: JSON.stringify(["mode", "textile", "africain"]),
        isActive: true,
        isVerified: true,
        rating: 4.2 + Math.random() * 0.6,
        supplierId: supplier2Profile!.id,
      },
    });
  }

  // ── Importateurs guinéens ─────────────────────────────────────────────────
  const importer1 = await prisma.user.create({
    data: {
      phone: "+224620000001",
      email: "mamadou@sokoflux.com",
      name: "Mamadou Bah",
      passwordHash,
      city: "Conakry",
      region: "Conakry",
      isVerified: true,
      roles: { create: [{ role: "IMPORTER" }, { role: "LOCAL_MERCHANT" }] },
      importerProfile: {
        create: {
          businessName: "Bah Import Export SARL",
          isVerified: true,
          totalImports: 12,
        },
      },
      merchantProfile: {
        create: {
          shopName: "Bah Electronics Conakry",
          description: "Importateur d'électronique depuis 2015. Magasin à Kaloum.",
          city: "Conakry",
          region: "Conakry",
          isVerified: true,
        },
      },
      wallet: { create: { balanceGNF: 5000000 } },
    },
  });

  const importer2 = await prisma.user.create({
    data: {
      phone: "+224620000002",
      email: "fatoumata@sokoflux.com",
      name: "Fatoumata Diallo",
      passwordHash,
      city: "Conakry",
      region: "Conakry",
      isVerified: true,
      roles: { create: [{ role: "IMPORTER" }] },
      importerProfile: {
        create: {
          businessName: "Diallo Textile Import",
          isVerified: true,
          totalImports: 8,
        },
      },
      wallet: { create: { balanceGNF: 3000000 } },
    },
  });

  const importer3 = await prisma.user.create({
    data: {
      phone: "+224620000003",
      email: "ibrahima@sokoflux.com",
      name: "Ibrahima Camara",
      passwordHash,
      city: "Conakry",
      region: "Conakry",
      isVerified: true,
      roles: { create: [{ role: "IMPORTER" }, { role: "LOCAL_MERCHANT" }] },
      importerProfile: {
        create: {
          businessName: "Camara Commerce International",
          isVerified: false,
          totalImports: 3,
        },
      },
      merchantProfile: {
        create: {
          shopName: "Camara Bâtiment",
          description: "Matériaux de construction importés de Chine.",
          city: "Conakry",
          region: "Conakry",
        },
      },
      wallet: { create: { balanceGNF: 1500000 } },
    },
  });

  // ── Commerçants locaux ────────────────────────────────────────────────────
  const merchant1 = await prisma.user.create({
    data: {
      phone: "+224621000001",
      email: "alpha@sokoflux.com",
      name: "Alpha Sow",
      passwordHash,
      city: "Labé",
      region: "Labé",
      isVerified: true,
      roles: { create: [{ role: "LOCAL_MERCHANT" }] },
      merchantProfile: {
        create: {
          shopName: "Sow Téléphonie Labé",
          description: "Boutique téléphones et accessoires au marché central de Labé.",
          city: "Labé",
          region: "Labé",
          isVerified: true,
        },
      },
      wallet: { create: { balanceGNF: 2000000 } },
    },
  });

  const merchant2 = await prisma.user.create({
    data: {
      phone: "+224621000002",
      email: "mariama@sokoflux.com",
      name: "Mariama Kouyaté",
      passwordHash,
      city: "Kindia",
      region: "Kindia",
      isVerified: true,
      roles: { create: [{ role: "LOCAL_MERCHANT" }] },
      merchantProfile: {
        create: {
          shopName: "Mariama Mode Kindia",
          description: "Vêtements et accessoires de mode pour femmes et enfants.",
          city: "Kindia",
          region: "Kindia",
          isVerified: true,
        },
      },
      wallet: { create: { balanceGNF: 1200000 } },
    },
  });

  // ── Particuliers ──────────────────────────────────────────────────────────
  const individuals: { phone: string; name: string; city: string; region: string }[] = [
    { phone: "+224622000001", name: "Ousmane Balde", city: "Conakry", region: "Conakry" },
    { phone: "+224622000002", name: "Kadiatou Sylla", city: "Kankan", region: "Kankan" },
    { phone: "+224622000003", name: "Sekou Touré", city: "Mamou", region: "Mamou" },
    { phone: "+224622000004", name: "Aissatou Barry", city: "Boké", region: "Boké" },
    { phone: "+224622000005", name: "Mohamed Condé", city: "N'Zérékoré", region: "N'Zérékoré" },
  ];

  const individualUsers = [];
  for (const ind of individuals) {
    const u = await prisma.user.create({
      data: {
        phone: ind.phone,
        name: ind.name,
        passwordHash,
        city: ind.city,
        region: ind.region,
        isVerified: true,
        roles: { create: [{ role: "INDIVIDUAL" }] },
        wallet: { create: { balanceGNF: 500000 } },
      },
    });
    individualUsers.push(u);
  }

  // ── Annonces occasion ─────────────────────────────────────────────────────
  const occasionListings = [
    { title: "iPhone 12 128Go - Très bon état", price: 2800000, category: "ELECTRONICS", condition: "LIKE_NEW", city: "Conakry", region: "Conakry", seller: individualUsers[0] },
    { title: "Moto Tricycle TVS 150cc 2022", price: 8500000, category: "VEHICLES_PARTS", condition: "GOOD", city: "Kankan", region: "Kankan", seller: individualUsers[1] },
    { title: "Machine à coudre Singer", price: 950000, category: "HOME_FURNITURE", condition: "GOOD", city: "Mamou", region: "Mamou", seller: individualUsers[2] },
    { title: "Télé Samsung 55\" 4K Smart TV", price: 3200000, category: "ELECTRONICS", condition: "LIKE_NEW", city: "Conakry", region: "Conakry", seller: individualUsers[0] },
    { title: "Robe de mariée neuve avec étiquette", price: 1500000, category: "TEXTILE_FASHION", condition: "NEW_WITH_TAGS", city: "Boké", region: "Boké", seller: individualUsers[3] },
    { title: "Réfrigérateur LG 300L", price: 2100000, category: "HOME_FURNITURE", condition: "GOOD", city: "N'Zérékoré", region: "N'Zérékoré", seller: individualUsers[4] },
    { title: "Laptop Dell Latitude i5 8Go", price: 4500000, category: "ELECTRONICS", condition: "ACCEPTABLE", city: "Conakry", region: "Conakry", seller: individualUsers[0] },
    { title: "Peugeot 206 2008 climatisée", price: 32000000, category: "VEHICLES_PARTS", condition: "ACCEPTABLE", city: "Conakry", region: "Conakry", seller: individualUsers[1] },
    { title: "Canapé 3 places cuir marron", price: 1800000, category: "HOME_FURNITURE", condition: "GOOD", city: "Mamou", region: "Mamou", seller: individualUsers[2] },
    { title: "Groupe électrogène 5kVA diesel", price: 7500000, category: "ELECTRONICS", condition: "GOOD", city: "Kankan", region: "Kankan", seller: individualUsers[3] },
  ];

  const listingImages = JSON.stringify([
    "https://images.unsplash.com/photo-1523206489230-c012c64b2b48?w=600",
  ]);

  for (const l of occasionListings) {
    await prisma.listing.create({
      data: {
        title: l.title,
        description: `À vendre : ${l.title}. Bon état de fonctionnement. Prix négociable. Contactez-moi via la messagerie pour plus d'informations.`,
        images: listingImages,
        price: l.price,
        category: l.category,
        condition: l.condition,
        city: l.city,
        region: l.region,
        isActive: true,
        sellerId: l.seller.id,
      },
    });
  }

  // ── Conteneurs / Expéditions ───────────────────────────────────────────────
  const importer1Profile = await prisma.importerProfile.findUnique({
    where: { userId: importer1.id },
  });
  const importer2Profile = await prisma.importerProfile.findUnique({
    where: { userId: importer2.id },
  });

  const shipment1 = await prisma.shipment.create({
    data: {
      reference: "CNT-2026-04",
      type: "LCL",
      status: "IN_TRANSIT",
      origin: "Guangzhou",
      destination: "Conakry",
      departureDate: new Date("2026-04-15"),
      estimatedArrival: new Date("2026-05-20"),
      capacityM3: 68,
      usedM3: 45,
      pricePerM3: 180,
      importerId: importer1Profile!.id,
      trackingEvents: {
        create: [
          { location: "Guangzhou, Chine", description: "Chargement du conteneur terminé", status: "LOADING", timestamp: new Date("2026-04-15T10:00:00Z") },
          { location: "Port de Guangzhou", description: "Départ du port", status: "IN_TRANSIT", timestamp: new Date("2026-04-16T08:00:00Z") },
          { location: "Océan Indien", description: "En transit - position estimée", status: "IN_TRANSIT", timestamp: new Date("2026-05-01T00:00:00Z") },
        ],
      },
    },
  });

  await prisma.shipment.create({
    data: {
      reference: "CNT-2026-03",
      type: "FCL20",
      status: "DELIVERED",
      origin: "Yiwu",
      destination: "Conakry",
      departureDate: new Date("2026-03-01"),
      estimatedArrival: new Date("2026-04-10"),
      actualArrival: new Date("2026-04-08"),
      capacityM3: 33,
      usedM3: 33,
      fullPrice: 3200,
      customsFee: 12000000,
      importerId: importer2Profile!.id,
      trackingEvents: {
        create: [
          { location: "Yiwu, Chine", description: "Chargement conteneur 20 pieds", status: "LOADING", timestamp: new Date("2026-03-01T09:00:00Z") },
          { location: "Port de Ningbo", description: "Départ", status: "IN_TRANSIT", timestamp: new Date("2026-03-02T14:00:00Z") },
          { location: "Port Lomé, Togo", description: "Escale technique", status: "IN_TRANSIT", timestamp: new Date("2026-03-28T11:00:00Z") },
          { location: "Port de Conakry", description: "Arrivée - en attente douane", status: "CUSTOMS", timestamp: new Date("2026-04-05T08:00:00Z") },
          { location: "Douane Conakry", description: "Dédouanement terminé", status: "DELIVERED", timestamp: new Date("2026-04-08T16:00:00Z") },
        ],
      },
    },
  });

  // Conteneur ouvert en réservation
  await prisma.shipment.create({
    data: {
      reference: "CNT-2026-05",
      type: "LCL",
      status: "BOOKING",
      origin: "Shenzhen",
      destination: "Conakry",
      departureDate: new Date("2026-05-30"),
      estimatedArrival: new Date("2026-07-05"),
      capacityM3: 68,
      usedM3: 12,
      pricePerM3: 190,
      importerId: importer1Profile!.id,
    },
  });

  // ── Commandes ─────────────────────────────────────────────────────────────
  const products = await prisma.product.findMany({ take: 5 });

  const orderStatuses = ["COMPLETED", "IN_CUSTOMS", "SHIPPED", "CONFIRMED", "PENDING"];

  for (let i = 0; i < 5; i++) {
    const product = products[i];
    const qty = 10 + i * 5;
    const priceGNF = (product.priceUSD ?? 50) * 8600;

    await prisma.order.create({
      data: {
        reference: `ORD-2026-${String(i + 1).padStart(4, "0")}`,
        status: orderStatuses[i],
        type: "CHINA_IMPORT",
        buyerId: importer1.id,
        sellerId: supplier1.id,
        subtotalGNF: priceGNF * qty,
        shippingFeeGNF: 500000,
        platformFeeGNF: Math.round(priceGNF * qty * 0.02),
        totalGNF: priceGNF * qty + 500000,
        paymentMethod: i % 2 === 0 ? "ORANGE_MONEY" : "MTN_MOMO",
        paymentStatus: i === 0 ? "RELEASED" : i < 3 ? "IN_ESCROW" : "PENDING",
        escrowReleased: i === 0,
        deliveryCity: "Conakry",
        deliveryRegion: "Conakry",
        shipmentId: i < 2 ? shipment1.id : null,
        items: {
          create: [{
            productId: product.id,
            title: product.title,
            image: JSON.parse(product.images)[0] ?? null,
            priceGNF,
            quantity: qty,
          }],
        },
      },
    });
  }

  // ── Avis ─────────────────────────────────────────────────────────────────
  await prisma.review.create({
    data: {
      rating: 5,
      comment: "Excellente qualité, livraison rapide. Je recommande vivement ce fournisseur.",
      authorId: importer1.id,
      targetId: supplier1.id,
    },
  });

  await prisma.review.create({
    data: {
      rating: 4,
      comment: "Bon rapport qualité-prix pour le textile. Quelques retards mais le produit est conforme.",
      authorId: importer2.id,
      targetId: supplier2.id,
    },
  });

  // ── Notifications ─────────────────────────────────────────────────────────
  await prisma.notification.create({
    data: {
      userId: importer1.id,
      type: "SHIPMENT_UPDATE",
      title: "Mise à jour conteneur CNT-2026-04",
      body: "Votre conteneur est en transit — position : Océan Indien. Arrivée estimée : 20 mai 2026.",
      data: JSON.stringify({ shipmentRef: "CNT-2026-04" }),
    },
  });

  await prisma.notification.create({
    data: {
      userId: importer1.id,
      type: "ORDER_CONFIRMED",
      title: "Commande ORD-2026-0002 confirmée",
      body: "Votre commande a été confirmée par le fournisseur Guangzhou Tech Co.",
      data: JSON.stringify({ orderRef: "ORD-2026-0002" }),
    },
  });

  console.log("✅ Seed terminé !");
  console.log("   👤 2 fournisseurs chinois");
  console.log("   📦 20 produits (10 électronique + 10 textile)");
  console.log("   🏪 3 importateurs + 2 commerçants locaux + 5 particuliers");
  console.log("   🚢 3 conteneurs (1 BOOKING, 1 IN_TRANSIT, 1 DELIVERED)");
  console.log("   🛒 5 commandes avec statuts variés");
  console.log("   📋 10 annonces occasion");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
