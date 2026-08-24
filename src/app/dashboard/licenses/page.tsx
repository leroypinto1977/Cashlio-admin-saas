import { prisma } from '@/lib/prisma'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { RevokeLicenseButton, ReinstateLicenseButton } from '@/components/RevokeLicenseButton'

export default async function LicensesPage() {
  const licenses = await prisma.license.findMany({
    orderBy: { createdAt: 'desc' },
    include: { tenant: true }
  })

  const statusVariant = (status: string) => {
    if (status === 'ACTIVE') return 'default'
    if (status === 'PENDING') return 'secondary'
    return 'destructive'
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">All Licenses</h1>
        <p className="text-muted-foreground mt-1">Global view of all license keys across all tenants.</p>
      </div>

      <div className="rounded-md border bg-card text-card-foreground shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="font-semibold text-zinc-900">License Key</TableHead>
              <TableHead className="font-semibold text-zinc-900">Tenant</TableHead>
              <TableHead className="font-semibold text-zinc-900">Status</TableHead>
              <TableHead className="font-semibold text-zinc-900">Branch Name</TableHead>
              <TableHead className="font-semibold text-zinc-900">Terminals</TableHead>
              <TableHead className="font-semibold text-zinc-900">Expires At</TableHead>
              <TableHead className="font-semibold text-zinc-900 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {licenses.map((license) => (
              <TableRow key={license.id}>
                <TableCell className="font-mono text-xs font-semibold">{license.licenseKey}</TableCell>
                <TableCell className="font-medium text-zinc-900">{license.tenant.companyName}</TableCell>
                <TableCell>
                  <Badge variant={statusVariant(license.status) as 'default' | 'secondary' | 'destructive'}>
                    {license.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">{license.branchName ?? '—'}</TableCell>
                <TableCell className="text-muted-foreground">{license.maxSystemsPerBranch}</TableCell>
                <TableCell className="text-muted-foreground">
                  {license.expiresAt ? license.expiresAt.toLocaleDateString() : '—'}
                </TableCell>
                <TableCell className="text-right">
                  {license.status === 'REVOKED' ? (
                    <ReinstateLicenseButton licenseId={license.id} />
                  ) : (
                    <RevokeLicenseButton licenseId={license.id} />
                  )}
                </TableCell>
              </TableRow>
            ))}
            {licenses.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center h-32 text-muted-foreground">
                  No license keys found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
