import { SidebarNav } from '@/components/Sidebar'
import { Topbar } from '@/components/Topbar'
import { Providers } from '@/components/Providers'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg-base)', fontFamily: "'Inter', system-ui, sans-serif" }}>
        <SidebarNav />
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          <Topbar />
          <main className="flex-1 overflow-auto page-content">
            {children}
          </main>
        </div>
      </div>
    </Providers>
  )
}
