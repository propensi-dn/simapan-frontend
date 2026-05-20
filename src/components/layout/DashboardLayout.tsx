'use client'

import { useState, ReactNode } from 'react'
import Sidebar from '@/components/layout/Sidebar'
import { SidebarContext } from '@/components/layout/sidebar-context'

interface DashboardLayoutProps {
  children: ReactNode
  role: 'MEMBER' | 'STAFF' | 'MANAGER' | 'CHAIRMAN'
  userName?: string
  userID?: string
  avatarUrl?: string
  isLoading?: boolean
}

export default function DashboardLayout({
  children,
  role,
  userName = 'User',
  userID,
  avatarUrl,
  isLoading,
}: DashboardLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <SidebarContext.Provider value={{ onMenuOpen: () => setMobileOpen(true) }}>
      <div className="flex h-screen overflow-hidden" style={{ backgroundColor: '#F1F5F9' }}>
        <Sidebar
          role={role}
          userName={userName}
          userID={userID}
          avatarUrl={avatarUrl}
          isLoading={isLoading}
          mobileOpen={mobileOpen}
          onClose={() => setMobileOpen(false)}
        />

        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarContext.Provider>
  )
}
