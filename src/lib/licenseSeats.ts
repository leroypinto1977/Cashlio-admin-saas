import { prisma } from '@/lib/prisma'
import type { License } from '@prisma/client'

/**
 * Deciding whether a machine may run a licence.
 *
 * Both the activation and the refresh endpoints ask the same question, and
 * they used to answer it differently: activation overwrote a single
 * `macAddress` column, while refresh compared against it. So a second machine
 * activating simply took the binding over, and the first one then failed its
 * refresh — a licence silently played pass-the-parcel between machines
 * instead of either allowing or refusing the second one.
 *
 * A machine that already holds a seat keeps it. A new machine takes a free
 * seat if there is one, and is refused if there isn't, naming what is in use
 * so the shop can be told what to do about it.
 */

export type SeatResult =
  | { ok: true; installId: string; seatsInUse: number; seatLimit: number; isNew: boolean }
  | { ok: false; error: 'LICENSE_SEAT_LIMIT'; seatsInUse: number; seatLimit: number }

export async function claimSeat(input: {
  license: License
  hardwareId: string
  branchName?: string | null
  ip?: string | null
}): Promise<SeatResult> {
  const { license, hardwareId } = input
  const seatLimit = Math.max(1, license.maxBranches)

  const existing = await prisma.licenseInstall.findUnique({
    where: { licenseId_hardwareId: { licenseId: license.id, hardwareId } }
  })

  // Already ours, and not handed back: just note that it is still alive.
  if (existing && !existing.releasedAt) {
    await prisma.licenseInstall.update({
      where: { id: existing.id },
      data: {
        lastSeenAt: new Date(),
        lastSeenIp: input.ip ?? null,
        branchName: input.branchName ?? existing.branchName
      }
    })
    const seatsInUse = await countActiveSeats(license.id)
    return { ok: true, installId: existing.id, seatsInUse, seatLimit, isNew: false }
  }

  // A new machine, or one whose seat was released and is now coming back.
  // Count first so a released row doesn't get a seat that isn't there.
  const seatsInUse = await countActiveSeats(license.id)
  if (seatsInUse >= seatLimit) {
    return { ok: false, error: 'LICENSE_SEAT_LIMIT', seatsInUse, seatLimit }
  }

  const install = existing
    ? await prisma.licenseInstall.update({
        where: { id: existing.id },
        data: {
          releasedAt: null,
          releaseNote: null,
          lastSeenAt: new Date(),
          lastSeenIp: input.ip ?? null,
          branchName: input.branchName ?? existing.branchName
        }
      })
    : await prisma.licenseInstall.create({
        data: {
          licenseId: license.id,
          hardwareId,
          branchName: input.branchName ?? null,
          lastSeenIp: input.ip ?? null
        }
      })

  return { ok: true, installId: install.id, seatsInUse: seatsInUse + 1, seatLimit, isNew: true }
}

export function countActiveSeats(licenseId: string): Promise<number> {
  return prisma.licenseInstall.count({ where: { licenseId, releasedAt: null } })
}
