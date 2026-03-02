'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
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
      toast({ title: 'License Key Generated', description: 'The blank PENDING key has been created.' })
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
        <Button className="font-medium">Generate License Key</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Generate License Key</DialogTitle>
          <DialogDescription>
            Configure the limits for this blank key. Expiry starts upon activation.
          </DialogDescription>
        </DialogHeader>
        <form action={onSubmit} className="space-y-4 pt-2">
          <input type="hidden" name="tenantId" value={tenantId} />
          
          <div className="space-y-2">
            <Label htmlFor="maxBranches">Max Branches</Label>
            <Input id="maxBranches" name="maxBranches" type="number" defaultValue="1" min="1" required />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="maxSystemsPerBranch">Max Terminals Per Branch</Label>
            <Input id="maxSystemsPerBranch" name="maxSystemsPerBranch" type="number" defaultValue="5" min="1" required />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="validDurationDays">Validity Duration (Days)</Label>
            <Input id="validDurationDays" name="validDurationDays" type="number" defaultValue="365" min="1" required />
            <p className="text-[13px] text-muted-foreground">Expiry countdown begins only when App B binds to this key.</p>
          </div>
          
          <div className="flex justify-end pt-4">
            <Button type="submit" disabled={loading} className="font-medium">
              {loading ? 'Generating...' : 'Generate Key'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
