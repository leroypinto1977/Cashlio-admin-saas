import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { GenerateLicenseDialog } from '@/components/GenerateLicenseDialog'
import { RevokeLicenseButton } from '@/components/RevokeLicenseButton'

export default async function TenantDetailsPage({ params }: { params: { tenantId: string } }) {
  const tenant = await prisma.tenant.findUnique({
    where: { id: params.tenantId },
    include: {
      licenses: {
        orderBy: { createdAt: 'desc' },
        include: { bindings: true }
      }
    }
  })

  if (!tenant) notFound()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mx-2">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{tenant.companyName}</h1>
          <p className="text-muted-foreground">Owner: {tenant.ownerName} &bull; Email: {tenant.contactEmail}</p>
        </div>
        <GenerateLicenseDialog tenantId={tenant.id} />
      </div>

      <div className="rounded-md border bg-white dark:bg-slate-950">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>License Key</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Branches</TableHead>
              <TableHead>Terminals/Branch</TableHead>
              <TableHead>Expires On</TableHead>
              <TableHead>Hardware Bound</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tenant.licenses.map((license) => (
              <TableRow key={license.id}>
                <TableCell className="font-monospace font-medium text-xs">{license.licenseKey}</TableCell>
                <TableCell>
                  <Badge variant={license.status === 'ACTIVE' ? 'default' : license.status === 'PENDING' ? 'secondary' : 'destructive'}>
                    {license.status}
                  </Badge>
                </TableCell>
                <TableCell>{license.maxBranches}</TableCell>
                <TableCell>{license.maxSystemsPerBranch}</TableCell>
                <TableCell>{license.validUntil.toLocaleDateString()}</TableCell>
                <TableCell>{license.bindings.length}</TableCell>
                <TableCell className="text-right">
                  {license.status !== 'REVOKED' && (
                    <RevokeLicenseButton licenseId={license.id} />
                  )}
                </TableCell>
              </TableRow>
            ))}
            {tenant.licenses.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">
                  No licenses found for this tenant.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
