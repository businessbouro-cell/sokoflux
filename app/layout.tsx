import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "SokoFlux — Marketplace Afrique de l'Ouest",
  description: "La marketplace e-commerce qui connecte la Chine et l'Afrique de l'Ouest. Importez, vendez et achetez en Guinée.",
  manifest: "/manifest.json",
  keywords: ["marketplace", "Guinée", "Conakry", "import Chine", "e-commerce", "Afrique de l'Ouest"],
  authors: [{ name: "SokoFlux" }],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#1D9E75",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className="h-full">
      <body className="min-h-full bg-white text-gray-900 antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
