// Ed25519-signed license JWTs (Phase 4: License Hardening).
//
// The private key lives ONLY here on admin-saas. main-local holds the
// matching public key — it can verify signatures but cannot forge new ones,
// so a leaked main-local binary or DB does not let an attacker mint licenses.
//
// Key format: base64-encoded raw DER (PKCS8 private / SPKI public). Generate
// with `node scripts/gen-license-keys.js`.

import { SignJWT, jwtVerify } from 'jose'
import { createPrivateKey, createPublicKey, KeyObject } from 'node:crypto'

let cachedPrivateKey: KeyObject | null = null

function getPrivateKey(): KeyObject {
  if (cachedPrivateKey) return cachedPrivateKey
  const b64 = process.env.LICENSE_PRIVATE_KEY
  if (!b64) {
    throw new Error('LICENSE_PRIVATE_KEY missing — run scripts/gen-license-keys.js')
  }
  const der = Buffer.from(b64, 'base64')
  cachedPrivateKey = createPrivateKey({ key: der, format: 'der', type: 'pkcs8' })
  return cachedPrivateKey
}

export type LicenseClaims = {
  // Identity
  licenseKey: string
  tenantId: string
  // Capacity
  maxBranches: number
  maxSystemsPerBranch: number
  // Status snapshot — hard limits the offline copy should respect
  expiresAt: string
  gracePeriodDays: number
  refreshTokenSeq: number
  branchName: string | null
  // Hardware binding (so a copied license can't run elsewhere)
  hardwareId: string
  // Server's authoritative time at signing — terminals use this as a clock floor
  serverNow: string
}

/**
 * Sign a license JWT with Ed25519. The token's exp is a SHORT window (default
 * 7 days) — the shop refreshes daily and that refresh is what keeps them
 * licensed. If refresh fails for `gracePeriodDays`, main-local hard-locks.
 */
export async function signLicenseJwt(
  claims: LicenseClaims,
  expSeconds: number
): Promise<string> {
  return await new SignJWT({ ...claims })
    .setProtectedHeader({ alg: 'EdDSA' })
    .setIssuedAt()
    .setExpirationTime(`${expSeconds}s`)
    .sign(getPrivateKey())
}

/**
 * Verify-locally helper for tests. main-local has its own verifier using only
 * the public key — see main-local/src/main/licenseGuard.ts.
 */
export async function verifyLicenseJwtAdminSide(token: string): Promise<LicenseClaims> {
  const b64 = process.env.LICENSE_PRIVATE_KEY
  if (!b64) throw new Error('LICENSE_PRIVATE_KEY missing')
  const priv = createPrivateKey({
    key: Buffer.from(b64, 'base64'),
    format: 'der',
    type: 'pkcs8'
  })
  const pub = createPublicKey(priv)
  const { payload } = await jwtVerify(token, pub)
  return payload as unknown as LicenseClaims
}
