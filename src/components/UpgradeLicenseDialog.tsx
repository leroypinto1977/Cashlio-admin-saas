'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { upgradeLicenseCapacity } from '@/actions/license'
import { useToast } from '@/hooks/use-toast'
import { ArrowUpCircle } from 'lucide-react'

export function UpgradeLicenseDialog({ licenseId, currentMaxSystems }: { licenseId: string, currentMaxSystems: number }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  async function onSubmit(formData: FormData) {
    setLoading(true)
    try {
      const newMax = parseInt(formData.get('maxSystemsPerBranch') as string, 10)
      if (newMax <= currentMaxSystems) {
        toast({ title: 'Invalid Upgrade', description: 'New capacity must be higher than current.', variant: 'destructive' })
        setLoading(false)
        return
      }
      
      await upgradeLicenseCapacity(licenseId, newMax)
      toast({ title: 'License Upgraded', description: 'The shop will sync this new limit automatically.' })
      setOpen(false)
    } catch {
      toast({ title: 'Error', description: 'Failed to upgrade license.', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50">
          <ArrowUpCircle className="h-4 w-4 mr-1" /> Upgrade
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Upgrade License Limit</DialogTitle>
          <DialogDescription>
            Increase the maximum amount of device terminals this shop can use.
          </DialogDescription>
        </DialogHeader>
        <form action={onSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="maxSystemsPerBranch">New Maximum Terminals</Label>
            <Input id="maxSystemsPerBranch" name="maxSystemsPerBranch" type="number" defaultValue={currentMaxSystems + 1} min={currentMaxSystems + 1} required />
          </div>
          
          <div className="flex justify-end pt-4">
            <Button type="submit" disabled={loading} className="font-medium">
              {loading ? 'Saving...' : 'Confirm Upgrade'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
