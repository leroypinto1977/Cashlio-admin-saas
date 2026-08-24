'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { releaseInstall } from '@/actions/license'
import { useToast } from '@/hooks/use-toast'

export type InstallRow = {
  id: string
  hardwareId: string
  label: string | null
  branchName: string | null
  firstSeenAt: string
  lastSeenAt: string
  releasedAt: string | null
  releaseNote: string | null
}

const when = (iso: string) =>
  new Date(iso).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })

/** How long ago, in the terms somebody chasing a shop actually thinks in. */
function ago(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (mins < 60) return `${Math.max(1, mins)} min ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? '' : 's'} ago`
  const days = Math.floor(hrs / 24)
  return `${days} day${days === 1 ? '' : 's'} ago`
}

/**
 * The machines a licence is running on.
 *
 * Worth showing plainly, because the seat limit is now enforced and a shop
 * that cannot activate a replacement machine will ring up asking why. The
 * answer is on this list, and so is the fix.
 */
export function LicenseInstalls({
  installs,
  seatLimit
}: {
  installs: InstallRow[]
  seatLimit: number
}) {
  const [busy, setBusy] = useState<string | null>(null)
  const { toast } = useToast()

  const active = installs.filter((i) => !i.releasedAt)
  const released = installs.filter((i) => i.releasedAt)

  async function handleRelease(install: InstallRow) {
    const note = prompt(
      'Why is this machine being released? (e.g. "Replaced with a new PC")\n\n' +
        'The shop keeps its history; the seat becomes free for another machine.'
    )
    if (note === null) return
    setBusy(install.id)
    try {
      await releaseInstall(install.id, note)
      toast({
        title: 'Seat released',
        description: 'Another machine can now activate against this licence.'
      })
    } catch {
      toast({ title: 'Could not release the seat', variant: 'destructive' })
    } finally {
      setBusy(null)
    }
  }

  if (installs.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No machine has activated this licence yet.
      </p>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-baseline gap-2">
        <p className="text-sm font-semibold">
          {active.length} of {seatLimit} machine{seatLimit === 1 ? '' : 's'} in use
        </p>
        {active.length >= seatLimit && (
          <Badge variant="secondary">Full — release one to add another</Badge>
        )}
      </div>

      <ul className="divide-y rounded-md border">
        {[...active, ...released].map((i) => (
          <li key={i.id} className="flex items-center gap-4 p-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">
                {i.label ?? i.branchName ?? 'Unnamed machine'}
                {i.releasedAt && (
                  <span className="ml-2 text-xs font-normal text-muted-foreground">released</span>
                )}
              </p>
              {/* The full hash is meaningless to read and useless to type; the
                  first few characters are enough to tell two machines apart. */}
              <p className="font-mono text-xs text-muted-foreground">
                {i.hardwareId.slice(0, 16)}…
              </p>
              <p className="text-xs text-muted-foreground">
                {i.releasedAt
                  ? `Released ${when(i.releasedAt)}${i.releaseNote ? ` — ${i.releaseNote}` : ''}`
                  : `First seen ${when(i.firstSeenAt)} · last checked in ${ago(i.lastSeenAt)}`}
              </p>
            </div>
            {!i.releasedAt && (
              <Button
                variant="ghost"
                size="sm"
                disabled={busy === i.id}
                onClick={() => handleRelease(i)}
              >
                {busy === i.id ? 'Releasing…' : 'Release seat'}
              </Button>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
