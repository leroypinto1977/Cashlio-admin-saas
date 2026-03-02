'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { resetHardwareAndIssueNewKey } from '@/actions/license'
import { useToast } from '@/hooks/use-toast'
import { RefreshCcw } from 'lucide-react'

export function ResetLicenseButton({ licenseId }: { licenseId: string }) {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  async function handleReset() {
    if (!confirm('This revokes the current key and issues a new PENDING one to the tenant. Are you sure?')) return
    setLoading(true)
    try {
      await resetHardwareAndIssueNewKey(licenseId)
      toast({ title: 'Hardware Reset', description: 'A new pending key has been generated.' })
    } catch {
      toast({ title: 'Error', variant: 'destructive', description: 'Failed to reset hardware.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button 
      variant="ghost" 
      size="sm" 
      onClick={handleReset} 
      disabled={loading}
      className="text-amber-600 hover:text-amber-700 hover:bg-amber-50 font-medium"
      title="Reset Hardware Binding"
    >
      <RefreshCcw className="h-4 w-4 mr-1" />
      {loading ? '...' : 'Reset'}
    </Button>
  )
}
