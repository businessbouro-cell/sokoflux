import Link from "next/link";
import Image from "next/image";
import { Package, MapPin } from "lucide-react";
import { formatUSD } from "@/lib/utils/currency";
import { parseJsonField } from "@/lib/utils/formatters";
import { Badge } from "@/components/ui/badge";

interface ProductCardProps {
  product: {
    id: string;
    title: string;
    priceUSD: number | null;
    images: string;
    minOrderQty: number;
    category: string;
    shippingType: string | null;
    leadTimeDays: number | null;
    supplier: {
      companyName: string;
      city: string;
      isVerified: boolean;
      rating: number;
    } | null;
  };
}

export function ProductCard({ product }: ProductCardProps) {
  const images = parseJsonField<string[]>(product.images, []);
  const mainImage = images[0] ?? "/placeholder-product.jpg";

  return (
    <Link
      href={`/products/${product.id}`}
      className="group block bg-white rounded-xl border border-[#E8E4DB] overflow-hidden hover:shadow-md hover:border-[#1D9E75] transition-all"
    >
      <div className="relative aspect-square overflow-hidden bg-[#F7F5F0]">
        <Image
          src={mainImage}
          alt={product.title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />
        {product.supplier?.isVerified && (
          <div className="absolute top-2 right-2">
            <span className="bg-[#1D9E75] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">✓</span>
          </div>
        )}
      </div>

      <div className="p-3">
        <p className="font-semibold text-sm text-gray-900 line-clamp-2 leading-snug">{product.title}</p>
        <p className="text-[#1D9E75] font-bold text-base mt-1">{product.priceUSD ? formatUSD(product.priceUSD) : "—"}</p>
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5">
            <Package size={9} className="mr-1" />MOQ {product.minOrderQty}
          </Badge>
          {product.leadTimeDays && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5">
              {product.leadTimeDays}j
            </Badge>
          )}
        </div>
        {product.supplier && (
          <div className="flex items-center gap-1 mt-2 text-xs text-gray-400">
            <MapPin size={11} />
            <span>{product.supplier.companyName} · {product.supplier.city}</span>
          </div>
        )}
      </div>
    </Link>
  );
}
