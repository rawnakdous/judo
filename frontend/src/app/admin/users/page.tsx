"use client";

import { useEffect, useMemo, useState } from "react";
import { Download } from "lucide-react";
import type { User } from "@/types/domain";
import { AdminLayout } from "@/components/AdminLayout";
import { LoadingState } from "@/components/LoadingState";
import { ErrorState } from "@/components/ErrorState";
import { adminService } from "@/services/api/services";
import { formatDateTime } from "@/utils/dates";
import { roleLabels } from "@/utils/labels";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => { adminService.users().then(setUsers).catch((err) => setError(err.message)).finally(() => setLoading(false)); }, []);

  const filtered = useMemo(() => users.filter((user) => `${user.firstName} ${user.lastName} ${user.email}`.toLowerCase().includes(query.toLowerCase())), [users, query]);

  function downloadCsv() {
    const rows = [["Nom", "E-mail", "Date d'inscription", "Rôle"], ...filtered.map((u) => [`${u.firstName} ${u.lastName}`, u.email, formatDateTime(u.createdAt), roleLabels[u.role]])];
    const csv = rows.map((r) => r.map((v) => `"${String(v).replaceAll('"', '""')}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = "utilisateurs.csv";
    a.click();
  }

  return (
    <AdminLayout>
      <h1 className="text-3xl font-black text-navy">Utilisateurs</h1>
      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher..." className="min-w-0 flex-1 rounded-md border border-slate-200 px-3 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-redbrand" />
        <button onClick={downloadCsv} className="inline-flex items-center justify-center gap-2 rounded-md bg-redbrand px-4 py-3 text-sm font-black text-white shadow focus-ring"><Download size={17} /> Télécharger</button>
      </div>
      <div className="mt-5">
        {loading ? <LoadingState /> : error ? <ErrorState message={error} /> : (
          <div className="overflow-x-auto rounded-lg bg-white shadow-soft">
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="p-4">Nom</th><th>E-mail</th><th>Date d&apos;inscription</th><th>Rôle</th></tr></thead>
              <tbody>{filtered.map((user) => <tr key={user.id} className="border-t border-slate-100"><td className="p-4 font-black text-navy">{user.firstName} {user.lastName}</td><td className="font-semibold text-slate-600">{user.email}</td><td className="font-semibold text-slate-600">{formatDateTime(user.createdAt)}</td><td className="font-black text-redbrand">{roleLabels[user.role]}</td></tr>)}</tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
