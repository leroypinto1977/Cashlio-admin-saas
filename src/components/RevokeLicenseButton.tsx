'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { revokeLicense } from '@/actions/license'
import { useToast } from '@/hooks/use-toast'

export function RevokeLicenseButton({ licenseId }: { licenseId: string }) {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  async function handleRevoke() {
    if (!confirm('Are you sure? This will immediately prevent the shop from connecting.')) return
    setLoading(true)
    try {
      await revokeLicense(licenseId)
      toast({ title: 'License Revoked', description: 'The key has been blocked.' })
    } catch {
      toast({ title: 'Error', variant: 'destructive', description: 'Failed to revoke license.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button 
      variant="ghost" 
      size="sm" 
      onClick={handleRevoke} 
      disabled={loading}
      className="text-destructive hover:text-destructive hover:bg-destructive/10 font-medium"
    >
      {loading ? 'Revoking...' : 'Revoke'}
    </Button>
  )
}
