'use client'

import { useState, ReactNode } from 'react'
import Sidebar from '@/components/layout/Sidebar'
import { SidebarContext } from '@/components/layout/sidebar-context'
import { useUserProfile } from '@/hooks/useUserProfile'

interface DashboardLayoutProps {
  children: ReactNode
  role: 'MEMBER' | 'STAFF' | 'MANAGER' | 'CHAIRMAN'
}

export default function DashboardLayout({ children, role }: DashboardLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { userName, userID, avatarUrl, isLoading } = useUserProfile()

  return (
    <SidebarContext.Provider value={{ onMenuOpen: () => setMobileOpen(true) }}>
      <div className="flex h-screen overflow-hidden" style={{ backgroundColor: '#F1F5F9' }}>
        <Sidebar
          role={role}
          userName={userName || 'User'}
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
