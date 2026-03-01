'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

function generateLicenseKey() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  const segment = () => Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  return `SHP-${segment()}-${segment()}-${segment()}`
}

export async function generateLicense(formData: FormData) {
  const tenantId = formData.get('tenantId') as string
  const maxBranches = parseInt(formData.get('maxBranches') as string, 10)
  const maxSystemsPerBranch = parseInt(formData.get('maxSystemsPerBranch') as string, 10)
  const durationDays = parseInt(formData.get('durationDays') as string, 10)

  if (!tenantId || isNaN(maxBranches) || isNaN(maxSystemsPerBranch) || isNaN(durationDays)) {
    throw new Error('Invalid input data')
  }

  const validUntil = new Date()
  validUntil.setDate(validUntil.getDate() + durationDays)

  const licenseKey = generateLicenseKey()

  const license = await prisma.license.create({
    data: {
      tenantId,
      licenseKey,
      maxBranches,
      maxSystemsPerBranch,
      validUntil,
      status: 'PENDING'
    }
  })

  revalidatePath(`/dashboard/tenants/${tenantId}`)
  revalidatePath('/dashboard/licenses')
  revalidatePath('/dashboard')
  
  return license
}

export async function revokeLicense(licenseId: string) {
  const license = await prisma.license.update({
    where: { id: licenseId },
    data: { status: 'REVOKED' }
  })
  
  revalidatePath(`/dashboard/tenants/${license.tenantId}`)
  revalidatePath('/dashboard/licenses')
  return license
}
