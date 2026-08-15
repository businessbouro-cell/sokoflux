"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Navbar } from "@/components/layout/Navbar";
import { BottomNav } from "@/components/layout/BottomNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PRODUCT_CATEGORIES, SHIPPING_TYPES } from "@/constants/categories";
import { Loader2, Plus, X } from "lucide-react";

const Schema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().min(10).max(5000),
  priceUSD: z.number().positive(),
  category: z.string().min(1),
  minOrderQty: z.number().int().positive(),
  stockQty: z.number().int().nonnegative(),
  weight: z.number().optional(),
  dimensions: z.string().optional(),
  shippingType: z.string(),
  shippingPort: z.string().optional(),
  leadTimeDays: z.number().int().positive(),
});

type FormData = z.infer<typeof Schema>;

async function uploadImage(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch("/api/upload", { method: "POST", body: fd });
  if (!res.ok) throw new Error("Upload échoué");
  const data = await res.json();
  return data.url as string;
}

export default function NewProductPage() {
  const router = useRouter();
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(Schema),
    defaultValues: { minOrderQty: 1, stockQty: 0, shippingType: "LCL", leadTimeDays: 30 },
  });

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (images.length + files.length > 8) return;
    setUploading(true);
    const urls = await Promise.all(files.map(uploadImage));
    setImages((p) => [...p, ...urls]);
    setUploading(false);
  }

  async function onSubmit(data: FormData) {
    if (images.length === 0) return;
    const res = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, images }),
    });
    if (res.ok) router.push("/dashboard/supplier");
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 pb-20 md:pb-0">
        <div className="mx-auto max-w-xl px-4 py-6">
          <div className="flex items-center gap-3 mb-6">
            <Link href="/dashboard/supplier" className="text-gray-400 hover:text-gray-600">←</Link>
            <h1 className="text-xl font-bold text-gray-900">Nouveau produit</h1>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Photos */}
            <div>
              <Label>Photos (1-8)</Label>
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
                  <label className="aspect-square rounded-xl border-2 border-dashed border-[#E8E4DB] flex items-center justify-center cursor-pointer hover:border-[#1D9E75]">
                    {uploading ? <Loader2 size={18} className="animate-spin text-gray-400" /> : <Plus size={20} className="text-gray-400" />}
                    <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />
                  </label>
                )}
              </div>
              {images.length === 0 && <p className="text-xs text-red-500 mt-1">Au moins 1 photo requise</p>}
            </div>

            <div>
              <Label>Nom du produit</Label>
              <Input {...register("title")} placeholder="Smartphone Android 6.7 pouces..." className="mt-1" />
              {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
            </div>

            <div>
              <Label>Description</Label>
              <textarea {...register("description")} rows={4} placeholder="Specs techniques, utilisation, matériaux..." className="mt-1 w-full rounded-xl border border-[#E8E4DB] px-3 py-2 text-sm focus:outline-none focus:border-[#1D9E75] resize-none" />
              {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Prix unitaire (USD)</Label>
                <Input {...register("priceUSD", { valueAsNumber: true })} type="number" step="0.01" placeholder="25.00" className="mt-1" />
                {errors.priceUSD && <p className="text-red-500 text-xs mt-1">{errors.priceUSD.message}</p>}
              </div>
              <div>
                <Label>Catégorie</Label>
                <select {...register("category")} className="mt-1 w-full rounded-xl border border-[#E8E4DB] px-3 py-2 text-sm bg-white focus:outline-none focus:border-[#1D9E75]">
                  <option value="">-- Choisir --</option>
                  {PRODUCT_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
                {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>MOQ (unités min.)</Label>
                <Input {...register("minOrderQty", { valueAsNumber: true })} type="number" min="1" placeholder="50" className="mt-1" />
              </div>
              <div>
                <Label>Stock disponible</Label>
                <Input {...register("stockQty", { valueAsNumber: true })} type="number" min="0" placeholder="500" className="mt-1" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Délai (jours)</Label>
                <Input {...register("leadTimeDays", { valueAsNumber: true })} type="number" min="1" placeholder="30" className="mt-1" />
              </div>
              <div>
                <Label>Port d&apos;expédition</Label>
                <Input {...register("shippingPort")} placeholder="Guangzhou" className="mt-1" />
              </div>
            </div>

            <div>
              <Label>Type d&apos;expédition</Label>
              <select {...register("shippingType")} className="mt-1 w-full rounded-xl border border-[#E8E4DB] px-3 py-2 text-sm bg-white focus:outline-none focus:border-[#1D9E75]">
                {SHIPPING_TYPES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={isSubmitting || images.length === 0}>
              {isSubmitting ? <><Loader2 size={16} className="animate-spin mr-2" />Publication...</> : "Publier le produit"}
            </Button>
          </form>
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
