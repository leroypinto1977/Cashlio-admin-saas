import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { GenerateLicenseDialog } from '@/components/GenerateLicenseDialog'
import { RevokeLicenseButton, ReinstateLicenseButton } from '@/components/RevokeLicenseButton'
import { ResetLicenseButton } from '@/components/ResetLicenseButton'
import { UpgradeLicenseDialog } from '@/components/UpgradeLicenseDialog'
import { LicenseInstalls } from '@/components/LicenseInstalls'
import { Mail, User } from 'lucide-react'

export default async function TenantDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  
  const tenant = await prisma.tenant.findUnique({
    where: { id },
    include: {
      licenses: {
        orderBy: { createdAt: 'desc' },
        include: { installs: { orderBy: [{ releasedAt: 'asc' }, { firstSeenAt: 'asc' }] } }
      }
    }
  })

  if (!tenant) notFound()

  const statusVariant = (status: string) => {
    if (status === 'ACTIVE') return 'default'
    if (status === 'PENDING') return 'secondary'
    return 'destructive'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{tenant.companyName}</h1>
          <div className="flex items-center gap-4 mt-2">
            <span className="flex items-center text-muted-foreground text-sm font-medium gap-1.5">
              <User className="h-4 w-4" /> {tenant.ownerName}
            </span>
            <span className="flex items-center text-muted-foreground text-sm font-medium gap-1.5">
              <Mail className="h-4 w-4" /> {tenant.contactEmail}
            </span>
          </div>
        </div>
        <GenerateLicenseDialog tenantId={tenant.id} />
      </div>

      <div className="rounded-md border bg-card text-card-foreground shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b">
          <h2 className="text-lg font-semibold">License Keys</h2>
          <p className="text-sm text-muted-foreground">Manage hardware bindings and capacity limitations.</p>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="font-semibold text-zinc-900">License Key</TableHead>
              <TableHead className="font-semibold text-zinc-900">Status</TableHead>
              <TableHead className="font-semibold text-zinc-900">Branch Name</TableHead>
              <TableHead className="font-semibold text-zinc-900">Max Terminals</TableHead>
              <TableHead className="font-semibold text-zinc-900">Duration</TableHead>
              <TableHead className="font-semibold text-zinc-900">Expires At</TableHead>
              <TableHead className="font-semibold text-zinc-900 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tenant.licenses.map((license) => (
              <TableRow key={license.id}>
                <TableCell className="font-mono text-xs font-semibold">{license.licenseKey}</TableCell>
                <TableCell>
                  <Badge variant={statusVariant(license.status) as 'default' | 'secondary' | 'destructive'}>
                    {license.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">{license.branchName ?? '—'}</TableCell>
                <TableCell className="text-muted-foreground">{license.maxSystemsPerBranch}</TableCell>
                <TableCell className="text-muted-foreground">{license.validDurationDays} days</TableCell>
                <TableCell className="text-muted-foreground">
                  {license.expiresAt ? license.expiresAt.toLocaleDateString() : 'Pending Activation'}
                </TableCell>
                <TableCell className="text-right">
                  {license.status === 'REVOKED' ? (
                    <div className="flex justify-end items-center gap-1">
                      <ReinstateLicenseButton licenseId={license.id} />
                    </div>
                  ) : (
                    <div className="flex justify-end items-center gap-1">
                      <UpgradeLicenseDialog licenseId={license.id} currentMaxSystems={license.maxSystemsPerBranch} />
                      <ResetLicenseButton licenseId={license.id} />
                      <RevokeLicenseButton licenseId={license.id} />
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {tenant.licenses.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center h-32 text-muted-foreground">
                  No licenses yet. Generate the first key to get started.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Which machines each licence is actually running on. The seat limit is
          enforced now, so a shop that cannot activate a replacement will ring
          up asking why — the answer, and the fix, are both here. */}
      {tenant.licenses
        .filter((l) => l.installs.length > 0)
        .map((license) => (
          <div key={license.id} className="rounded-lg border bg-card p-5 space-y-3">
            <div>
              <h2 className="text-sm font-semibold">
                Machines on <span className="font-mono">{license.licenseKey}</span>
              </h2>
              <p className="text-xs text-muted-foreground">
                Each installation of the branch server reports the machine it runs on.
              </p>
            </div>
            <LicenseInstalls
              seatLimit={license.maxBranches}
              installs={license.installs.map((i) => ({
                id: i.id,
                hardwareId: i.hardwareId,
                label: i.label,
                branchName: i.branchName,
                firstSeenAt: i.firstSeenAt.toISOString(),
                lastSeenAt: i.lastSeenAt.toISOString(),
                releasedAt: i.releasedAt?.toISOString() ?? null,
                releaseNote: i.releaseNote
              }))}
            />
          </div>
        ))}
    </div>
  )
}
