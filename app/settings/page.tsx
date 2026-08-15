"use client";

import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { BottomNav } from "@/components/layout/BottomNav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Bell, Shield, LogOut, ChevronRight, Phone, Globe, ChevronDown, Eye, EyeOff } from "lucide-react";

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [notifEmail, setNotifEmail] = useState(true);
  const [notifSms, setNotifSms] = useState(true);
  const [notifPush, setNotifPush] = useState(false);
  const [showPwdForm, setShowPwdForm] = useState(false);
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [pwdError, setPwdError] = useState("");
  const [pwdSuccess, setPwdSuccess] = useState(false);
  const [savingPwd, setSavingPwd] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (session?.user?.name) setName(session.user.name);
  }, [status, session, router]);

  async function handlePasswordChange() {
    setPwdError("");
    if (newPwd !== confirmPwd) { setPwdError("Les mots de passe ne correspondent pas"); return; }
    if (newPwd.length < 8) { setPwdError("Au moins 8 caractères requis"); return; }
    setSavingPwd(true);
    const res = await fetch("/api/users/me/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: currentPwd, newPassword: newPwd }),
    });
    setSavingPwd(false);
    if (res.ok) {
      setPwdSuccess(true);
      setCurrentPwd(""); setNewPwd(""); setConfirmPwd("");
      setTimeout(() => { setPwdSuccess(false); setShowPwdForm(false); }, 2500);
    } else {
      const d = await res.json();
      setPwdError(d.error ?? "Erreur");
    }
  }

  async function handleSave() {
    setSaving(true);
    await fetch("/api/users/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 pb-20 md:pb-0">
        <div className="mx-auto max-w-2xl px-4 py-6 space-y-4">
          <h1 className="text-xl font-bold text-gray-900 mb-6">Paramètres</h1>

          {/* Profil */}
          <div className="bg-white rounded-xl border border-[#E8E4DB] overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-[#E8E4DB]">
              <User size={16} className="text-[#1D9E75]" />
              <h2 className="font-semibold text-gray-900">Informations personnelles</h2>
            </div>
            <div className="px-5 py-4 space-y-4">
              <div>
                <Label>Nom complet</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label>Téléphone</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Phone size={14} className="text-gray-400" />
                  <span className="text-sm text-gray-600">{session?.user?.phone ?? "—"}</span>
                  <span className="text-xs text-gray-400">(non modifiable)</span>
                </div>
              </div>
              <Button onClick={handleSave} disabled={saving || !name.trim()} size="sm">
                {saving ? "Enregistrement..." : saved ? "✓ Enregistré" : "Enregistrer"}
              </Button>
            </div>
          </div>

          {/* Notifications */}
          <div className="bg-white rounded-xl border border-[#E8E4DB] overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-[#E8E4DB]">
              <Bell size={16} className="text-[#1D9E75]" />
              <h2 className="font-semibold text-gray-900">Notifications</h2>
            </div>
            <div className="divide-y divide-[#E8E4DB]">
              {[
                { label: "Email", sub: "Commandes, livraisons, paiements", value: notifEmail, set: setNotifEmail },
                { label: "SMS", sub: "OTP et alertes importantes", value: notifSms, set: setNotifSms },
                { label: "Push", sub: "Notifications navigateur", value: notifPush, set: setNotifPush },
              ].map(({ label, sub, value, set }) => (
                <div key={label} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{label}</p>
                    <p className="text-xs text-gray-500">{sub}</p>
                  </div>
                  <button
                    onClick={() => set(!value)}
                    className={`w-10 h-6 rounded-full transition-colors relative ${value ? "bg-[#1D9E75]" : "bg-gray-200"}`}
                  >
                    <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${value ? "translate-x-4.5 left-0.5" : "left-0.5"}`} style={{ transform: value ? "translateX(16px)" : "translateX(0)" }} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Langue */}
          <div className="bg-white rounded-xl border border-[#E8E4DB] overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-[#E8E4DB]">
              <Globe size={16} className="text-[#1D9E75]" />
              <h2 className="font-semibold text-gray-900">Langue et région</h2>
            </div>
            <button className="w-full flex items-center justify-between px-5 py-3 hover:bg-[#F7F5F0]">
              <div>
                <p className="text-sm font-medium text-gray-900">Français (Guinée)</p>
                <p className="text-xs text-gray-500">GNF · Africa/Conakry</p>
              </div>
              <ChevronRight size={16} className="text-gray-400" />
            </button>
          </div>

          {/* Sécurité */}
          <div className="bg-white rounded-xl border border-[#E8E4DB] overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-[#E8E4DB]">
              <Shield size={16} className="text-[#1D9E75]" />
              <h2 className="font-semibold text-gray-900">Sécurité</h2>
            </div>
            <button
              onClick={() => { setShowPwdForm((v) => !v); setPwdError(""); setPwdSuccess(false); }}
              className="w-full flex items-center justify-between px-5 py-3 hover:bg-[#F7F5F0]"
            >
              <p className="text-sm font-medium text-gray-900">Changer le mot de passe</p>
              {showPwdForm ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronRight size={16} className="text-gray-400" />}
            </button>
            {showPwdForm && (
              <div className="px-5 pb-5 space-y-3 border-t border-[#E8E4DB] pt-4">
                <div>
                  <Label>Mot de passe actuel</Label>
                  <div className="relative mt-1">
                    <Input type={showPwd ? "text" : "password"} value={currentPwd} onChange={(e) => setCurrentPwd(e.target.value)} className="pr-10" />
                    <button type="button" onClick={() => setShowPwd((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                      {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
                <div>
                  <Label>Nouveau mot de passe</Label>
                  <Input type={showPwd ? "text" : "password"} value={newPwd} onChange={(e) => setNewPwd(e.target.value)} className="mt-1" placeholder="8 caractères minimum" />
                </div>
                <div>
                  <Label>Confirmer le nouveau mot de passe</Label>
                  <Input type={showPwd ? "text" : "password"} value={confirmPwd} onChange={(e) => setConfirmPwd(e.target.value)} className="mt-1" />
                </div>
                {pwdError && <p className="text-xs text-red-500">{pwdError}</p>}
                {pwdSuccess && <p className="text-xs text-green-600">✓ Mot de passe modifié avec succès</p>}
                <Button onClick={handlePasswordChange} disabled={savingPwd || !currentPwd || !newPwd || !confirmPwd} size="sm">
                  {savingPwd ? "Modification..." : "Modifier le mot de passe"}
                </Button>
              </div>
            )}
            <button className="w-full flex items-center justify-between px-5 py-3 hover:bg-[#F7F5F0] border-t border-[#E8E4DB]">
              <p className="text-sm font-medium text-gray-900">Authentification à 2 facteurs</p>
              <span className="text-xs text-[#EF9F27] font-medium">Bientôt</span>
            </button>
          </div>

          {/* Déconnexion */}
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="w-full flex items-center gap-3 px-5 py-4 bg-white rounded-xl border border-red-100 text-red-500 hover:bg-red-50 transition-colors"
          >
            <LogOut size={16} />
            <span className="font-medium text-sm">Se déconnecter</span>
          </button>
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
