"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import axios from "axios";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

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
  mandatory_savings?: {
    next_due_date?: string | null;
    overdue_count: number;
    overdue_amount: string;
    due_soon_count: number;
    available_sukarela: string;
    auto_debit_required: boolean;
    auto_debit_pending: boolean;
    results?: Array<{
      period_start: string;
      status: "UNPAID" | "PENDING" | "PAID" | "OVERDUE";
    }>;
  };
};

export default function DepositPage() {
  const router = useRouter();
  const [memberStatus, setMemberStatus] = useState<MemberStatus | null>(null);
  const [bankAccount, setBankAccount] = useState<CooperativeBankAccount | null>(null);
  const [mandatorySavings, setMandatorySavings] = useState<OverviewResponse["mandatory_savings"] | null>(null);
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
  const [isMandatoryNoticeOpen, setIsMandatoryNoticeOpen] = useState(false);

  const canDeposit = memberStatus === "VERIFIED" || memberStatus === "ACTIVE";
  const primaryBankAccount = bankAccount;
  const mandatoryLock = mandatorySavings?.auto_debit_required ?? false;
  const mandatorySoon = (mandatorySavings?.due_soon_count ?? 0) > 0 && !mandatoryLock;

  const mandatoryCoverage = useMemo(() => {
    const obligations = mandatorySavings?.results ?? [];
    if (obligations.length === 0) return null;

    const toDate = (value: string) => new Date(`${value}T00:00:00`);
    const fmtMonthYear = (value: string | null) => {
      if (!value) return null;
      return new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric" }).format(toDate(value));
    };

    const paidItems = obligations
      .filter((item) => item.status === "PAID")
      .sort((a, b) => toDate(b.period_start).getTime() - toDate(a.period_start).getTime());
    const nextActive = obligations
      .filter((item) => item.status !== "PAID")
      .sort((a, b) => toDate(a.period_start).getTime() - toDate(b.period_start).getTime())[0];

    const paidUntil = paidItems[0]?.period_start ?? null;
    const nextPeriod = nextActive?.period_start ?? null;

    return {
      paidUntilLabel: fmtMonthYear(paidUntil),
      nextPeriodLabel: fmtMonthYear(nextPeriod),
    };
  }, [mandatorySavings]);

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
        setMandatorySavings(overviewResponse.data.mandatory_savings ?? null);

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

  useEffect(() => {
    if (mandatorySoon) {
      setIsMandatoryNoticeOpen(true);
    }
  }, [mandatorySoon]);

  useEffect(() => {
    if (mandatoryLock && savingType === "SUKARELA") {
      setSavingType("WAJIB");
      setAmount("100000");
    }
  }, [mandatoryLock, savingType]);

  const handleAmountChange = (raw: string) => {
    const digits = raw.replace(/\D/g, "");
    setAmount(digits);
  };

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
      setCopyMessage("Tersalin");
      toast.success("Detail rekening koperasi berhasil disalin", { id: "deposit-copy-success" });
      return;
    }

    setMessage("");
    setError("Clipboard diblokir browser. Silakan salin detail rekening secara manual.");
    setCopyMessage("Perlu salin manual");
    toast.error("Clipboard diblokir browser. Perlu salin manual.", { id: "deposit-copy-error" });
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!canDeposit) {
      const errorMessage = "Status anggota belum dapat melakukan setoran.";
      setError(errorMessage);
      toast.error(errorMessage);
      return;
    }

    if (!proofFile) {
      const errorMessage = "Bukti transfer wajib diunggah.";
      setError(errorMessage);
      toast.error(errorMessage, { id: "deposit-proof-required" });
      return;
    }

    if (proofFile.size > 5 * 1024 * 1024) {
      const errorMessage = "Ukuran file maksimal 5MB.";
      setError(errorMessage);
      toast.error(errorMessage);
      return;
    }

    const parsedAmount = Number(amount || "0");
    if (savingType === "SUKARELA" && parsedAmount <= 0) {
      const errorMessage = "Jumlah setoran wajib diisi.";
      setError(errorMessage);
      toast.error(errorMessage);
      return;
    }

    const selectedAccount = memberBankAccounts.find((a) => a.id === selectedBankAccountId);
    if (!selectedAccount) {
      const errorMessage = "Pilih rekening bank anggota terlebih dahulu.";
      setError(errorMessage);
      toast.error(errorMessage);
      return;
    }

    setIsSubmitting(true);

    const formData = new FormData();
    formData.append("transfer_proof", proofFile);
    formData.append("member_bank_name", selectedAccount.bank_name);
    formData.append("member_account_number", selectedAccount.account_number);

    try {
      if (memberStatus === "VERIFIED") {
        await api.post("/savings/deposits/pokok/", formData);
      } else {
        formData.append("saving_type", savingType);
        formData.append("amount", String(parsedAmount));
        await api.post("/savings/deposits/", formData);
      }

      setMessage("");
      toast.success("Setoran berhasil dikirim dan menunggu verifikasi petugas.");
      setIsSuccessModalOpen(true);
      setProofFile(null);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const backendMessage =
          (error.response?.data as { detail?: string; message?: string })?.detail ||
          (error.response?.data as { detail?: string; message?: string })?.message;
        const errorMessage = backendMessage ?? "Gagal mengirim setoran. Periksa input kamu.";
        setError(errorMessage);
        toast.error(errorMessage);
      } else {
        const errorMessage = "Gagal mengirim setoran. Periksa input kamu.";
        setError(errorMessage);
        toast.error(errorMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Modal
        isOpen={isMandatoryNoticeOpen}
        onClose={() => setIsMandatoryNoticeOpen(false)}
        title={mandatoryLock ? "Simpanan wajib belum lunas" : "Pengingat simpanan wajib"}
        description={
          mandatoryLock
            ? "Ada tagihan simpanan wajib yang sudah terlambat. Opsi simpanan sukarela dikunci sampai tunggakan diselesaikan."
            : "Jika tagihan simpanan wajib masuk H-7, sistem akan otomatis mengambil dari saldo simpanan sukarela yang tersedia."
        }
        cancelLabel="Ok, saya mengerti"
        size="sm"
      />

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
        </div>
        </div>

        <form onSubmit={onSubmit} className="mt-6 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
        <div className="border-b border-zinc-200 bg-zinc-50 px-5 py-3 text-sm font-semibold text-zinc-800">Detail Transaksi</div>

        <div className="space-y-4 px-5 py-4">
          {memberStatus === "ACTIVE" && mandatoryCoverage ? (
            <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">
              <p className="font-semibold">Status valid simpanan wajib</p>
              <p className="mt-1">
                Sudah dibayar sampai: <span className="font-semibold">{mandatoryCoverage.paidUntilLabel ?? "Belum ada pembayaran"}</span>
              </p>
              {mandatoryCoverage.nextPeriodLabel ? (
                <p className="mt-1 text-xs text-blue-800">
                  Tagihan aktif berikutnya: {mandatoryCoverage.nextPeriodLabel}
                </p>
              ) : null}
            </div>
          ) : null}

          {mandatorySoon ? (
            <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Tagihan simpanan wajib kamu sudah mendekati jatuh tempo. Jika belum dibayar hingga H-7, sistem akan otomatis menarik dari saldo simpanan sukarela yang tersedia.
            </div>
          ) : null}

          {mandatoryLock ? (
            <div className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
              Ada tunggakan simpanan wajib yang belum diselesaikan. Simpanan sukarela sementara dikunci sampai kewajiban tersebut dibayar.
              <button
                type="button"
                className="ml-2 font-semibold underline"
                onClick={() => router.push("/dashboard/member/savings")}
              >
                Buka halaman simpanan
              </button>
            </div>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-semibold text-zinc-700">Jenis Simpanan</label>
              <select
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm"
                value={savingType}
                onChange={(event) => {
                  const nextType = event.target.value as SavingType;
                  if (mandatoryLock && nextType === "SUKARELA") {
                    setIsMandatoryNoticeOpen(true);
                    return;
                  }
                  setSavingType(nextType);
                }}
                disabled={memberStatus === "VERIFIED" || !canDeposit}
              >
                {memberStatus === "VERIFIED" ? (
                  <option value="POKOK">Simpanan Pokok</option>
                ) : (
                  <>
                    <option value="WAJIB">Wajib</option>
                    <option value="SUKARELA" disabled={mandatoryLock}>
                      Sukarela{mandatoryLock ? " (dikunci sementara)" : ""}
                    </option>
                  </>
                )}
              </select>
              <p className="mt-1 text-xs text-zinc-400">Pilih &apos;Wajib&apos; untuk setoran wajib bulanan.</p>
              <p className="mt-1 text-xs text-zinc-400">Jika tagihan bulan ini sudah lunas, setoran wajib berikutnya akan dialokasikan ke periode bulan selanjutnya (advance).</p>
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-zinc-700">Jumlah Setoran</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-zinc-500 select-none">Rp</span>
                <input
                  type="text"
                  inputMode="numeric"
                  className="w-full rounded-lg border border-zinc-300 py-2 pl-10 pr-3 text-sm"
                  value={amount ? new Intl.NumberFormat("id-ID").format(Number(amount)) : ""}
                  onChange={(event) => handleAmountChange(event.target.value)}
                  onWheel={(event) => {
                    event.preventDefault();
                    event.currentTarget.blur();
                  }}
                  disabled={savingType === "WAJIB" || savingType === "POKOK" || !canDeposit}
                  placeholder="0"
                  required
                />
              </div>
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
              />
            </label>
          </div>

          <div className="rounded-lg border border-yellow-300 bg-yellow-50 px-3 py-2 text-xs text-yellow-700">
            Catatan: Pastikan nominal transfer sesuai dengan nilai yang kamu masukkan di formulir. Data yang tidak sesuai dapat menyebabkan keterlambatan proses.
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
            Disclaimer: Jika tagihan simpanan wajib belum lunas, saldo simpanan sukarela bisa dipakai otomatis untuk menutup kewajiban yang jatuh tempo.
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
              {isSubmitting ? "Mengirim..." : "Kirim Setoran"}
            </button>
          </div>
        </div>
        </form>
      </div>

      <Modal
        isOpen={isSuccessModalOpen}
        onClose={() => {
          setIsSuccessModalOpen(false);
          router.push("/dashboard/member/savings");
        }}
        icon={
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z" />
          </svg>
        }
        title="Simpanan berhasil disimpan"
        description="Setoran berhasil dikirim dan menunggu verifikasi petugas."
        cancelLabel="Saya Mengerti"
        cancelVariant="primary"
        size="sm"
      />
    </>
  );
}
