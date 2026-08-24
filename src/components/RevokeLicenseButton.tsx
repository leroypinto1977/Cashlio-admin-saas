'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { revokeLicense, reinstateLicense } from '@/actions/license'
import { useToast } from '@/hooks/use-toast'

/**
 * Revoking is the one action here a shop feels immediately, so it asks for a
 * reason. The reason is shown back on the licence and travels to the branch
 * server, which puts it on screen instead of a bare "licence locked" — the
 * person standing at the till can then tell the owner what to ring about.
 */
export function RevokeLicenseButton({ licenseId }: { licenseId: string }) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  async function handleRevoke() {
    setLoading(true)
    try {
      await revokeLicense(licenseId, reason)
      toast({
        title: 'Licence revoked',
        description: 'Billing stops at this shop the next time it reaches the server.'
      })
      setOpen(false)
      setReason('')
    } catch {
      toast({ title: 'Could not revoke the licence', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="text-destructive hover:text-destructive hover:bg-destructive/10 font-medium"
        >
          Revoke
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Revoke this licence?</DialogTitle>
          <DialogDescription>
            The shop stops being able to bill. Existing sales stay on their machine and
            they can still read their history — new bills are blocked. This can be undone.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="revoke-reason">Reason</Label>
          <Input
            id="revoke-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Subscription unpaid since March"
            autoFocus
          />
          <p className="text-xs text-muted-foreground">
            Shown on the licence, and to the shop when their till reports the block.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleRevoke} disabled={loading}>
            {loading ? 'Revoking…' : 'Revoke licence'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/** Undoes a revocation — a bill settled, or a revocation made in error. */
export function ReinstateLicenseButton({ licenseId }: { licenseId: string }) {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  async function handleReinstate() {
    if (!confirm('Put this licence back? The shop will be able to bill again.')) return
    setLoading(true)
    try {
      await reinstateLicense(licenseId)
      toast({
        title: 'Licence reinstated',
        description: 'The shop can bill again once its till next reaches the server.'
      })
    } catch {
      toast({ title: 'Could not reinstate the licence', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button variant="ghost" size="sm" onClick={handleReinstate} disabled={loading} className="font-medium">
      {loading ? 'Reinstating…' : 'Reinstate'}
    </Button>
  )
}
