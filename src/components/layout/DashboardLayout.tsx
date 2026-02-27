'use client'

import { ReactNode } from 'react'
import Sidebar from '@/components/layout/Sidebar'

interface DashboardLayoutProps {
  children: ReactNode
  role: 'MEMBER' | 'STAFF' | 'MANAGER' | 'CHAIRMAN'
  userName?: string
  userID?: string
  avatarUrl?: string
}

export default function DashboardLayout({
  children,
  role,
  userName = 'User',
  userID,
  avatarUrl,
}: DashboardLayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: '#F1F5F9' }}>
      {/* Sidebar */}
      <Sidebar
        role={role}
        userName={userName}
        userID={userID}
        avatarUrl={avatarUrl}
      />

      {/* Main content area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}