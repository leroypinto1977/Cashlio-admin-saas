'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { revokeLicense } from '@/actions/license'
import { useToast } from '@/hooks/use-toast'

export function RevokeLicenseButton({ licenseId }: { licenseId: string }) {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  async function handleRevoke() {
    if (!confirm('Are you sure you want to revoke this license? It will instantly break any connected systems.')) return

    setLoading(true)
    try {
      await revokeLicense(licenseId)
      toast({ title: 'License Revoked', description: 'The license block has been applied.' })
    } catch {
      toast({ title: 'Error', variant: 'destructive', description: 'Failed to revoke license.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button variant="destructive" size="sm" onClick={handleRevoke} disabled={loading}>
      {loading ? 'Revoking...' : 'Revoke'}
    </Button>
  )
}
