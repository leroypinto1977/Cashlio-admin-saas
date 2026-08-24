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
    const body = await req.json()
    const { licenseKey, hardwareId, branchName } = body
    if (!licenseKey || !hardwareId) return jsonError('MISSING_PARAMETERS', 400)

    const license = await prisma.license.findUnique({ where: { licenseKey } })
    if (!license) return jsonError('LICENSE_NOT_FOUND', 404)

    if (license.revokedAt || license.status === 'REVOKED') {
      return jsonError('LICENSE_REVOKED', 403, {
        revokedAt: license.revokedAt?.toISOString() ?? null,
        revokeReason: license.revokeReason ?? null
      })
    }

    // Which machines may run this licence is decided by the seat count, not by
    // a single column that whichever machine activated last had overwritten.
    const seat = await claimSeat({
      license,
      hardwareId,
      branchName: branchName ?? null,
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

    if (license.status === 'ACTIVE') {
      // Nothing more to do — the seat check above already decided this.
    } else if (license.status === 'PENDING') {
      // First activation — bind hardware, set branch, calculate expiry
      const activatedAt = new Date()
      const expiresAt = new Date(activatedAt)
      expiresAt.setDate(expiresAt.getDate() + license.validDurationDays)
      await prisma.license.update({
        where: { id: license.id },
        data: {
          status: 'ACTIVE',
          // Kept for display: the first machine this licence ran on. The
          // authoritative list is LicenseInstall.
          macAddress: license.macAddress ?? hardwareId,
          branchName: branchName ?? null,
          activatedAt,
          expiresAt
        }
      })
    } else {
      // EXPIRED or other terminal state
      return jsonError(`LICENSE_${license.status}`, 403)
    }

    const fresh = await prisma.license.findUniqueOrThrow({ where: { id: license.id } })
    if (!fresh.expiresAt) return jsonError('LICENSE_NOT_PROVISIONED', 500)

    // The JWT is short-lived; the shop refreshes it daily. The license's
    // hard expiry (fresh.expiresAt) lives inside the claims but the token
    // itself rotates frequently so revocation can take effect quickly.
    const jwtTtl = Math.min(
      REFRESH_JWT_TTL_DAYS * 24 * 60 * 60,
      Math.max(60, Math.floor((fresh.expiresAt.getTime() - Date.now()) / 1000))
    )

    const claims: LicenseClaims = {
      licenseKey: fresh.licenseKey,
      tenantId: fresh.tenantId,
      maxBranches: fresh.maxBranches,
      maxSystemsPerBranch: fresh.maxSystemsPerBranch,
      expiresAt: fresh.expiresAt.toISOString(),
      gracePeriodDays: fresh.gracePeriodDays,
      refreshTokenSeq: fresh.refreshTokenSeq,
      branchName: fresh.branchName,
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
    console.error('Activation Error:', error)
    return jsonError('INTERNAL_SERVER_ERROR', 500)
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders })
}
