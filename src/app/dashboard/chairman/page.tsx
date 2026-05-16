'use client'

import DashboardLayout from '@/components/layout/DashboardLayout'
import DashboardHeader from '@/components/layout/DashboardHeader'

export default function ChairmanDashboardPage() {
  return (
    <DashboardLayout role="CHAIRMAN" userName="Ketua" userID="">
      <DashboardHeader variant="default" title="Dashboard" />

      <main className="flex-1 p-8 bg-gray-50">
        {/* Placeholder content */}
      </main>
    </DashboardLayout>
  )
}
