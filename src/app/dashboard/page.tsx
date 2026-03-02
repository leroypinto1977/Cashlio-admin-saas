import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Building2, Key, MonitorSmartphone, CheckCircle } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

export default async function DashboardPage() {
  const [tenantsCount, activeLicensesCount, pendingLicensesCount, recentLicenses] = await prisma.$transaction([
    prisma.tenant.count(),
    prisma.license.count({ where: { status: 'ACTIVE' } }),
    prisma.license.count({ where: { status: 'PENDING' } }),
    prisma.license.findMany({
      take: 6,
      orderBy: { createdAt: 'desc' },
      include: { tenant: true }
    }),
  ])

  const statusVariant = (status: string) => {
    if (status === 'ACTIVE') return 'default'
    if (status === 'PENDING') return 'secondary'
    return 'destructive'
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">System Overview</h1>
        <p className="text-muted-foreground mt-1">High level metrics across all active installations.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Tenants</CardTitle>
            <Building2 className="h-4 w-4 text-zinc-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tenantsCount}</div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Licenses</CardTitle>
            <CheckCircle className="h-4 w-4 text-zinc-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeLicensesCount}</div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Keys</CardTitle>
            <Key className="h-4 w-4 text-zinc-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingLicensesCount}</div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Systems Issued</CardTitle>
            <MonitorSmartphone className="h-4 w-4 text-zinc-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeLicensesCount + pendingLicensesCount}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Recent License Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>License Key</TableHead>
                <TableHead>Tenant</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Date Issued</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentLicenses.map((license) => (
                <TableRow key={license.id}>
                  <TableCell className="font-mono text-xs">{license.licenseKey}</TableCell>
                  <TableCell className="font-medium">{license.tenant.companyName}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(license.status) as 'default' | 'secondary' | 'destructive'}>
                      {license.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{license.branchName ?? '—'}</TableCell>
                  <TableCell className="text-muted-foreground">{license.createdAt.toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
              {recentLicenses.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No license records found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
