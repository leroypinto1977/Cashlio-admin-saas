import { prisma } from '@/lib/prisma'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { RevokeLicenseButton } from '@/components/RevokeLicenseButton'

export default async function LicensesPage() {
  const licenses = await prisma.license.findMany({
    orderBy: { createdAt: 'desc' },
    include: { tenant: true }
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mx-2">
        <h1 className="text-3xl font-bold tracking-tight">Global Licenses</h1>
      </div>

      <div className="rounded-md border bg-white dark:bg-slate-950">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>License Key</TableHead>
              <TableHead>Tenant</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Expires On</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {licenses.map((license) => (
              <TableRow key={license.id}>
                <TableCell className="font-monospace font-medium text-xs">{license.licenseKey}</TableCell>
                <TableCell>{license.tenant.companyName}</TableCell>
                <TableCell>
                  <Badge variant={license.status === 'ACTIVE' ? 'default' : license.status === 'PENDING' ? 'secondary' : 'destructive'}>
                    {license.status}
                  </Badge>
                </TableCell>
                <TableCell>{license.validUntil.toLocaleDateString()}</TableCell>
                <TableCell className="text-right">
                  {license.status !== 'REVOKED' && (
                    <RevokeLicenseButton licenseId={license.id} />
                  )}
                </TableCell>
              </TableRow>
            ))}
            {licenses.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                  No licenses generated across any tenants yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
