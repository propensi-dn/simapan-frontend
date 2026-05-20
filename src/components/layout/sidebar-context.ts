import { createContext, useContext } from 'react'

export const SidebarContext = createContext<{ onMenuOpen: () => void }>({
  onMenuOpen: () => {},
})

export const useSidebar = () => useContext(SidebarContext)
