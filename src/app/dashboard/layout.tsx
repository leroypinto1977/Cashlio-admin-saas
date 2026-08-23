import Link from 'next/link'
import { LayoutDashboard, Users, Key, Settings, Shield } from 'lucide-react'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import SignOutButton from '@/components/SignOutButton'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session) {
    redirect('/login')
  }

  // A session alone is not authority. Every mutation re-checks the role
  // server-side, but there is no reason to render a console full of customer
  // data to an account that cannot act on any of it.
  const role = (session.user as { role?: string }).role ?? ''
  if (role !== 'SUPER_ADMIN') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50/50 p-8">
        <div className="max-w-md rounded-xl border bg-white p-8 text-center">
          <h1 className="text-lg font-semibold text-zinc-900">No access</h1>
          <p className="mt-2 text-sm text-zinc-600">
            This console is limited to administrators. Ask an administrator to
            grant your account access.
          </p>
          <div className="mt-6">
            <SignOutButton />
          </div>
        </div>
      </div>
    )
  }

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/dashboard/tenants', label: 'Tenants', icon: Users },
    { href: '/dashboard/licenses', label: 'Licenses', icon: Key },
    { href: '/dashboard/staff', label: 'Staff', icon: Shield },
  ]

  return (
    <div className="flex min-h-screen bg-zinc-50/50 text-foreground">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-border flex flex-col fixed inset-y-0 left-0 shadow-sm z-10">
        <div className="h-14 flex items-center px-6 border-b border-border">
          <span className="text-lg font-bold tracking-tight text-zinc-900">Cashlio</span>
          <span className="ml-2 text-[10px] bg-zinc-100 text-zinc-600 border border-zinc-200 px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider">Admin</span>
        </div>

        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center px-3 py-2 text-sm font-medium rounded-md hover:bg-zinc-100 text-zinc-600 hover:text-zinc-900 transition-colors"
            >
              <item.icon className="mr-3 h-4 w-4 text-zinc-500" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-3 border-t border-border space-y-1 bg-zinc-50/50">
          <div className="px-3 py-2 text-xs text-muted-foreground font-medium truncate">
            {session.user.email}
          </div>
          <Link href="/dashboard/settings" className="flex items-center px-3 py-2 text-sm font-medium rounded-md hover:bg-zinc-100 text-zinc-600 hover:text-zinc-900 transition-colors">
            <Settings className="mr-3 h-4 w-4 text-zinc-500" />
            Settings
          </Link>
          <SignOutButton />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 min-h-screen">
        <div className="p-8 max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
