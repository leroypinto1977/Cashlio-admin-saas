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

/**
 * Stop a shop trading.
 *
 * This used to set `status` alone, which read as revoked on the dashboard
 * while leaving every mechanism that enforces it switched off. `revokedAt`
 * was never written, so the check for it in the activation and refresh
 * endpoints was dead code; and `refreshTokenSeq` was never bumped, so the
 * seven-day token already on the shop's machine stayed valid for its full
 * life — a revoked shop that simply unplugged its internet carried on
 * billing.
 *
 * Bumping the sequence is what makes the token in their hands stale: the
 * branch server compares the number in its cached licence against the one it
 * last saw and locks itself when it has moved on without it.
 */
export async function revokeLicense(licenseId: string, reason?: string) {
  await requireAdmin()

  const license = await prisma.license.update({
    where: { id: licenseId },
    data: {
      status: 'REVOKED',
      revokedAt: new Date(),
      revokeReason: reason?.trim() || null,
      refreshTokenSeq: { increment: 1 }
    }
  })

  revalidatePath(`/dashboard/tenants/${license.tenantId}`)
  revalidatePath('/dashboard/licenses')
  return license
}

/**
 * Put a licence back after a revocation that shouldn't have happened, or once
 * a bill has been settled. The sequence is bumped again rather than rolled
 * back — it only ever moves forward, so a token minted before the revocation
 * cannot be replayed to look current.
 */
export async function reinstateLicense(licenseId: string) {
  await requireAdmin()

  const existing = await prisma.license.findUnique({ where: { id: licenseId } })
  if (!existing) throw new Error('License not found')

  const license = await prisma.license.update({
    where: { id: licenseId },
    data: {
      // A licence that was never activated goes back to waiting for its shop.
      status: existing.activatedAt ? 'ACTIVE' : 'PENDING',
      revokedAt: null,
      revokeReason: null,
      refreshTokenSeq: { increment: 1 }
    }
  })

  revalidatePath(`/dashboard/tenants/${license.tenantId}`)
  revalidatePath('/dashboard/licenses')
  return license
}

/**
 * Hand a seat back.
 *
 * A machine that died, was replaced, or was set up by mistake goes on holding
 * one of the licence's seats until somebody says otherwise. The row stays —
 * it is part of the account's history, and it is how you can see that a shop
 * has been through four machines this year — but it stops counting, so the
 * replacement can activate.
 */
export async function releaseInstall(installId: string, note?: string) {
  await requireAdmin()

  const install = await prisma.licenseInstall.update({
    where: { id: installId },
    data: { releasedAt: new Date(), releaseNote: note?.trim() || null },
    include: { license: { select: { tenantId: true } } }
  })

  revalidatePath(`/dashboard/tenants/${install.license.tenantId}`)
  revalidatePath('/dashboard/licenses')
  return install
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

  // Revoke the old licence so the machine it was bound to stops syncing. The
  // same three fields as revokeLicense — status alone changes nothing.
  await prisma.license.update({
    where: { id: oldLicenseId },
    data: {
      status: 'REVOKED',
      revokedAt: new Date(),
      revokeReason: 'Transferred to a replacement machine',
      refreshTokenSeq: { increment: 1 }
    }
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
