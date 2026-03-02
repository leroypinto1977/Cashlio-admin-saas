import { prisma } from '@/lib/prisma'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { CreateTenantDialog } from '@/components/CreateTenantDialog'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ChevronRight } from 'lucide-react'

export default async function TenantsPage() {
  const tenants = await prisma.tenant.findMany({
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { licenses: true } } }
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tenants</h1>
          <p className="text-muted-foreground mt-1">Manage your customers and their license keys.</p>
        </div>
        <CreateTenantDialog />
      </div>

      <div className="rounded-md border bg-card text-card-foreground shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="font-semibold text-zinc-900">Company</TableHead>
              <TableHead className="font-semibold text-zinc-900">Owner</TableHead>
              <TableHead className="font-semibold text-zinc-900">Email</TableHead>
              <TableHead className="font-semibold text-zinc-900">Licenses</TableHead>
              <TableHead className="font-semibold text-zinc-900">Created</TableHead>
              <TableHead className="font-semibold text-zinc-900 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tenants.map((tenant) => (
              <TableRow key={tenant.id}>
                <TableCell className="font-medium text-zinc-900">{tenant.companyName}</TableCell>
                <TableCell className="text-muted-foreground">{tenant.ownerName}</TableCell>
                <TableCell className="text-muted-foreground">{tenant.contactEmail}</TableCell>
                <TableCell className="text-muted-foreground">{tenant._count.licenses}</TableCell>
                <TableCell className="text-muted-foreground">{tenant.createdAt.toLocaleDateString()}</TableCell>
                <TableCell className="text-right">
                  <Link href={`/dashboard/tenants/${tenant.id}`}>
                    <Button variant="ghost" size="sm" className="font-medium">
                      Manage <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </Link>
                </TableCell>
              </TableRow>
            ))}
            {tenants.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center h-32 text-muted-foreground">
                  No tenants found. Add your first customer above.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
