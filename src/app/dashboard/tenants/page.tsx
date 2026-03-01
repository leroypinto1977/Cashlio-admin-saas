import { prisma } from '@/lib/prisma'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { CreateTenantDialog } from '@/components/CreateTenantDialog'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default async function TenantsPage() {
  const tenants = await prisma.tenant.findMany({
    orderBy: { createdAt: 'desc' }
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mx-2">
        <h1 className="text-3xl font-bold tracking-tight">Tenants</h1>
        <CreateTenantDialog />
      </div>

      <div className="rounded-md border bg-white dark:bg-slate-950">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Company Name</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tenants.map((tenant) => (
              <TableRow key={tenant.id}>
                <TableCell className="font-medium">{tenant.companyName}</TableCell>
                <TableCell>{tenant.ownerName}</TableCell>
                <TableCell>{tenant.contactEmail}</TableCell>
                <TableCell>{tenant.createdAt.toLocaleDateString()}</TableCell>
                <TableCell className="text-right">
                  <Link href={`/dashboard/tenants/${tenant.id}`}>
                    <Button variant="outline" size="sm">Manage Server</Button>
                  </Link>
                </TableCell>
              </TableRow>
            ))}
            {tenants.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                  No tenants found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
