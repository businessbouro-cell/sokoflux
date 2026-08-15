"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Navbar } from "@/components/layout/Navbar";
import { BottomNav } from "@/components/layout/BottomNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RegionSelect, CitySelect } from "@/components/common/RegionSelect";
import { ITEM_CONDITIONS, PRODUCT_CATEGORIES } from "@/constants/categories";
import { Loader2, Plus, X } from "lucide-react";

const ListingSchema = z.object({
  title: z.string().min(3, "Titre trop court").max(100),
  description: z.string().min(10, "Description trop courte").max(2000),
  price: z.number().positive("Prix invalide"),
  category: z.string().min(1, "Sélectionnez une catégorie"),
  condition: z.string().min(1, "Sélectionnez un état"),
  region: z.string().min(1, "Sélectionnez une région"),
  city: z.string().min(1, "Sélectionnez une ville"),
  phone: z.string().optional(),
});

type ListingForm = z.infer<typeof ListingSchema>;

async function uploadImage(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch("/api/upload", { method: "POST", body: fd });
  if (!res.ok) throw new Error("Upload échoué");
  const data = await res.json();
  return data.url as string;
}

export default function NewListingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState("");

  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<ListingForm>({
    resolver: zodResolver(ListingSchema),
  });

  if (status === "unauthenticated") {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center gap-4 px-4">
          <p className="text-lg font-semibold text-gray-700">Connexion requise</p>
          <Button asChild><Link href="/login">Se connecter</Link></Button>
        </div>
        <BottomNav />
      </div>
    );
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (images.length + files.length > 8) return;
    setUploading(true);
    const urls = await Promise.all(files.map(uploadImage));
    setImages((prev) => [...prev, ...urls]);
    setUploading(false);
  }

  async function onSubmit(data: ListingForm) {
    if (images.length === 0) return;
    const res = await fetch("/api/listings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, images }),
    });
    if (res.ok) {
      const listing = await res.json();
      router.push(`/listings/${listing.id}`);
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 pb-20 md:pb-0">
        <div className="mx-auto max-w-xl px-4 py-6">
          <h1 className="text-xl font-bold text-gray-900 mb-6">Publier une annonce</h1>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Photos */}
            <div>
              <Label>Photos <span className="text-gray-400 font-normal">(1-8)</span></Label>
              <div className="mt-2 grid grid-cols-4 gap-2">
                {images.map((img, i) => (
                  <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-[#F7F5F0]">
                    <img src={img} alt="" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => setImages((p) => p.filter((_, j) => j !== i))} className="absolute top-1 right-1 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center">
                      <X size={10} className="text-white" />
                    </button>
                  </div>
                ))}
                {images.length < 8 && (
                  <label className="aspect-square rounded-xl border-2 border-dashed border-[#E8E4DB] flex flex-col items-center justify-center cursor-pointer hover:border-[#1D9E75] transition-colors">
                    {uploading ? <Loader2 size={18} className="animate-spin text-gray-400" /> : <Plus size={20} className="text-gray-400" />}
                    <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />
                  </label>
                )}
              </div>
              {images.length === 0 && <p className="text-xs text-red-500 mt-1">Au moins une photo requise</p>}
            </div>

            {/* Titre */}
            <div>
              <Label>Titre de l&apos;annonce</Label>
              <Input {...register("title")} placeholder="iPhone 13 Pro Max 256Go..." className="mt-1" />
              {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
            </div>

            {/* Description */}
            <div>
              <Label>Description</Label>
              <textarea
                {...register("description")}
                rows={4}
                placeholder="Décrivez votre article en détail — état, utilisation, défauts éventuels..."
                className="mt-1 w-full rounded-xl border border-[#E8E4DB] px-3 py-2 text-sm focus:outline-none focus:border-[#1D9E75] resize-none"
              />
              {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
            </div>

            {/* Prix */}
            <div>
              <Label>Prix (GNF)</Label>
              <div className="relative mt-1">
                <Input {...register("price", { valueAsNumber: true })} type="number" placeholder="500000" className="pr-16" />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">GNF</span>
              </div>
              {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price.message}</p>}
            </div>

            {/* Catégorie + État */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Catégorie</Label>
                <select {...register("category")} className="mt-1 w-full rounded-xl border border-[#E8E4DB] px-3 py-2 text-sm bg-white focus:outline-none focus:border-[#1D9E75]">
                  <option value="">-- Choisir --</option>
                  {PRODUCT_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
                {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category.message}</p>}
              </div>
              <div>
                <Label>État</Label>
                <select {...register("condition")} className="mt-1 w-full rounded-xl border border-[#E8E4DB] px-3 py-2 text-sm bg-white focus:outline-none focus:border-[#1D9E75]">
                  <option value="">-- Choisir --</option>
                  {ITEM_CONDITIONS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
                {errors.condition && <p className="text-red-500 text-xs mt-1">{errors.condition.message}</p>}
              </div>
            </div>

            {/* Localisation */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Région</Label>
                <RegionSelect
                  value={selectedRegion}
                  onValueChange={(v) => { setSelectedRegion(v); setValue("region", v); setValue("city", ""); }}
                />
                {errors.region && <p className="text-red-500 text-xs mt-1">{errors.region.message}</p>}
              </div>
              <div>
                <Label>Ville</Label>
                <CitySelect
                  regionName={selectedRegion}
                  value={watch("city") ?? ""}
                  onValueChange={(v) => setValue("city", v)}
                />
                {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city.message}</p>}
              </div>
            </div>

            {/* Téléphone de contact */}
            <div>
              <Label>Téléphone de contact <span className="text-gray-400 font-normal">(optionnel)</span></Label>
              <Input {...register("phone")} placeholder="+224 620 00 00 00" className="mt-1" />
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={isSubmitting || images.length === 0}>
              {isSubmitting ? <><Loader2 size={16} className="animate-spin mr-2" />Publication...</> : "Publier l'annonce"}
            </Button>
          </form>
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
