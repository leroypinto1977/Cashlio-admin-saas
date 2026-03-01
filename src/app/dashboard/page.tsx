import { prisma } from '@/lib/prisma'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Building2, Key, MonitorSmartphone } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

export default async function DashboardPage() {
  const tenantsCount = await prisma.tenant.count()
  const activeLicensesCount = await prisma.license.count({
    where: { status: 'ACTIVE' }
  })
  const hardwareCount = await prisma.hardwareBinding.count()
  
  const recentLicenses = await prisma.license.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: { tenant: true }
  })

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Dashboard Overview</h1>
      
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Tenants</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tenantsCount}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Licenses</CardTitle>
            <Key className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeLicensesCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Hardware Bound</CardTitle>
            <MonitorSmartphone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{hardwareCount}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Licenses generated</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Key</TableHead>
                <TableHead>Tenant</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentLicenses.map((license) => (
                <TableRow key={license.id}>
                  <TableCell className="font-monospace text-xs">{license.licenseKey}</TableCell>
                  <TableCell>{license.tenant.companyName}</TableCell>
                  <TableCell>
                    <Badge variant={license.status === 'ACTIVE' ? 'default' : license.status === 'PENDING' ? 'secondary' : 'destructive'}>
                      {license.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(license.createdAt).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
              {recentLicenses.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-4">
                    No licenses generated yet.
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
