import Link from 'next/link'
import { LayoutDashboard, Users, Key, Settings, LogOut } from 'lucide-react'
import { auth, signOut } from '../../../auth'
import { redirect } from 'next/navigation'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  
  if (!session) {
    redirect('/login')
  }

  return (
    <div className="flex min-h-screen bg-slate-100 dark:bg-slate-900">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-slate-200 dark:border-slate-800">
          <span className="text-xl font-bold tracking-tight">Admin SaaS</span>
        </div>
        
        <nav className="flex-1 py-6 px-4 space-y-1">
          <Link href="/dashboard" className="flex items-center px-3 py-2 text-sm font-medium rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-900 dark:text-slate-100">
            <LayoutDashboard className="mr-3 h-5 w-5 text-slate-500" />
            Dashboard
          </Link>
          <Link href="/dashboard/tenants" className="flex items-center px-3 py-2 text-sm font-medium rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300">
            <Users className="mr-3 h-5 w-5 text-slate-500" />
            Tenants
          </Link>
          <Link href="/dashboard/licenses" className="flex items-center px-3 py-2 text-sm font-medium rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300">
            <Key className="mr-3 h-5 w-5 text-slate-500" />
            Licenses
          </Link>
        </nav>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-slate-700 dark:text-slate-300">
            <Settings className="mr-3 h-5 w-5 text-slate-500" />
            Settings
          </div>
          <form action={async () => {
            'use server'
            await signOut({ redirectTo: '/login' })
          }}>
            <button type="submit" className="w-full flex items-center px-3 py-2 mt-1 text-sm font-medium rounded-md hover:bg-red-50 text-red-600 dark:hover:bg-red-950/50 dark:text-red-500">
              <LogOut className="mr-3 h-5 w-5" />
              Sign Out
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
