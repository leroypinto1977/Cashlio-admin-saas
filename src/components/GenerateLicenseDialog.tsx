'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { generateLicense } from '@/actions/license'
import { useToast } from '@/hooks/use-toast'

export function GenerateLicenseDialog({ tenantId }: { tenantId: string }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  async function onSubmit(formData: FormData) {
    setLoading(true)
    try {
      await generateLicense(formData)
      toast({ title: 'License Generated', description: 'The new license key has been created.' })
      setOpen(false)
    } catch {
      toast({ title: 'Error', description: 'Failed to generate license.', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Generate New License</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Generate License</DialogTitle>
          <DialogDescription>
            Configure the limits and duration for this new license key.
          </DialogDescription>
        </DialogHeader>
        <form action={onSubmit} className="space-y-4 pt-4">
          <input type="hidden" name="tenantId" value={tenantId} />
          <div className="space-y-2">
            <Label htmlFor="maxBranches">Max Branches</Label>
            <Input id="maxBranches" name="maxBranches" type="number" defaultValue="1" min="1" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="maxSystemsPerBranch">Max Systems Per Branch</Label>
            <Input id="maxSystemsPerBranch" name="maxSystemsPerBranch" type="number" defaultValue="3" min="1" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="durationDays">Validity Duration (Days)</Label>
            <Input id="durationDays" name="durationDays" type="number" defaultValue="365" min="1" required />
          </div>
          <div className="flex justify-end pt-4">
            <Button type="submit" disabled={loading}>
              {loading ? 'Generating...' : 'Generate Key'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
