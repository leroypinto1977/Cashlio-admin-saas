'use client'

import { signOut } from '@/lib/auth-client'
import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'

export default function SignOutButton() {
  const router = useRouter()

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <button
      onClick={handleSignOut}
      className="w-full flex items-center px-3 py-2 text-sm font-medium rounded-md hover:bg-zinc-100 text-zinc-600 hover:text-zinc-900 transition-colors"
    >
      <LogOut className="mr-3 h-4 w-4 text-zinc-500" />
      Sign Out
    </button>
  )
}
