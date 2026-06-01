"use client";

import { usePathname } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import DashboardHeader from "@/components/layout/DashboardHeader";

export default function SavingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isDepositPage = pathname.startsWith("/savings/deposit") || pathname.startsWith("/dashboard/member/savings/deposit");
  const isWithdrawPage = pathname.startsWith("/savings/withdraw") || pathname.startsWith("/dashboard/member/savings/withdraw");
  const isFormPage = isDepositPage || isWithdrawPage;

  return (
    <DashboardLayout role="MEMBER">
      {isFormPage ? (
        <DashboardHeader
          variant="form"
          title={isWithdrawPage ? "Form Penarikan" : "Form Setoran"}
          backLabel="Kembali ke Ringkasan Simpanan"
          backHref="/dashboard/member/savings"
          notifCount={2}
        />
      ) : (
        <DashboardHeader
          variant="detail"
          parentLabel="Dashboard"
          parentHref="/dashboard/member"
          currentLabel="Simpanan"
          notifCount={2}
        />
      )}

      <main className="flex-1 overflow-y-auto p-8">{children}</main>
    </DashboardLayout>
  );
}
