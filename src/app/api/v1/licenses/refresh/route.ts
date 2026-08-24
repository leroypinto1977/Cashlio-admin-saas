// Daily license refresh. main-local calls this once per day; on success it
// receives a fresh JWT good for 7 days plus an authoritative `serverNow`
// timestamp. If refresh fails for `gracePeriodDays` consecutive days
// main-local hard-locks billing until reconnect.

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { signLicenseJwt, type LicenseClaims } from '@/lib/licenseJwt'
import { claimSeat } from '@/lib/licenseSeats'

const REFRESH_JWT_TTL_DAYS = 7

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization'
}

function jsonError(error: string, status: number, extra?: Record<string, unknown>) {
  return NextResponse.json({ success: false, error, ...extra }, { status, headers: corsHeaders })
}

export async function POST(req: NextRequest) {
  try {
    const { licenseKey, hardwareId } = await req.json()
    if (!licenseKey || !hardwareId) return jsonError('MISSING_PARAMETERS', 400)

    const license = await prisma.license.findUnique({ where: { licenseKey } })
    if (!license) return jsonError('LICENSE_NOT_FOUND', 404)

    // The reason travels with the refusal so the branch server can put it on
    // screen. "Your licence is locked" leaves a cashier with nothing to say to
    // the owner; "Subscription unpaid since March" tells them who to ring.
    if (license.revokedAt || license.status === 'REVOKED') {
      return jsonError('LICENSE_REVOKED', 403, {
        revokedAt: license.revokedAt?.toISOString() ?? null,
        revokeReason: license.revokeReason ?? null
      })
    }
    if (license.status !== 'ACTIVE') return jsonError(`LICENSE_${license.status}`, 403)
    if (!license.expiresAt) return jsonError('LICENSE_NOT_PROVISIONED', 500)
    if (license.expiresAt.getTime() <= Date.now()) {
      // Mark as expired so the dashboard reflects reality
      await prisma.license.update({
        where: { id: license.id },
        data: { status: 'EXPIRED' }
      })
      return jsonError('LICENSE_EXPIRED', 403)
    }

    // Same question as activation, same answer. A machine holding a seat keeps
    // it; a new one takes a free seat or is refused.
    const seat = await claimSeat({
      license,
      hardwareId,
      branchName: license.branchName,
      ip: req.headers.get('x-forwarded-for')
    })
    if (!seat.ok) {
      return jsonError('LICENSE_SEAT_LIMIT', 403, {
        seatsInUse: seat.seatsInUse,
        seatLimit: seat.seatLimit,
        message:
          `This licence covers ${seat.seatLimit} machine${seat.seatLimit === 1 ? '' : 's'} and ` +
          `all ${seat.seatsInUse} are in use. Release one from the dashboard, or upgrade the licence.`
      })
    }

    const jwtTtl = Math.min(
      REFRESH_JWT_TTL_DAYS * 24 * 60 * 60,
      Math.max(60, Math.floor((license.expiresAt.getTime() - Date.now()) / 1000))
    )

    const claims: LicenseClaims = {
      licenseKey: license.licenseKey,
      tenantId: license.tenantId,
      maxBranches: license.maxBranches,
      maxSystemsPerBranch: license.maxSystemsPerBranch,
      expiresAt: license.expiresAt.toISOString(),
      gracePeriodDays: license.gracePeriodDays,
      refreshTokenSeq: license.refreshTokenSeq,
      branchName: license.branchName,
      hardwareId,
      serverNow: new Date().toISOString()
    }
    const jwt = await signLicenseJwt(claims, jwtTtl)

    await prisma.license.update({
      where: { id: license.id },
      data: {
        lastRefreshAt: new Date(),
        lastRefreshIp: req.headers.get('x-forwarded-for') ?? null
      }
    })

    return NextResponse.json(
      {
        success: true,
        jwt,
        serverNow: claims.serverNow,
        expiresAt: claims.expiresAt
      },
      { status: 200, headers: corsHeaders }
    )
  } catch (error) {
    console.error('Refresh Error:', error)
    return jsonError('INTERNAL_SERVER_ERROR', 500)
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders })
}
