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
import { Eye, EyeOff, Loader2 } from "lucide-react";

const LoginSchema = z.object({
  phone: z.string().min(8, "Numéro invalide"),
  password: z.string().min(1, "Mot de passe requis"),
});

type LoginForm = z.infer<typeof LoginSchema>;

export default function LoginPage() {
  const router = useRouter();
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

    router.push("/");
    router.refresh();
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-[#E8E4DB] p-6">
      {/* Logo */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 mb-2">
          <span className="text-2xl font-bold text-[#1D9E75]">Soko</span>
          <span className="text-2xl font-bold text-[#EF9F27]">Flux</span>
        </div>
        <p className="text-gray-500 text-sm">Connectez-vous à votre compte</p>
      </div>

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

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? <><Loader2 size={16} className="animate-spin mr-2" />Connexion...</> : "Se connecter"}
        </Button>
      </form>

      <div className="mt-4 text-center text-sm text-gray-500">
        Pas encore de compte ?{" "}
        <Link href="/register" className="text-[#1D9E75] font-medium">
          Créer un compte
        </Link>
      </div>
    </div>
  );
}
