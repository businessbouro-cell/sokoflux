"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { BottomNav } from "@/components/layout/BottomNav";
import { Button } from "@/components/ui/button";
import { formatGNF } from "@/lib/utils/currency";
import { formatDate } from "@/lib/utils/formatters";
import { Wallet, ArrowDownLeft, ArrowUpRight, Lock, TrendingUp } from "lucide-react";

interface Transaction {
  id: string;
  type: string;
  amount: number;
  currency: string;
  status: string;
  description: string | null;
  createdAt: string;
}

interface WalletData {
  id: string;
  balanceGNF: number;
  transactions: Transaction[];
}

const TX_ICONS: Record<string, React.ElementType> = {
  DEPOSIT: ArrowDownLeft,
  WITHDRAWAL: ArrowUpRight,
  ESCROW_LOCK: Lock,
  ESCROW_RELEASE: TrendingUp,
  REFUND: ArrowDownLeft,
  COMMISSION: ArrowUpRight,
};

const TX_COLORS: Record<string, string> = {
  DEPOSIT: "text-green-600 bg-green-50",
  REFUND: "text-green-600 bg-green-50",
  ESCROW_RELEASE: "text-green-600 bg-green-50",
  WITHDRAWAL: "text-red-500 bg-red-50",
  ESCROW_LOCK: "text-purple-600 bg-purple-50",
  COMMISSION: "text-orange-500 bg-orange-50",
};

const TX_LABELS: Record<string, string> = {
  DEPOSIT: "Rechargement", WITHDRAWAL: "Retrait", ESCROW_LOCK: "Paiement bloqué",
  ESCROW_RELEASE: "Paiement libéré", REFUND: "Remboursement", COMMISSION: "Commission",
};

const TX_SIGN: Record<string, string> = {
  DEPOSIT: "+", REFUND: "+", ESCROW_RELEASE: "+",
  WITHDRAWAL: "−", ESCROW_LOCK: "−", COMMISSION: "−",
};

export default function WalletPage() {
  const { status } = useSession();
  const router = useRouter();
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [topupAmount, setTopupAmount] = useState("");
  const [topping, setTopping] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/login"); return; }
    if (status === "authenticated") {
      fetch("/api/wallet")
        .then((r) => r.json())
        .then((data) => { setWallet(data); setLoading(false); })
        .catch(() => setLoading(false));
    }
  }, [status, router]);

  async function handleTopup() {
    const amount = parseInt(topupAmount.replace(/\s/g, ""), 10);
    if (!amount || amount < 10000) return;
    setTopping(true);
    const res = await fetch("/api/wallet", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount, type: "DEPOSIT", description: "Rechargement manuel" }),
    });
    if (res.ok) {
      const data = await res.json();
      setWallet((prev) => prev ? { ...prev, balanceGNF: data.wallet.balanceGNF, transactions: [data.transaction, ...prev.transactions] } : prev);
      setTopupAmount("");
    }
    setTopping(false);
  }

  if (loading) return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Chargement...</div>
      </div>
      <BottomNav />
    </div>
  );

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 pb-20 md:pb-0">
        <div className="mx-auto max-w-lg px-4 py-6">
          <div className="flex items-center gap-2 mb-6">
            <Wallet size={20} className="text-[#1D9E75]" />
            <h1 className="text-xl font-bold text-gray-900">Mon portefeuille</h1>
          </div>

          {/* Solde */}
          <div className="bg-gradient-to-br from-[#1D9E75] to-[#085041] rounded-2xl p-6 text-white mb-4">
            <p className="text-sm text-white/70 mb-1">Solde disponible</p>
            <p className="text-4xl font-bold">{formatGNF(wallet?.balanceGNF ?? 0)}</p>
            <p className="text-xs text-white/50 mt-2">Guinean Franc · SokoFlux Wallet</p>
          </div>

          {/* Recharge */}
          <div className="bg-white rounded-2xl border border-[#E8E4DB] p-5 mb-4">
            <h2 className="font-semibold text-gray-900 text-sm mb-3">Recharger le portefeuille</h2>
            <div className="flex gap-2 mb-3">
              {[50000, 100000, 500000].map((amount) => (
                <button
                  key={amount}
                  onClick={() => setTopupAmount(String(amount))}
                  className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-colors ${
                    topupAmount === String(amount)
                      ? "bg-[#1D9E75] text-white border-[#1D9E75]"
                      : "bg-[#F7F5F0] text-gray-700 border-[#E8E4DB] hover:border-[#1D9E75]"
                  }`}
                >
                  {formatGNF(amount)}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="number"
                value={topupAmount}
                onChange={(e) => setTopupAmount(e.target.value)}
                placeholder="Montant en GNF..."
                className="flex-1 text-sm border border-[#E8E4DB] rounded-xl px-3 py-2 focus:outline-none focus:border-[#1D9E75]"
              />
              <Button size="sm" onClick={handleTopup} disabled={topping || !topupAmount || parseInt(topupAmount) < 10000}>
                {topping ? "..." : "Recharger"}
              </Button>
            </div>
            <p className="text-xs text-gray-400 mt-2">Minimum : {formatGNF(10000)}</p>
          </div>

          {/* Historique */}
          <div className="bg-white rounded-2xl border border-[#E8E4DB] overflow-hidden">
            <div className="px-5 py-4 border-b border-[#E8E4DB]">
              <h2 className="font-semibold text-gray-900 text-sm">Historique des transactions</h2>
            </div>
            {!wallet?.transactions?.length ? (
              <div className="px-5 py-8 text-center text-gray-400 text-sm">Aucune transaction</div>
            ) : (
              <div className="divide-y divide-[#F7F5F0]">
                {wallet.transactions.map((tx) => {
                  const Icon = TX_ICONS[tx.type] ?? ArrowDownLeft;
                  const colorClass = TX_COLORS[tx.type] ?? "text-gray-500 bg-gray-50";
                  const sign = TX_SIGN[tx.type] ?? "+";
                  const isPositive = sign === "+";
                  return (
                    <div key={tx.id} className="flex items-center gap-3 px-5 py-3.5">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                        <Icon size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{tx.description ?? TX_LABELS[tx.type] ?? tx.type}</p>
                        <p className="text-xs text-gray-400">{formatDate(tx.createdAt)}</p>
                      </div>
                      <p className={`text-sm font-bold flex-shrink-0 ${isPositive ? "text-green-600" : "text-gray-700"}`}>
                        {sign}{formatGNF(tx.amount)}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <p className="text-xs text-gray-400 text-center mt-4">
            <Link href="/orders" className="text-[#1D9E75]">Voir mes commandes</Link> · <Link href="/settings" className="text-[#1D9E75]">Paramètres</Link>
          </p>
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
