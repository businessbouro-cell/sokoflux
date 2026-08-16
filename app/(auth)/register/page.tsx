"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhoneInput } from "@/components/common/PhoneInput";
import { Eye, EyeOff, Loader2, Check, ArrowLeft } from "lucide-react";

const Step1Schema = z.object({
  name: z.string().min(2, "Nom trop court"),
  phone: z.string().min(8, "Numéro invalide"),
  password: z.string().min(8, "Au moins 8 caractères"),
});
type Step1Form = z.infer<typeof Step1Schema>;

const ROLES = [
  {
    value: "INDIVIDUAL",
    icon: "🛒",
    label: "Acheteur",
    desc: "J'achète des produits ou articles d'occasion",
    color: "from-blue-50 to-blue-100 border-blue-200",
    activeColor: "from-blue-100 to-blue-200 border-blue-500",
    badge: "Le plus populaire",
  },
  {
    value: "LOCAL_MERCHANT",
    icon: "🏪",
    label: "Commerçant local",
    desc: "Je vends des produits en Guinée (boutique, marché)",
    color: "from-amber-50 to-amber-100 border-amber-200",
    activeColor: "from-amber-100 to-amber-200 border-amber-500",
    badge: null,
  },
  {
    value: "IMPORTER",
    icon: "🚢",
    label: "Importateur",
    desc: "J'importe des conteneurs depuis la Chine",
    color: "from-purple-50 to-purple-100 border-purple-200",
    activeColor: "from-purple-100 to-purple-200 border-purple-500",
    badge: null,
  },
  {
    value: "SUPPLIER",
    icon: "🏭",
    label: "Fournisseur (Chine)",
    desc: "Je vends mes produits aux acheteurs africains",
    color: "from-red-50 to-red-100 border-red-200",
    activeColor: "from-red-100 to-red-200 border-red-500",
    badge: null,
  },
] as const;

type RoleValue = (typeof ROLES)[number]["value"];

const ROLE_REDIRECTS: Record<RoleValue, string> = {
  INDIVIDUAL: "/",
  LOCAL_MERCHANT: "/dashboard/merchant",
  IMPORTER: "/dashboard/importer",
  SUPPLIER: "/dashboard/supplier",
};

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<RoleValue | null>(null);
  const [step1Data, setStep1Data] = useState<Step1Form | null>(null);
  const [globalError, setGlobalError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<Step1Form>({
    resolver: zodResolver(Step1Schema),
  });

  function onStep1(data: Step1Form) {
    setStep1Data(data);
    setStep(2);
  }

  async function onFinish() {
    if (!step1Data || !selectedRole) return;
    setIsLoading(true);
    setGlobalError("");

    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...step1Data, role: selectedRole }),
    });

    if (!res.ok) {
      const err = await res.json();
      setGlobalError(err.error ?? "Erreur lors de la création du compte.");
      setIsLoading(false);
      return;
    }

    // Auto-login après inscription
    const result = await signIn("credentials", {
      phone: step1Data.phone,
      password: step1Data.password,
      redirect: false,
    });

    if (result?.error) {
      setGlobalError("Compte créé mais connexion échouée. Essayez de vous connecter.");
      setIsLoading(false);
      router.push("/login");
      return;
    }

    router.push(ROLE_REDIRECTS[selectedRole]);
    router.refresh();
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-[#E8E4DB] p-6">
      {/* Logo */}
      <div className="text-center mb-5">
        <div className="inline-flex items-center gap-1 mb-1">
          <span className="text-2xl font-bold text-[#1D9E75]">Soko</span>
          <span className="text-2xl font-bold text-[#EF9F27]">Flux</span>
        </div>
        <p className="text-gray-500 text-sm">Créer un compte gratuit</p>
      </div>

      {/* Étapes */}
      <div className="flex items-center gap-2 mb-6">
        {[1, 2].map((n) => (
          <div key={n} className="flex items-center gap-2 flex-1">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${step > n ? "bg-[#1D9E75] text-white" : step === n ? "bg-[#1D9E75] text-white ring-4 ring-[#1D9E75]/20" : "bg-[#E8E4DB] text-gray-400"}`}>
              {step > n ? <Check size={13} /> : n}
            </div>
            <span className={`text-xs font-medium ${step === n ? "text-[#1D9E75]" : "text-gray-400"}`}>
              {n === 1 ? "Vos informations" : "Votre profil"}
            </span>
            {n < 2 && <div className={`flex-1 h-px ${step > n ? "bg-[#1D9E75]" : "bg-[#E8E4DB]"}`} />}
          </div>
        ))}
      </div>

      {/* ── Étape 1 : infos ── */}
      {step === 1 && (
        <form onSubmit={handleSubmit(onStep1)} className="space-y-4">
          <div>
            <Label>Nom complet</Label>
            <Input {...register("name")} placeholder="Mamadou Diallo" className="mt-1" />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
          </div>
          <div>
            <Label>Numéro de téléphone</Label>
            <PhoneInput placeholder="620 00 00 00" onChange={(v) => setValue("phone", v)} className="mt-1" />
            {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
          </div>
          <div>
            <Label>Mot de passe</Label>
            <div className="relative mt-1">
              <Input
                type={showPassword ? "text" : "password"}
                {...register("password")}
                placeholder="••••••••"
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
          <Button type="submit" className="w-full bg-[#1D9E75] hover:bg-[#0F6E56]">
            Continuer →
          </Button>
        </form>
      )}

      {/* ── Étape 2 : rôle ── */}
      {step === 2 && (
        <div className="space-y-3">
          <p className="text-sm text-gray-600 text-center mb-4">
            Comment allez-vous utiliser SokoFlux ?
          </p>
          {ROLES.map((role) => {
            const isSelected = selectedRole === role.value;
            return (
              <button
                key={role.value}
                onClick={() => setSelectedRole(role.value)}
                className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 bg-gradient-to-r transition-all text-left relative ${isSelected ? role.activeColor : role.color}`}
              >
                <span className="text-2xl shrink-0">{role.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm text-gray-900">{role.label}</p>
                    {role.badge && (
                      <span className="text-[10px] bg-[#1D9E75] text-white px-2 py-0.5 rounded-full font-medium">
                        {role.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{role.desc}</p>
                </div>
                {isSelected && (
                  <div className="w-5 h-5 rounded-full bg-[#1D9E75] flex items-center justify-center shrink-0">
                    <Check size={12} className="text-white" />
                  </div>
                )}
              </button>
            );
          })}

          {globalError && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-red-700 text-sm">
              {globalError}
            </div>
          )}

          <Button
            className="w-full bg-[#1D9E75] hover:bg-[#0F6E56] mt-2"
            disabled={!selectedRole || isLoading}
            onClick={onFinish}
          >
            {isLoading ? (
              <><Loader2 size={16} className="animate-spin mr-2" />Création du compte...</>
            ) : (
              "Créer mon compte"
            )}
          </Button>

          <button
            type="button"
            onClick={() => setStep(1)}
            className="w-full flex items-center justify-center gap-1 text-sm text-gray-400 hover:text-gray-600 mt-1"
          >
            <ArrowLeft size={14} /> Retour
          </button>
        </div>
      )}

      <div className="mt-4 text-center text-sm text-gray-500">
        Déjà un compte ?{" "}
        <Link href="/login" className="text-[#1D9E75] font-medium hover:underline">
          Se connecter
        </Link>
      </div>
    </div>
  );
}
