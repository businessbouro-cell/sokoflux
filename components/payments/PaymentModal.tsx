"use client";

import { useState } from "react";
import { formatGNF, formatUSD } from "@/lib/utils/currency";
import { Loader2, X, Phone, CreditCard, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface PaymentModalProps {
  orderId: string;
  totalAmount: number;
  currency: string;
  onClose: () => void;
  onSuccess: () => void;
}

type Method = "ORANGE_MONEY" | "MTN_MOMO" | "STRIPE";
type Step = "select" | "phone" | "processing" | "success";

export function PaymentModal({ orderId, totalAmount, currency, onClose, onSuccess }: PaymentModalProps) {
  const [method, setMethod] = useState<Method | null>(null);
  const [step, setStep] = useState<Step>("select");
  const [phone, setPhone] = useState("+224 ");
  const [error, setError] = useState("");

  const displayAmount = currency === "GNF" ? formatGNF(totalAmount) : formatUSD(totalAmount);

  const METHODS = [
    { id: "ORANGE_MONEY" as Method, label: "Orange Money", color: "bg-orange-500", icon: "🟠", desc: "Paiement mobile Guinea" },
    { id: "MTN_MOMO" as Method, label: "MTN MoMo", color: "bg-yellow-400", icon: "🟡", desc: "Mobile Money MTN" },
    { id: "STRIPE" as Method, label: "Carte bancaire", color: "bg-blue-600", icon: "💳", desc: "Visa, Mastercard (USD)" },
  ];

  async function handleMobilePay() {
    if (!phone.replace(/\D/g, "").match(/^224\d{9}$/)) {
      setError("Numéro invalide (ex: +224 621 00 00 00)");
      return;
    }
    setError("");
    setStep("processing");

    const endpoint = method === "ORANGE_MONEY" ? "/api/payments/orange-money" : "/api/payments/mtn-momo";
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, phone: phone.replace(/\D/g, "") }),
      });
      const data = await res.json();
      if (res.ok && (data.status === "success" || data.txnId || data.referenceId)) {
        setStep("success");
        setTimeout(() => { onSuccess(); onClose(); }, 2000);
      } else {
        setError(data.error ?? "Paiement échoué");
        setStep("phone");
      }
    } catch {
      setError("Erreur réseau");
      setStep("phone");
    }
  }

  async function handleStripe() {
    setStep("processing");
    try {
      const res = await fetch("/api/payments/stripe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError("Erreur Stripe");
        setStep("select");
      }
    } catch {
      setError("Erreur réseau");
      setStep("select");
    }
  }

  function selectMethod(m: Method) {
    setMethod(m);
    if (m === "STRIPE") {
      handleStripe();
    } else {
      setStep("phone");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-t-2xl sm:rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-gray-900">Paiement</h2>
          <button onClick={onClose} className="p-1 hover:bg-[#F7F5F0] rounded-lg"><X size={18} /></button>
        </div>

        <div className="mb-4 bg-[#F7F5F0] rounded-xl px-4 py-3 text-center">
          <p className="text-xs text-gray-500 mb-0.5">Montant à payer</p>
          <p className="text-2xl font-bold text-gray-900">{displayAmount}</p>
          <p className="text-xs text-[#1D9E75] font-medium mt-0.5">Paiement sécurisé • Escrow SokoFlux</p>
        </div>

        {step === "select" && (
          <div className="space-y-3">
            {error && <p className="text-xs text-red-500">{error}</p>}
            <p className="text-sm text-gray-600 mb-2">Choisissez votre méthode de paiement</p>
            {METHODS.map((m) => (
              <button
                key={m.id}
                onClick={() => selectMethod(m.id)}
                className="w-full flex items-center gap-4 p-4 rounded-xl border border-[#E8E4DB] hover:border-[#1D9E75] hover:bg-[#F7F5F0] transition-all text-left"
              >
                <span className="text-2xl">{m.icon}</span>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{m.label}</p>
                  <p className="text-xs text-gray-500">{m.desc}</p>
                </div>
              </button>
            ))}
          </div>
        )}

        {step === "phone" && (
          <div className="space-y-4">
            <button onClick={() => setStep("select")} className="text-sm text-gray-400 hover:text-gray-600">← Retour</button>
            <div>
              <Label>{method === "ORANGE_MONEY" ? "Numéro Orange Money" : "Numéro MTN MoMo"}</Label>
              <div className="relative mt-1">
                <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+224 621 00 00 00"
                  className="pl-8"
                />
              </div>
              {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
              <p className="text-xs text-gray-400 mt-1">Un SMS de confirmation vous sera envoyé</p>
            </div>
            <Button onClick={handleMobilePay} className="w-full">
              Confirmer le paiement — {displayAmount}
            </Button>
          </div>
        )}

        {step === "processing" && (
          <div className="flex flex-col items-center py-8 gap-4">
            <Loader2 size={40} className="animate-spin text-[#1D9E75]" />
            <p className="text-gray-600 font-medium">Traitement en cours...</p>
            <p className="text-sm text-gray-400 text-center">Veuillez confirmer sur votre téléphone mobile</p>
          </div>
        )}

        {step === "success" && (
          <div className="flex flex-col items-center py-8 gap-4">
            <CheckCircle size={48} className="text-[#1D9E75]" />
            <p className="text-gray-900 font-bold text-lg">Paiement réussi !</p>
            <p className="text-sm text-gray-500 text-center">Votre commande est confirmée. Vous recevrez un SMS de confirmation.</p>
          </div>
        )}
      </div>
    </div>
  );
}
