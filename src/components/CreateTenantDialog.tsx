'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createTenant } from '@/actions/tenant'
import { useToast } from '@/hooks/use-toast'

export function CreateTenantDialog() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  async function onSubmit(formData: FormData) {
    setLoading(true)
    try {
      await createTenant(formData)
      toast({ title: 'Tenant Created', description: 'The new tenant was successfully added.' })
      setOpen(false)
    } catch {
      toast({ title: 'Error', description: 'Failed to create tenant.', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="font-medium">Add Tenant</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Tenant</DialogTitle>
          <DialogDescription>
            Enter the details for the new customer.
          </DialogDescription>
        </DialogHeader>
        <form action={onSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="ownerName">Owner Name</Label>
            <Input id="ownerName" name="ownerName" placeholder="John Doe" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="companyName">Company Name</Label>
            <Input id="companyName" name="companyName" placeholder="M/S Electricals" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contactEmail">Contact Email</Label>
            <Input id="contactEmail" name="contactEmail" type="email" placeholder="john@example.com" required />
          </div>
          <div className="flex justify-end pt-4">
            <Button type="submit" disabled={loading} className="font-medium">
              {loading ? 'Saving...' : 'Save Tenant'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
