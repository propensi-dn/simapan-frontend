"use client";

import { FormEvent, useEffect, useState } from "react";
import Image from "next/image";
import axios from "axios";

import api from "@/lib/axios";
import { isAuthenticated } from "@/lib/auth";
import Modal from "@/components/ui/Modal";

type MemberStatus = "VERIFIED" | "ACTIVE" | "PENDING" | "REJECTED";
type SavingType = "POKOK" | "WAJIB" | "SUKARELA";

type CooperativeBankAccount = {
  bank_name: string;
  account_number: string;
  account_holder: string;
};

type MemberBankAccount = {
  id: number;
  bank_name: string;
  account_number: string;
  account_holder: string;
  is_primary: boolean;
};

type OverviewResponse = {
  member_status: MemberStatus;
  bank_account: CooperativeBankAccount | null;
};

export default function DepositPage() {
  const [memberStatus, setMemberStatus] = useState<MemberStatus | null>(null);
  const [bankAccount, setBankAccount] = useState<CooperativeBankAccount | null>(null);
  const [savingType, setSavingType] = useState<SavingType>("POKOK");
  const [amount, setAmount] = useState("150000");
  const [memberBankAccounts, setMemberBankAccounts] = useState<MemberBankAccount[]>([]);
  const [selectedBankAccountId, setSelectedBankAccountId] = useState<number | null>(null);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreviewUrl, setProofPreviewUrl] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [copyMessage, setCopyMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

  const canDeposit = memberStatus === "VERIFIED" || memberStatus === "ACTIVE";
  const primaryBankAccount = bankAccount;

  useEffect(() => {
    if (!proofFile || !proofFile.type.startsWith("image/")) {
      setProofPreviewUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(proofFile);
    setProofPreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [proofFile]);

  useEffect(() => {
    const fetchOverview = async () => {
      if (!isAuthenticated()) {
        window.location.href = "/login";
        return;
      }

      try {
        const [overviewResponse, bankAccountsResponse] = await Promise.all([
          api.get<OverviewResponse>("/savings/overview/"),
          api.get<MemberBankAccount[]>("/members/bank-accounts/"),
        ]);

        setMemberStatus(overviewResponse.data.member_status);
        setBankAccount(overviewResponse.data.bank_account ?? null);

        const accounts = bankAccountsResponse.data ?? [];
        setMemberBankAccounts(accounts);
        const primary = accounts.find((a) => a.is_primary) ?? accounts[0] ?? null;
        if (primary) setSelectedBankAccountId(primary.id);
      } catch {
        setError("Gagal mengambil data overview simpanan.");
      }
    };

    fetchOverview();
  }, []);

  useEffect(() => {
    if (memberStatus === "VERIFIED") {
      setSavingType("POKOK");
      setAmount("150000");
      return;
    }

    if (memberStatus === "ACTIVE" && savingType === "POKOK") {
      setSavingType("WAJIB");
      setAmount("100000");
    }
  }, [memberStatus, savingType]);

  useEffect(() => {
    if (savingType === "WAJIB") {
      setAmount("100000");
    }
  }, [savingType]);

  const onCopyDetails = async () => {
    if (!primaryBankAccount) {
      setError("Rekening bank koperasi belum tersedia.");
      setCopyMessage("");
      return;
    }

    const payload = `${primaryBankAccount.bank_name} - ${primaryBankAccount.account_number}`;

    const fallbackCopy = (text: string) => {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.setAttribute("readonly", "");
      textArea.style.position = "fixed";
      textArea.style.left = "-9999px";
      document.body.appendChild(textArea);
      textArea.select();
      textArea.setSelectionRange(0, text.length);
      const copied = document.execCommand("copy");
      document.body.removeChild(textArea);
      return copied;
    };

    let copied = false;

    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(payload);
        copied = true;
      } catch {
        copied = false;
      }
    }

    if (!copied) {
      copied = fallbackCopy(payload);
    }

    if (copied) {
      setError("");
      setMessage("Detail rekening koperasi berhasil disalin.");
      setCopyMessage("Tersalin");
      return;
    }

    window.prompt("Salin manual detail rekening ini:", payload);
    setMessage("");
    setError("Clipboard diblokir browser. Silakan salin dari popup yang muncul.");
    setCopyMessage("Perlu salin manual");
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!canDeposit) {
      setError("Status anggota belum dapat melakukan setoran.");
      return;
    }

    if (!proofFile) {
      setError("Bukti transfer wajib diupload.");
      return;
    }

    if (proofFile.size > 5 * 1024 * 1024) {
      setError("Ukuran file maksimal 5MB.");
      return;
    }

    setIsSubmitting(true);

    const selectedAccount = memberBankAccounts.find((a) => a.id === selectedBankAccountId);
    if (!selectedAccount) {
      setError("Pilih rekening bank anggota terlebih dahulu.");
      return;
    }

    const formData = new FormData();
    formData.append("transfer_proof", proofFile);
    formData.append("member_bank_name", selectedAccount.bank_name);
    formData.append("member_account_number", selectedAccount.account_number);

    try {
      if (memberStatus === "VERIFIED") {
        await api.post("/savings/deposits/pokok/", formData);
      } else {
        formData.append("saving_type", savingType);
        formData.append("amount", amount);
        await api.post("/savings/deposits/", formData);
      }

      setMessage("");
      setIsSuccessModalOpen(true);
      setProofFile(null);
      if (savingType === "SUKARELA") {
        setAmount("");
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const backendMessage =
          (error.response?.data as { detail?: string; message?: string })?.detail ||
          (error.response?.data as { detail?: string; message?: string })?.message;
        setError(backendMessage ?? "Gagal mengirim setoran. Periksa input kamu.");
      } else {
        setError("Gagal mengirim setoran. Periksa input kamu.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="mx-auto max-w-[1100px]">
        <div className="mb-6">
        <h1 className="text-[44px] font-bold leading-tight text-zinc-900">Form Setoran Anggota</h1>
        <p className="mt-1 text-zinc-500">Ikuti panduan berikut untuk mengirim bukti setoran. Tim kami akan memverifikasi transaksi dalam 24 jam.</p>
        {memberStatus && !canDeposit ? (
          <p className="mt-2 text-sm text-amber-700">
            Status kamu saat ini {memberStatus}. Setoran hanya tersedia untuk status VERIFIED atau ACTIVE.
          </p>
        ) : null}
      </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Informasi Rekening Koperasi</p>
        <div className="mt-4 grid gap-6 md:grid-cols-[1fr_1fr_110px]">
          <div>
            <p className="text-xs text-zinc-400">Nama Bank</p>
            <p className="text-[30px] font-bold leading-tight text-zinc-900">{primaryBankAccount?.bank_name ?? "-"}</p>

            <p className="mt-5 text-xs text-zinc-400">Nomor Rekening</p>
            <p className="text-[34px] font-bold leading-tight text-zinc-900">{primaryBankAccount?.account_number ?? "-"}</p>
          </div>

          <div>
            <p className="text-xs text-zinc-400">Nama Pemilik Rekening</p>
            <p className="text-2xl font-bold leading-tight text-zinc-900">{primaryBankAccount?.account_holder ?? "-"}</p>
            <button
              type="button"
              className="relative z-10 mt-6 cursor-pointer rounded-md border border-zinc-200 bg-zinc-50 px-3 py-1 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400"
              onClick={(event) => {
                event.stopPropagation();
                onCopyDetails();
              }}
            >
              ▣ Salin Detail
            </button>
            {copyMessage ? <p className="mt-2 text-xs text-zinc-500">{copyMessage}</p> : null}
          </div>

          <div className="grid h-[110px] place-items-center rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-300">▩</div>
        </div>
        </div>

        <form onSubmit={onSubmit} className="mt-6 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
        <div className="border-b border-zinc-200 bg-zinc-50 px-5 py-3 text-sm font-semibold text-zinc-800">Detail Transaksi</div>

        <div className="space-y-4 px-5 py-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-semibold text-zinc-700">Jenis Simpanan</label>
              <select
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm"
                value={savingType}
                onChange={(event) => setSavingType(event.target.value as SavingType)}
                disabled={memberStatus === "VERIFIED" || !canDeposit}
              >
                {memberStatus === "VERIFIED" ? (
                  <option value="POKOK">Simpanan Pokok</option>
                ) : (
                  <>
                    <option value="WAJIB">Wajib</option>
                    <option value="SUKARELA">Sukarela</option>
                  </>
                )}
              </select>
              <p className="mt-1 text-xs text-zinc-400">Pilih &apos;Wajib&apos; untuk setoran wajib bulanan.</p>
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-zinc-700">Jumlah Setoran</label>
              <input
                type="number"
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                disabled={savingType === "WAJIB" || savingType === "POKOK" || !canDeposit}
                min={1}
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-semibold text-zinc-700">Rekening Bank Anggota</label>
              {memberBankAccounts.length === 0 ? (
                <p className="mt-1 text-sm text-zinc-400">Tidak ada rekening bank tersimpan. Tambahkan di halaman profil.</p>
              ) : (
                <select
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm"
                  value={selectedBankAccountId ?? ""}
                  onChange={(event) => setSelectedBankAccountId(Number(event.target.value))}
                  disabled={!canDeposit}
                  required
                >
                  {memberBankAccounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.bank_name} – {account.account_number} – {account.account_holder}
                      {account.is_primary ? " (Utama)" : ""}
                    </option>
                  ))}
                </select>
              )}
              <p className="mt-1 text-xs text-zinc-400">Rekening utama dipilih otomatis. Ubah di halaman profil.</p>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-zinc-700">Bukti Transfer</label>
            <label className="grid cursor-pointer place-items-center rounded-xl border border-dashed border-zinc-300 px-4 py-10 text-center">
              {proofPreviewUrl ? (
                <Image
                  src={proofPreviewUrl}
                  alt="Preview bukti transfer"
                  width={360}
                  height={176}
                  unoptimized
                  className="mb-3 max-h-44 w-auto rounded-lg border border-zinc-200 object-contain"
                />
              ) : (
                <span className="mb-2 grid h-10 w-10 place-items-center rounded-full bg-zinc-100 text-zinc-500">☁</span>
              )}
              <span className="text-sm font-medium text-zinc-700">
                {proofFile ? "File dipilih. Klik untuk mengganti" : "Klik untuk unggah atau seret file ke sini"}
              </span>
              <span className="text-xs text-zinc-400">
                {proofFile ? proofFile.name : "PNG, JPG, atau PDF (Maks. 5MB)"}
              </span>
              <input
                type="file"
                accept=".png,.jpg,.jpeg,.pdf"
                onChange={(event) => setProofFile(event.target.files?.[0] ?? null)}
                className="hidden"
                disabled={!canDeposit}
                required
              />
            </label>
          </div>

          <div className="rounded-lg border border-yellow-300 bg-yellow-50 px-3 py-2 text-xs text-yellow-700">
            ⓘ Catatan: Pastikan nominal transfer sesuai dengan nilai yang kamu masukkan di formulir. Data yang tidak sesuai dapat menyebabkan keterlambatan proses.
          </div>

          {message ? <p className="text-sm text-green-700">{message}</p> : null}
          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!canDeposit || isSubmitting}
              aria-disabled={!canDeposit || isSubmitting}
              className="rounded-lg bg-zinc-900 px-6 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-zinc-400"
            >
              {isSubmitting ? "Mengirim..." : "Kirim Setoran ▷"}
            </button>
          </div>
        </div>
        </form>
      </div>

      <Modal
        isOpen={isSuccessModalOpen}
        onClose={() => setIsSuccessModalOpen(false)}
        icon={
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z" />
          </svg>
        }
        title="Simpanan berhasil disimpan"
        description="Setoran berhasil dikirim dan menunggu verifikasi petugas."
        cancelLabel="Saya Mengerti"
        size="sm"
      />
    </>
  );
}
