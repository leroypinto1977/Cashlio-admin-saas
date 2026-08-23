'use server'

import { randomInt } from 'crypto'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/require-admin'

/**
 * A licence key is the only credential the public activation endpoint asks
 * for, so it has to be unguessable. Math.random is a predictable PRNG whose
 * state can be recovered from a handful of observed outputs — enough for
 * someone holding a few legitimate keys to predict the next ones and activate
 * them before the buyer does.
 */
function generateLicenseKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  const segment = (): string =>
    Array.from({ length: 4 }, () => chars[randomInt(chars.length)]).join('')
  return `SHP-${segment()}-${segment()}-${segment()}`
}

export async function generateLicense(formData: FormData) {
  await requireAdmin()

  const tenantId = formData.get('tenantId') as string
  const maxBranches = parseInt(formData.get('maxBranches') as string, 10)
  const maxSystemsPerBranch = parseInt(formData.get('maxSystemsPerBranch') as string, 10)
  const validDurationDays = parseInt(formData.get('validDurationDays') as string, 10)

  if (!tenantId || isNaN(maxBranches) || isNaN(maxSystemsPerBranch) || isNaN(validDurationDays)) {
    throw new Error('Invalid input data')
  }

  // Generate PENDING key — no hardware attached, no expiry yet
  const licenseKey = generateLicenseKey()

  const license = await prisma.license.create({
    data: {
      tenantId,
      licenseKey,
      maxBranches,
      maxSystemsPerBranch,
      validDurationDays,
      status: 'PENDING',
      // expiresAt and activatedAt are null until App B activates
    }
  })

  revalidatePath(`/dashboard/tenants/${tenantId}`)
  revalidatePath('/dashboard/licenses')
  revalidatePath('/dashboard')

  return license
}

export async function revokeLicense(licenseId: string) {
  await requireAdmin()

  const license = await prisma.license.update({
    where: { id: licenseId },
    data: { status: 'REVOKED' }
  })

  revalidatePath(`/dashboard/tenants/${license.tenantId}`)
  revalidatePath('/dashboard/licenses')
  return license
}

export async function upgradeLicenseCapacity(licenseId: string, newMaxSystemsPerBranch: number) {
  await requireAdmin()

  const license = await prisma.license.update({
    where: { id: licenseId },
    data: { maxSystemsPerBranch: newMaxSystemsPerBranch }
  })

  revalidatePath(`/dashboard/tenants/${license.tenantId}`)
  revalidatePath('/dashboard/licenses')
  revalidatePath('/dashboard')
  return license
}

export async function resetHardwareAndIssueNewKey(oldLicenseId: string) {
  await requireAdmin()

  const oldLicense = await prisma.license.findUnique({ where: { id: oldLicenseId } })
  if (!oldLicense) throw new Error('License not found')

  // Revoke old license to prevent old PC from syncing
  await prisma.license.update({
    where: { id: oldLicenseId },
    data: { status: 'REVOKED' }
  })

  // Issue new blank license carrying over the previous expiry constraints
  const newLicenseKey = generateLicenseKey()
  const newLicense = await prisma.license.create({
    data: {
      tenantId: oldLicense.tenantId,
      licenseKey: newLicenseKey,
      maxBranches: oldLicense.maxBranches,
      maxSystemsPerBranch: oldLicense.maxSystemsPerBranch,
      validDurationDays: oldLicense.validDurationDays,
      status: 'PENDING',
      expiresAt: oldLicense.expiresAt, // Carry over physical expiration date
    }
  })

  revalidatePath(`/dashboard/tenants/${oldLicense.tenantId}`)
  revalidatePath('/dashboard/licenses')
  revalidatePath('/dashboard')

  return newLicense
}
