"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhoneInput } from "@/components/common/PhoneInput";
import { Eye, EyeOff, Loader2, Check } from "lucide-react";

// ─── Étape 1 : infos de base ───────────────────────────────
const Step1Schema = z.object({
  name: z.string().min(2, "Nom trop court"),
  phone: z.string().min(8, "Numéro invalide"),
  password: z.string().min(6, "Au moins 6 caractères"),
});

// ─── Étape 2 : OTP ────────────────────────────────────────
const Step2Schema = z.object({
  otp: z.string().length(6, "Le code doit avoir 6 chiffres"),
});

// ─── Étape 3 : rôle ───────────────────────────────────────
const ROLES = [
  { value: "INDIVIDUAL", icon: "👤", label: "Particulier", desc: "J'achète ou vends des articles d'occasion" },
  { value: "LOCAL_MERCHANT", icon: "🏪", label: "Commerçant local", desc: "Je vends des produits en Guinée" },
  { value: "IMPORTER", icon: "🚢", label: "Importateur", desc: "J'importe des conteneurs depuis la Chine" },
  { value: "SUPPLIER", icon: "🏭", label: "Fournisseur chinois", desc: "Je vends mes produits aux acheteurs africains" },
] as const;

type RoleValue = (typeof ROLES)[number]["value"];

