"use client";

import { useState } from "react";
import { signIn, getSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhoneInput } from "@/components/common/PhoneInput";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Suspense } from "react";

const LoginSchema = z.object({
  phone: z.string().min(8, "Numéro invalide"),
  password: z.string().min(1, "Mot de passe requis"),
});
type LoginForm = z.infer<typeof LoginSchema>;

function getRedirectForRoles(roles: string[]): string {
  if (roles.includes("ADMIN")) return "/admin";
  if (roles.includes("SUPPLIER")) return "/dashboard/supplier";
  if (roles.includes("IMPORTER")) return "/dashboard/importer";
  if (roles.includes("LOCAL_MERCHANT")) return "/dashboard/merchant";
  return "/";
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const justRegistered = searchParams.get("registered") === "1";
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<LoginForm>({
    resolver: zodResolver(LoginSchema),
  });

  async function onSubmit(data: LoginForm) {
    setError("");
    const result = await signIn("credentials", {
      phone: data.phone,
      password: data.password,
      redirect: false,
    });

    if (result?.error) {
      setError("Numéro ou mot de passe incorrect.");
      return;
    }

    // Récupérer la session pour connaître le rôle et rediriger
    const session = await getSession();
    const roles = (session?.user?.roles as string[]) ?? [];
    router.push(getRedirectForRoles(roles));
    router.refresh();
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-[#E8E4DB] p-6">
      {/* Logo */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-1 mb-2">
          <span className="text-2xl font-bold text-[#1D9E75]">Soko</span>
          <span className="text-2xl font-bold text-[#EF9F27]">Flux</span>
        </div>
        <p className="text-gray-500 text-sm">Connectez-vous à votre compte</p>
      </div>

      {justRegistered && (
        <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-green-700 text-sm mb-4 text-center">
          ✅ Compte créé avec succès ! Connectez-vous.
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label htmlFor="phone">Numéro de téléphone</Label>
          <PhoneInput
            id="phone"
            placeholder="620 00 00 00"
            onChange={(val) => setValue("phone", val)}
            className="mt-1"
          />
          {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
        </div>

        <div>
          <Label htmlFor="password">Mot de passe</Label>
          <div className="relative mt-1">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              {...register("password")}
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-red-700 text-sm">
            {error}
          </div>
        )}

        <Button
          type="submit"
          className="w-full bg-[#1D9E75] hover:bg-[#0F6E56]"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <><Loader2 size={16} className="animate-spin mr-2" />Connexion...</>
          ) : (
            "Se connecter"
          )}
        </Button>
      </form>

      {/* Accès rapide (dev) */}
      <div className="mt-4 border-t border-[#E8E4DB] pt-4">
        <p className="text-xs text-gray-400 text-center mb-2">Accès de démonstration</p>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: "👤 Acheteur", phone: "+224600000001", pwd: "password123" },
            { label: "🏭 Fournisseur", phone: "+224600000002", pwd: "password123" },
            { label: "🚢 Importateur", phone: "+224600000003", pwd: "password123" },
            { label: "🔑 Admin", phone: "+224600000000", pwd: "admin123" },
          ].map((demo) => (
            <button
              key={demo.label}
              type="button"
              onClick={async () => {
                setError("");
                const result = await signIn("credentials", {
                  phone: demo.phone,
                  password: demo.pwd,
                  redirect: false,
                });
                if (result?.error) { setError("Compte démo non disponible."); return; }
                const session = await getSession();
                const roles = (session?.user?.roles as string[]) ?? [];
                router.push(getRedirectForRoles(roles));
                router.refresh();
              }}
              className="text-xs border border-[#E8E4DB] rounded-lg px-2 py-2 hover:bg-[#F7F5F0] text-gray-600 transition-colors text-left"
            >
              {demo.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 text-center text-sm text-gray-500">
        Pas encore de compte ?{" "}
        <Link href="/register" className="text-[#1D9E75] font-medium hover:underline">
          Créer un compte
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
