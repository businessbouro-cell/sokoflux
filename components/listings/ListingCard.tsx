import Link from "next/link";
import Image from "next/image";
import { MapPin, Eye } from "lucide-react";
import { ConditionBadge } from "@/components/common/ConditionBadge";
import { formatGNF } from "@/lib/utils/currency";
import { parseJsonField } from "@/lib/utils/formatters";
import { formatRelative } from "@/lib/utils/formatters";

interface ListingCardProps {
  listing: {
    id: string;
    title: string;
    price: number;
    images: string;
    condition: string;
    city: string;
    region: string;
    viewCount: number;
    createdAt: string | Date;
    isSold: boolean;
  };
}

export function ListingCard({ listing }: ListingCardProps) {
  const images = parseJsonField<string[]>(listing.images, []);
  const mainImage = images[0] ?? "/placeholder-product.jpg";

  return (
    <Link
      href={`/listings/${listing.id}`}
      className={`group block bg-white rounded-xl border border-[#E8E4DB] overflow-hidden hover:shadow-md hover:border-[#1D9E75] transition-all ${listing.isSold ? "opacity-60" : ""}`}
    >
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-[#F7F5F0]">
        <Image
          src={mainImage}
          alt={listing.title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />
        {listing.isSold && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="bg-white text-gray-900 text-xs font-bold px-3 py-1 rounded-full">VENDU</span>
          </div>
        )}
        <div className="absolute top-2 left-2">
          <ConditionBadge condition={listing.condition} />
        </div>
      </div>

      {/* Infos */}
      <div className="p-3">
        <p className="font-semibold text-sm text-gray-900 line-clamp-2 leading-snug">{listing.title}</p>
        <p className="text-[#1D9E75] font-bold text-base mt-1">{formatGNF(listing.price)}</p>
        <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <MapPin size={11} /> {listing.city}
          </span>
          <span className="flex items-center gap-1">
            <Eye size={11} /> {listing.viewCount}
          </span>
        </div>
        <p className="text-[10px] text-gray-300 mt-1">{formatRelative(listing.createdAt)}</p>
      </div>
    </Link>
  );
}
