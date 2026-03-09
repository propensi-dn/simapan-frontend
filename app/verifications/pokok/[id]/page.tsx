"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/axios";

type SavingDetail = {
  id: number;
  saving_id: string;
  transaction_id: string;
  saving_type: string;
  amount: string;
  status: "PENDING" | "SUCCESS" | "REJECTED";
  proof_image: string;
  rejection_reason: string;
  created_at: string;
  verified_at: string | null;
  member_name: string;
  member_id: string | null;
  member_status: string;
  bank_account_info: {
    bank_name: string;
    account_number: string;
    account_holder: string;
  } | null;
};

const formatRupiah = (v: string | number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(Number(v));

type ModalState = { type: "approve" | "reject" | null };

export default function PokokDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [saving, setSaving] = useState<SavingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modal, setModal] = useState<ModalState>({ type: null });
  const [rejectionReason, setRejectionReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [submitError, setSubmitError] = useState("");

  // Checklist state
  const [checks, setChecks] = useState({ photoMatch: false, nikValid: false, addressOk: false });

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get<SavingDetail>(`/verifications/pokok/${id}/`);
        setSaving(res.data);
      } catch {
        setError("Gagal mengambil data transaksi.");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  const onConfirm = async () => {
    if (!modal.type) return;
    if (modal.type === "reject" && !rejectionReason.trim()) {
      setSubmitError("Rejection reason wajib diisi.");
      return;
    }

    setSubmitting(true);
    setSubmitError("");

    try {
      const payload: Record<string, string> = { action: modal.type };
      if (modal.type === "reject") payload.rejection_reason = rejectionReason;

      const res = await api.post(`/verifications/pokok/${id}/confirm/`, payload);
      setSuccessMsg(res.data.message);
      setModal({ type: null });

      // Refresh saving data
      const updated = await api.get<SavingDetail>(`/verifications/pokok/${id}/`);
      setSaving(updated.data);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setSubmitError(msg ?? "Gagal memproses verifikasi.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="py-20 text-center text-sm text-zinc-400">Loading...</div>;
  if (error) return <div className="py-20 text-center text-sm text-red-500">{error}</div>;
  if (!saving) return null;

  const isPending = saving.status === "PENDING";

  return (
    <div>
      {/* Breadcrumb */}
      <div className="mb-6 flex items-center gap-2 text-sm text-zinc-500">
        <Link href="/verifications/pokok" className="hover:text-zinc-800">Verification Queue</Link>
        <span>›</span>
        <span className="font-medium text-zinc-800">{saving.member_name}</span>
      </div>

      {/* Success banner */}
      {successMsg && (
        <div className="mb-6 rounded-xl border border-green-200 bg-green-50 px-5 py-4 text-sm font-medium text-green-700">
          ✓ {successMsg}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        {/* Left: proof image + member biodata */}
        <div className="space-y-6">
          {/* Proof image */}
          <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Bank Transfer Proof</p>
              {saving.proof_image && (
                <div className="flex gap-2">
                  <a
                    href={saving.proof_image}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded border border-zinc-200 px-2 py-1 text-xs text-zinc-500 hover:bg-zinc-50"
                  >
                    ↗ Open
                  </a>
                  <a
                    href={saving.proof_image}
                    download
                    className="rounded border border-zinc-200 px-2 py-1 text-xs text-zinc-500 hover:bg-zinc-50"
                  >
                    ↓ Download
                  </a>
                </div>
              )}
            </div>
            <div className="flex min-h-[280px] items-center justify-center bg-zinc-50 p-4">
              {saving.proof_image ? (
                <img
                  src={saving.proof_image}
                  alt="Transfer proof"
                  className="max-h-[400px] rounded-lg object-contain shadow-md"
                />
              ) : (
                <p className="text-sm text-zinc-400">No proof image uploaded.</p>
              )}
            </div>
          </div>

          {/* Member Biodata */}
          <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
            <div className="border-b border-zinc-100 px-5 py-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Member Biodata</p>
            </div>
            <div className="grid gap-x-6 gap-y-4 p-5 sm:grid-cols-2">
              <div>
                <p className="text-xs text-zinc-400">Full Name</p>
                <p className="mt-0.5 font-semibold text-zinc-900">{saving.member_name}</p>
              </div>
              <div>
                <p className="text-xs text-zinc-400">Member ID</p>
                <p className="mt-0.5 font-semibold text-zinc-900">{saving.member_id ?? "—"}</p>
              </div>
              <div>
                <p className="text-xs text-zinc-400">Member Status</p>
                <span className={`mt-0.5 inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${
                  saving.member_status === "ACTIVE" ? "bg-green-100 text-green-700"
                  : saving.member_status === "VERIFIED" ? "bg-blue-100 text-blue-700"
                  : "bg-zinc-100 text-zinc-600"
                }`}>
                  {saving.member_status}
                </span>
              </div>
              <div>
                <p className="text-xs text-zinc-400">Registration Date</p>
                <p className="mt-0.5 font-semibold text-zinc-900">
                  {new Date(saving.created_at).toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" })}
                </p>
              </div>
            </div>
          </div>

          {/* Bank Account Info */}
          {saving.bank_account_info && (
            <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
              <div className="border-b border-zinc-100 px-5 py-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Source Bank Account Information</p>
              </div>
              <div className="grid gap-x-6 gap-y-4 p-5 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-zinc-400">Payment Method</p>
                  <p className="mt-0.5 font-semibold text-zinc-900">{saving.bank_account_info.bank_name}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-400">Account Number</p>
                  <p className="mt-0.5 font-mono font-semibold text-zinc-900">{saving.bank_account_info.account_number}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-400">Account Holder Name</p>
                  <p className="mt-0.5 font-semibold text-zinc-900">{saving.bank_account_info.account_holder}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right: transaction record + controls */}
        <div className="space-y-4">
          {/* Status badge */}
          <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Transaction Status</p>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                saving.status === "SUCCESS" ? "bg-green-100 text-green-700"
                : saving.status === "PENDING" ? "bg-yellow-100 text-yellow-700"
                : "bg-red-100 text-red-700"
              }`}>
                {saving.status === "PENDING" ? "Pending Review" : saving.status}
              </span>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <p className="text-xs text-zinc-400">Deposit Amount</p>
                <p className="text-3xl font-bold text-zinc-900">{formatRupiah(saving.amount)}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-zinc-400">Savings Type</p>
                  <p className="text-sm font-semibold text-zinc-800">Simpanan Pokok</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-400">Transaction ID</p>
                  <p className="font-mono text-xs font-semibold text-zinc-800">{saving.transaction_id}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-400">Saving ID</p>
                  <p className="font-mono text-xs font-semibold text-zinc-800">{saving.saving_id}</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-400">Submitted At</p>
                  <p className="text-xs font-semibold text-zinc-800">
                    {new Date(saving.created_at).toLocaleDateString("id-ID")}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Manual Checklist */}
          {isPending && (
            <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-400">Manual Checklist</p>
              <div className="space-y-2">
                {[
                  { key: "photoMatch", label: "Photo matches ID card" },
                  { key: "nikValid", label: "NIK is readable and valid" },
                  { key: "addressOk", label: "Address accuracy" },
                ].map((item) => (
                  <label key={item.key} className="flex cursor-pointer items-center gap-3">
                    <input
                      type="checkbox"
                      checked={checks[item.key as keyof typeof checks]}
                      onChange={(e) => setChecks((prev) => ({ ...prev, [item.key]: e.target.checked }))}
                      className="h-4 w-4 rounded border-zinc-300"
                    />
                    <span className="text-sm text-zinc-700">{item.label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Rejection reason (if rejected) */}
          {saving.status === "REJECTED" && saving.rejection_reason && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4">
              <p className="text-xs font-semibold uppercase text-red-500">Rejection Reason</p>
              <p className="mt-1 text-sm text-red-700">{saving.rejection_reason}</p>
            </div>
          )}

          {/* Action buttons */}
          {isPending && (
            <div className="space-y-2">
              {submitError && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">{submitError}</p>
              )}
              <button
                onClick={() => { setModal({ type: "approve" }); setSubmitError(""); }}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 px-4 py-3 text-sm font-semibold text-white hover:bg-zinc-700"
              >
                ✓ Approve Registration
              </button>
              <button
                onClick={() => { setModal({ type: "reject" }); setSubmitError(""); }}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-100"
              >
                ✕ Reject Member
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      {modal.type && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-zinc-900">
              {modal.type === "approve" ? "Approve Registration?" : "Reject Member?"}
            </h3>
            <p className="mt-1 text-sm text-zinc-500">
              {modal.type === "approve"
                ? `Member ${saving.member_name} akan diaktifkan dan mendapatkan Member ID.`
                : `Member ${saving.member_name} akan ditolak. Masukkan alasan penolakan.`}
            </p>

            {modal.type === "reject" && (
              <div className="mt-4">
                <label className="mb-1 block text-xs font-semibold text-zinc-600">
                  Rejection Reason <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={3}
                  placeholder="Provide feedback why the member is rejected..."
                  className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-300"
                />
              </div>
            )}

            {submitError && (
              <p className="mt-2 text-xs text-red-500">{submitError}</p>
            )}

            <div className="mt-5 flex gap-3">
              <button
                onClick={() => { setModal({ type: null }); setRejectionReason(""); setSubmitError(""); }}
                disabled={submitting}
                className="flex-1 rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-medium text-zinc-600 hover:bg-zinc-50"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                disabled={submitting}
                className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50 ${
                  modal.type === "approve" ? "bg-zinc-900 hover:bg-zinc-700" : "bg-red-500 hover:bg-red-600"
                }`}
              >
                {submitting ? "Processing..." : modal.type === "approve" ? "Approve" : "Reject"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}