type Step1Form = z.infer<typeof Step1Schema>;
type Step2Form = z.infer<typeof Step2Schema>;

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<RoleValue | null>(null);
  const [step1Data, setStep1Data] = useState<Step1Form | null>(null);
  const [globalError, setGlobalError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Formulaire étape 1
  const { register: reg1, handleSubmit: hs1, setValue: sv1, formState: { errors: e1 } } = useForm<Step1Form>({
    resolver: zodResolver(Step1Schema),
  });

  // Formulaire étape 2
  const { register: reg2, handleSubmit: hs2, formState: { errors: e2 } } = useForm<Step2Form>({
    resolver: zodResolver(Step2Schema),
  });

  // ─── Soumettre étape 1 ───────────────────────────────────
  async function onStep1(data: Step1Form) {
    setStep1Data(data);
    setStep(2);
    // Le SMS OTP est envoyé lors de la création du compte (étape finale)
  }

  // ─── Soumettre étape 2 (OTP) ────────────────────────────
  async function onStep2(data: Step2Form) {
    if (!step1Data) return;
    setGlobalError("");

    // Vérification OTP (en dev: 123456 est accepté)
    const res = await fetch("/api/auth/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: step1Data.phone, otp: data.otp }),
    });

    if (!res.ok) {
      const err = await res.json();
      setGlobalError(err.error ?? "Code incorrect.");
      return;
    }

    setStep(3);
  }

  // ─── Soumettre étape 3 (rôle + création compte) ─────────
  async function onStep3() {
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

    router.push("/login?registered=1");
  }

  const stepLabels = ["Informations", "Vérification", "Votre rôle"];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-[#E8E4DB] p-6">
      {/* Logo */}
      <div className="text-center mb-5">
        <div className="inline-flex items-center gap-2 mb-1">
          <span className="text-2xl font-bold text-[#1D9E75]">Soko</span>
          <span className="text-2xl font-bold text-[#EF9F27]">Flux</span>
        </div>
        <p className="text-gray-500 text-sm">Créer un compte</p>
      </div>

      {/* Indicateur d'étapes */}
      <div className="flex items-center justify-between mb-6">
        {stepLabels.map((label, i) => {
          const n = i + 1;
          const done = step > n;
          const active = step === n;
          return (
            <div key={n} className="flex-1 flex flex-col items-center gap-1">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${done ? "bg-[#1D9E75] text-white" : active ? "bg-[#1D9E75] text-white ring-4 ring-[#1D9E75]/20" : "bg-[#E8E4DB] text-gray-400"}`}>
                {done ? <Check size={14} /> : n}
              </div>
              <span className={`text-[10px] font-medium ${active ? "text-[#1D9E75]" : "text-gray-400"}`}>{label}</span>
              {i < 2 && <div className={`h-px w-full ${done ? "bg-[#1D9E75]" : "bg-[#E8E4DB]"} absolute`} />}
            </div>
          );
        })}
      </div>

      {/* ─── Étape 1 ─────────────────────────────────────── */}
      {step === 1 && (
        <form onSubmit={hs1(onStep1)} className="space-y-4">
          <div>
            <Label>Nom complet</Label>
            <Input {...reg1("name")} placeholder="Mamadou Diallo" className="mt-1" />
            {e1.name && <p className="text-red-500 text-xs mt-1">{e1.name.message}</p>}
          </div>
          <div>
            <Label>Numéro de téléphone</Label>
            <PhoneInput placeholder="620 00 00 00" onChange={(v) => sv1("phone", v)} className="mt-1" />
            {e1.phone && <p className="text-red-500 text-xs mt-1">{e1.phone.message}</p>}
          </div>
          <div>
            <Label>Mot de passe</Label>
            <div className="relative mt-1">
              <Input type={showPassword ? "text" : "password"} {...reg1("password")} placeholder="••••••••" className="pr-10" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {e1.password && <p className="text-red-500 text-xs mt-1">{e1.password.message}</p>}
          </div>
          <Button type="submit" className="w-full">Continuer</Button>
        </form>
      )}

      {/* ─── Étape 2 : OTP ────────────────────────────────── */}
      {step === 2 && (
        <form onSubmit={hs2(onStep2)} className="space-y-4">
          <div className="bg-[#F7F5F0] rounded-xl p-4 text-center">
            <p className="text-sm text-gray-600">Un code a été envoyé au</p>
            <p className="font-semibold text-gray-900">{step1Data?.phone}</p>
            <p className="text-xs text-gray-400 mt-1">En développement : utilisez le code <span className="font-mono font-bold">123456</span></p>
          </div>
          <div>
            <Label>Code de vérification</Label>
            <Input
              {...reg2("otp")}
              placeholder="123456"
              maxLength={6}
              className="mt-1 text-center text-xl tracking-[0.5em] font-mono"
            />
            {e2.otp && <p className="text-red-500 text-xs mt-1">{e2.otp.message}</p>}
          </div>
          {globalError && <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-red-700 text-sm">{globalError}</div>}
          <Button type="submit" className="w-full">Vérifier</Button>
          <button type="button" onClick={() => setStep(1)} className="w-full text-sm text-gray-400 hover:text-gray-600">← Retour</button>
        </form>
      )}

      {/* ─── Étape 3 : Rôle ───────────────────────────────── */}
      {step === 3 && (
        <div className="space-y-3">
          <p className="text-sm text-gray-600 text-center mb-4">Quel est votre profil sur SokoFlux ?</p>
          {ROLES.map((role) => (
            <button
              key={role.value}
              onClick={() => setSelectedRole(role.value)}
              className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${selectedRole === role.value ? "border-[#1D9E75] bg-[#1D9E75]/5" : "border-[#E8E4DB] hover:border-gray-300"}`}
            >
              <span className="text-2xl">{role.icon}</span>
              <div className="flex-1">
                <p className="font-semibold text-sm text-gray-900">{role.label}</p>
                <p className="text-xs text-gray-500">{role.desc}</p>
              </div>
              {selectedRole === role.value && <Check size={18} className="text-[#1D9E75] shrink-0" />}
            </button>
          ))}
          {globalError && <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-red-700 text-sm">{globalError}</div>}
          <Button className="w-full mt-2" disabled={!selectedRole || isLoading} onClick={onStep3}>
            {isLoading ? <><Loader2 size={16} className="animate-spin mr-2" />Création...</> : "Créer mon compte"}
          </Button>
        </div>
      )}

      <div className="mt-4 text-center text-sm text-gray-500">
        Déjà un compte ?{" "}
        <Link href="/login" className="text-[#1D9E75] font-medium">Se connecter</Link>
      </div>
    </div>
  );
}
