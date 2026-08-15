"use client";

import { Suspense, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { BottomNav } from "@/components/layout/BottomNav";
import { CheckCircle, XCircle, Search } from "lucide-react";

interface User {
  id: string;
  name: string;
  phone: string;
  isVerified: boolean;
  createdAt: string;
  roles: { role: string }[];
}

const ROLE_LABEL: Record<string, string> = {
  ADMIN: "Admin", SUPPLIER: "Fournisseur", IMPORTER: "Importateur",
  LOCAL_MERCHANT: "Commerçant", INDIVIDUAL: "Particulier",
};

function AdminUsersContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState(searchParams.get("role") ?? "");

  useEffect(() => {
    const roles = (session?.user?.roles as string[]) ?? [];
    if (status === "authenticated" && !roles.includes("ADMIN")) router.push("/");
  }, [session, status, router]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (roleFilter) params.set("role", roleFilter);
    if (search) params.set("search", search);
    fetch(`/api/admin/users?${params}`)
      .then((r) => r.json())
      .then((d) => { setUsers(d ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [roleFilter, search]);

  async function toggleVerify(userId: string, current: boolean) {
    await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isVerified: !current }),
    });
    setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, isVerified: !current } : u));
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 pb-20 md:pb-0">
        <div className="mx-auto max-w-5xl px-4 py-6">
          <div className="flex items-center gap-3 mb-6">
            <Link href="/admin" className="text-gray-400 hover:text-gray-600">←</Link>
            <h1 className="text-xl font-bold text-gray-900">Utilisateurs</h1>
          </div>

          <div className="flex gap-3 mb-4 flex-wrap">
            <div className="relative flex-1 min-w-48">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher..."
                className="w-full pl-8 pr-3 py-2 text-sm rounded-xl border border-[#E8E4DB] bg-white focus:outline-none focus:border-[#1D9E75]"
              />
            </div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 text-sm rounded-xl border border-[#E8E4DB] bg-white focus:outline-none focus:border-[#1D9E75]"
            >
              <option value="">Tous les rôles</option>
              {Object.entries(ROLE_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>

          {loading ? (
            <div className="space-y-2">{[1,2,3,4,5].map(i => <div key={i} className="h-16 bg-[#F7F5F0] rounded-xl animate-pulse" />)}</div>
          ) : (
            <div className="bg-white rounded-xl border border-[#E8E4DB] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-[#F7F5F0] border-b border-[#E8E4DB]">
                    <tr>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600">Utilisateur</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600">Rôles</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600">Statut</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-gray-600">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8E4DB]">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-[#F7F5F0]">
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-900">{user.name}</p>
                          <p className="text-xs text-gray-500">{user.phone}</p>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {user.roles.map((r) => (
                              <span key={r.role} className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">
                                {ROLE_LABEL[r.role] ?? r.role}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`flex items-center gap-1 text-xs font-medium ${user.isVerified ? "text-green-600" : "text-yellow-600"}`}>
                            {user.isVerified ? <CheckCircle size={12} /> : <XCircle size={12} />}
                            {user.isVerified ? "Vérifié" : "En attente"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => toggleVerify(user.id, user.isVerified)}
                            className={`text-xs px-3 py-1 rounded-lg font-medium transition-colors ${user.isVerified ? "bg-red-50 text-red-600 hover:bg-red-100" : "bg-[#1D9E75]/10 text-[#1D9E75] hover:bg-[#1D9E75]/20"}`}
                          >
                            {user.isVerified ? "Suspendre" : "Valider"}
                          </button>
                        </td>
                      </tr>
                    ))}
                    {users.length === 0 && (
                      <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400 text-sm">Aucun utilisateur trouvé</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}

export default function AdminUsersPage() {
  return <Suspense><AdminUsersContent /></Suspense>;
}
