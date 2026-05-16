"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import api from "@/lib/axios";
import { isAuthenticated } from "@/lib/auth";
import {
  createWithdrawal,
  getWithdrawalBalance,
} from "@/lib/savings-api";
import Modal from "@/components/ui/Modal";

type MemberStatus = "VERIFIED" | "ACTIVE" | "PENDING" | "REJECTED";

type BankAccount = {
  id: number;
  bank_name: string;
  account_number: string;
  account_holder: string;
  is_primary: boolean;
};

type MemberProfile = {
  member_status: MemberStatus;
  bank_accounts: BankAccount[];
};

const MIN_WITHDRAWAL = 50000;

const fmtRp = (value: string | number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(Number(value));

export default function WithdrawPage() {
  const router = useRouter();

  const [memberStatus, setMemberStatus] = useState<MemberStatus | null>(null);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [selectedBankAccountId, setSelectedBankAccountId] = useState<number | null>(null);
  const [totalSukarela, setTotalSukarela] = useState<string>("0");

  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");

  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [withdrawalId, setWithdrawalId] = useState("");

  useEffect(() => {
    if (!isAuthenticated()) {
      window.location.href = "/login";
      return;
    }

    const fetchData = async () => {
      try {
        const [profileRes, balanceRes] = await Promise.all([
          api.get<MemberProfile>("/members/profile/"),
          getWithdrawalBalance(),
        ]);

        setMemberStatus(profileRes.data.member_status);
        setBankAccounts(profileRes.data.bank_accounts || []);
        setTotalSukarela(balanceRes.total_sukarela);

        const accounts = profileRes.data.bank_accounts || [];
        const primary = accounts.find((account) => account.is_primary) ?? accounts[0] ?? null;
        setSelectedBankAccountId(primary ? primary.id : null);
      } catch {
        setError("Gagal mengambil data simpanan.");
      }
    };

    fetchData();
  }, []);

  const maxAmount = parseFloat(totalSukarela) || 0;
  const parsedAmount = parseFloat(amount.replace(/\D/g, "")) || 0;
  const isOverLimit = parsedAmount > maxAmount;
  const selectedBankAccount = useMemo(
    () => bankAccounts.find((account) => account.id === selectedBankAccountId) ?? null,
    [bankAccounts, selectedBankAccountId],
  );

  const handleAmountChange = (raw: string) => {
    const digits = raw.replace(/\D/g, "");
    setAmount(digits);
    if (fieldErrors.amount) setFieldErrors((prev) => ({ ...prev, amount: "" }));
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (!amount || parsedAmount <= 0) errs.amount = "Nominal penarikan wajib diisi.";
    else if (parsedAmount < MIN_WITHDRAWAL) errs.amount = `Minimum penarikan adalah ${fmtRp(MIN_WITHDRAWAL)}.`;
    else if (isOverLimit) errs.amount = `Nominal melebihi saldo. Maks: ${fmtRp(maxAmount)}`;

    if (!selectedBankAccount) errs.bank_account = "Pilih rekening tujuan.";

    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      if (!selectedBankAccount) {
        setError("Pilih rekening tujuan terlebih dahulu.");
        return;
      }

      const res = await createWithdrawal({
        amount: parsedAmount,
        bank_name: selectedBankAccount.bank_name,
        account_number: selectedBankAccount.account_number,
        account_holder: selectedBankAccount.account_holder,
        notes,
      });

      setWithdrawalId(res.data.withdrawal_id);
      setIsSuccessModalOpen(true);
    } catch (err: unknown) {
      const anyErr = err as { response?: { data?: { detail?: string; non_field_errors?: string[] } } };
      const detail =
        anyErr?.response?.data?.detail ||
        anyErr?.response?.data?.non_field_errors?.[0] ||
        "Terjadi kesalahan. Silakan coba lagi.";
      setError(detail);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => router.push("/savings");

  const handleSuccessClose = () => {
    setIsSuccessModalOpen(false);
    router.push("/savings");
  };

  if (memberStatus && memberStatus !== "ACTIVE") {
    return (
      <div className="max-w-lg mx-auto mt-12 text-center space-y-3">
        <p className="text-base font-medium" style={{ color: "#242F43", fontFamily: "Montserrat, sans-serif" }}>
          Penarikan simpanan sukarela hanya tersedia untuk anggota aktif.
        </p>
        <button onClick={() => router.push("/savings")} className="text-sm underline" style={{ color: "#11447D" }}>
          Kembali ke Simpanan
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <h2 className="font-bold text-2xl mb-1" style={{ fontFamily: "Montserrat, sans-serif", color: "#242F43" }}>
          Tarik Simpanan Sukarela
        </h2>
        <p className="text-sm" style={{ color: "#8E99A8", fontFamily: "Inter, sans-serif" }}>
          Ajukan permintaan penarikan dana simpanan sukarela kamu.
        </p>
      </div>

      <div className="rounded-xl px-5 py-4" style={{ backgroundColor: "#EEF4FF", border: "1px solid #C7D9F8" }}>
        <p className="text-xs font-medium mb-1" style={{ color: "#4B6EA8", fontFamily: "Inter, sans-serif" }}>
          Saldo Simpanan Sukarela Tersedia
        </p>
        <p className="text-2xl font-bold" style={{ color: "#11447D", fontFamily: "Montserrat, sans-serif" }}>
          {fmtRp(totalSukarela)}
        </p>
      </div>

      {error && (
        <div className="rounded-lg px-4 py-3 text-sm" style={{ backgroundColor: "#FEE2E2", color: "#991B1B", fontFamily: "Inter, sans-serif" }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: "#374151", fontFamily: "Inter, sans-serif" }}>
            Nominal Penarikan <span style={{ color: "#EF4444" }}>*</span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium select-none" style={{ color: "#6B7280" }}>
              Rp
            </span>
            <input
              type="text"
              inputMode="numeric"
              value={amount ? new Intl.NumberFormat("id-ID").format(parseInt(amount)) : ""}
              onChange={(e) => handleAmountChange(e.target.value.replace(/\./g, ""))}
              placeholder="0"
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border text-sm outline-none focus:ring-2"
              style={{
                border: fieldErrors.amount ? "1px solid #EF4444" : "1px solid #D1D5DB",
                fontFamily: "Inter, sans-serif",
                color: "#111827",
              }}
            />
          </div>
          {fieldErrors.amount && <p className="text-xs mt-1" style={{ color: "#EF4444" }}>{fieldErrors.amount}</p>}
          {!fieldErrors.amount && parsedAmount > 0 && !isOverLimit && (
            <p className="text-xs mt-1" style={{ color: "#6B7280" }}>
              Sisa setelah penarikan: {fmtRp(maxAmount - parsedAmount)}
            </p>
          )}
          {!fieldErrors.amount && (
            <p className="text-xs mt-1" style={{ color: "#6B7280" }}>
              Minimum penarikan: {fmtRp(MIN_WITHDRAWAL)}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: "#374151", fontFamily: "Inter, sans-serif" }}>
            Rekening Tujuan <span style={{ color: "#EF4444" }}>*</span>
          </label>
          <select
            value={selectedBankAccountId ?? ""}
            onChange={(e) => {
              const nextValue = e.target.value ? Number(e.target.value) : null;
              setSelectedBankAccountId(nextValue);
              if (fieldErrors.bank_account) setFieldErrors((prev) => ({ ...prev, bank_account: "" }));
            }}
            className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none focus:ring-2 bg-white"
            style={{
              border: fieldErrors.bank_account ? "1px solid #EF4444" : "1px solid #D1D5DB",
              fontFamily: "Inter, sans-serif",
              color: selectedBankAccountId ? "#111827" : "#9CA3AF",
            }}
            disabled={bankAccounts.length === 0}
          >
            <option value="" disabled>
              {bankAccounts.length === 0 ? "Belum ada rekening tersimpan" : "Pilih rekening"}
            </option>
            {bankAccounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.bank_name} • {account.account_number} • {account.account_holder}
                {account.is_primary ? " (Utama)" : ""}
              </option>
            ))}
          </select>
          {fieldErrors.bank_account && <p className="text-xs mt-1" style={{ color: "#EF4444" }}>{fieldErrors.bank_account}</p>}
          {selectedBankAccount && (
            <div className="mt-3 rounded-lg border px-4 py-3 text-sm" style={{ borderColor: "#D1D5DB", backgroundColor: "#F9FAFB", fontFamily: "Inter, sans-serif" }}>
              <p className="font-medium" style={{ color: "#242F43" }}>
                {selectedBankAccount.bank_name}
              </p>
              <p style={{ color: "#6B7280" }}>
                {selectedBankAccount.account_number} • {selectedBankAccount.account_holder}
              </p>
            </div>
          )}
          {bankAccounts.length === 0 && (
            <p className="text-xs mt-1" style={{ color: "#EF4444" }}>
              Tambahkan rekening di halaman profil sebelum mengajukan penarikan.
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: "#374151", fontFamily: "Inter, sans-serif" }}>
            Catatan / Alasan Penarikan <span className="font-normal" style={{ color: "#9CA3AF" }}>(opsional)</span>
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Tuliskan alasan atau catatan tambahan..."
            rows={3}
            className="w-full px-3 py-2.5 rounded-lg border text-sm outline-none focus:ring-2 resize-none"
            style={{
              border: "1px solid #D1D5DB",
              fontFamily: "Inter, sans-serif",
              color: "#111827",
            }}
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={handleCancel}
            disabled={isSubmitting}
            className="flex-1 py-2.5 rounded-lg border text-sm font-medium transition-colors"
            style={{
              border: "1px solid #D1D5DB",
              color: "#374151",
              fontFamily: "Inter, sans-serif",
              backgroundColor: "white",
            }}
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={isSubmitting || isOverLimit || bankAccounts.length === 0}
            className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white transition-opacity disabled:opacity-60"
            style={{
              backgroundColor: "#11447D",
              fontFamily: "Inter, sans-serif",
            }}
          >
            {isSubmitting ? "Mengajukan..." : "Ajukan Penarikan"}
          </button>
        </div>
      </form>

      <Modal
        isOpen={isSuccessModalOpen}
        onClose={handleSuccessClose}
        title="Permintaan Berhasil Diajukan"
        description={`Permintaan penarikan simpanan sukarela kamu (${withdrawalId}) sedang diproses. Petugas akan menindaklanjuti dalam waktu dekat.`}
        confirmLabel="Kembali ke Simpanan"
        onConfirm={handleSuccessClose}
        cancelLabel=""
        size="md"
      />
    </div>
  );
}
