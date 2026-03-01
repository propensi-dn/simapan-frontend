"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import api from "@/lib/axios";
import { clearAuth, isAuthenticated } from "@/lib/auth";

type SavingItem = {
  id: number;
  saving_id: string;
  transaction_id: string;
  saving_type: "POKOK" | "WAJIB" | "SUKARELA";
  amount: string;
  status: "PENDING" | "SUCCESS" | "REJECTED";
  submitted_at: string;
};

type OverviewResponse = {
  member_status: "VERIFIED" | "ACTIVE" | "PENDING" | "REJECTED";
  totals: { wajib: string; sukarela: string };
  count: number;
  next: string | null;
  previous: string | null;
  results: SavingItem[];
};

const formatRupiah = (value: string | number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(value));

export default function SavingsOverviewPage() {
  const [data, setData] = useState<OverviewResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!isAuthenticated()) {
        window.location.href = "/login";
        return;
      }

      try {
        const response = await api.get<OverviewResponse>("/savings/overview/");
        setData(response.data);
      } catch {
        setError("Gagal mengambil data simpanan.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const summaryText = useMemo(() => {
    if (!data) return "";
    if (data.member_status === "VERIFIED") {
      return "Status kamu VERIFIED. Silakan upload simpanan pokok dulu.";
    }
    return "Kelola dan lacak simpanan wajib dan sukarela kamu.";
  }, [data]);

  const onLogout = () => {
    clearAuth();
    window.location.href = "/login";
  };

  const statusLabel = (status: SavingItem["status"]) => {
    if (status === "SUCCESS") return "Success";
    if (status === "PENDING") return "Pending";
    return "Rejected";
  };

  if (loading) {
    return <p className="text-sm text-zinc-500">Loading data simpanan...</p>;
  }

  if (error) {
    return <p className="text-sm text-red-600">{error}</p>;
  }

  if (!data) {
    return null;
  }

  return (
    <div className="mx-auto max-w-[1100px]">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-[44px] font-bold leading-tight text-zinc-900">Savings Overview</h1>
          <p className="mt-1 text-zinc-500">{summaryText}</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onLogout}
            className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700"
          >
            Logout
          </button>
          <Link
            href="/savings/deposit"
            className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white"
          >
            <span>⊕</span>
            <span>Tambah Setoran</span>
          </Link>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Total Simpanan Wajib</p>
          <p className="mt-2 text-4xl font-bold text-zinc-900">{formatRupiah(data.totals.wajib)}</p>
          <p className="mt-2 text-xs text-zinc-400">*Wajib dibayarkan setiap awal bulan</p>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Total Simpanan Sukarela</p>
          <p className="mt-2 text-4xl font-bold text-zinc-900">{formatRupiah(data.totals.sukarela)}</p>
          <p className="mt-2 text-xs text-zinc-400">*Dapat disetorkan kapan saja secara fleksibel</p>
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4">
          <h2 className="text-[32px] font-semibold leading-tight text-zinc-900">Recent Savings History</h2>
          <div className="flex items-center gap-2 text-zinc-400">
            <button className="grid h-8 w-8 place-items-center rounded-md border border-zinc-200">☰</button>
            <button className="grid h-8 w-8 place-items-center rounded-md border border-zinc-200">⇩</button>
          </div>
        </div>

        {data.results.length === 0 ? (
          <p className="px-5 py-8 text-sm text-zinc-500">Belum ada transaksi simpanan.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-zinc-50 text-left text-xs uppercase text-zinc-500">
                <tr>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Type</th>
                  <th className="px-5 py-3">Amount</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.results.map((item) => (
                  <tr key={item.id} className="border-t border-zinc-100">
                    <td className="px-5 py-3 text-zinc-800">
                      {new Date(item.submitted_at).toLocaleDateString("id-ID", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-5 py-3">
                      <span className="rounded bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-700">{item.saving_type === "SUKARELA" ? "Sukarela" : item.saving_type === "WAJIB" ? "Wajib" : "Pokok"}</span>
                    </td>
                    <td className="px-5 py-3 font-semibold text-zinc-800">{formatRupiah(item.amount)}</td>
                    <td className="px-5 py-3">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          item.status === "SUCCESS"
                            ? "bg-green-100 text-green-700"
                            : item.status === "PENDING"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {statusLabel(item.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex items-center justify-between border-t border-zinc-200 px-5 py-3 text-sm text-zinc-500">
          <p>Showing {Math.min(data.results.length, 5)} of {data.count} transactions</p>
          <div className="flex gap-2">
            <button className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-1">Previous</button>
            <button className="rounded-md border border-zinc-200 bg-white px-3 py-1 font-semibold text-zinc-900">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}
