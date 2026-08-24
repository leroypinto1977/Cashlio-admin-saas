/**
 * Seat accounting for licences, against a real database.
 *
 * The rule this pins down is the one that used to be missing entirely: a
 * licence covers a fixed number of machines, a machine that already holds a
 * seat keeps it, and a new machine is refused once they are all taken —
 * rather than silently taking the binding over from whoever had it.
 */
const { PrismaClient } = require('@prisma/client')
const path = require('path')
const esbuild = require('esbuild')
const fs = require('fs')

const prisma = new PrismaClient()

const buildDir = path.join(__dirname, '.build')
fs.mkdirSync(buildDir, { recursive: true })
esbuild.buildSync({
  entryPoints: [path.join(__dirname, '..', 'src', 'lib', 'licenseSeats.ts')],
  outfile: path.join(buildDir, 'seats.cjs'),
  bundle: true, platform: 'node', format: 'cjs',
  external: ['@prisma/client'],
  alias: { '@': path.join(__dirname, '..', 'src') }
})
const { claimSeat, countActiveSeats } = require(path.join(buildDir, 'seats.cjs'))

let pass = 0, fail = 0
const t = (name, cond, detail) => {
  if (cond) { pass++; console.log(`  ok   ${name}`) }
  else { fail++; console.log(`  FAIL ${name}`, detail === undefined ? '' : JSON.stringify(detail)) }
}

;(async () => {
  await prisma.licenseInstall.deleteMany({})
  await prisma.license.deleteMany({})
  await prisma.tenant.deleteMany({})

  const tenant = await prisma.tenant.create({
    data: { ownerName: 'Owner', companyName: 'Seat Test Traders', contactEmail: 'seats@test.local' }
  })
  const mk = (key, maxBranches) => prisma.license.create({
    data: { tenantId: tenant.id, licenseKey: key, maxBranches, maxSystemsPerBranch: 3,
            validDurationDays: 365, status: 'ACTIVE', activatedAt: new Date(),
            expiresAt: new Date(Date.now() + 365 * 86400000) }
  })

  console.log('\n— a single-machine licence —')
  {
    const lic = await mk('SEAT-ONE', 1)
    const a = await claimSeat({ license: lic, hardwareId: 'machine-a' })
    t('the first machine gets the seat', a.ok && a.isNew, a)

    const again = await claimSeat({ license: lic, hardwareId: 'machine-a' })
    t('the same machine coming back keeps it', again.ok && !again.isNew, again)
    t('...and does not consume a second seat', again.ok && again.seatsInUse === 1, again)

    const b = await claimSeat({ license: lic, hardwareId: 'machine-b' })
    t('a second machine is refused', !b.ok && b.error === 'LICENSE_SEAT_LIMIT', b)
    t('...and is told what is in use', !b.ok && b.seatsInUse === 1 && b.seatLimit === 1, b)

    const stillA = await claimSeat({ license: lic, hardwareId: 'machine-a' })
    t('the machine that had it is unaffected', stillA.ok, stillA)
    t('...which is the point: refusing the newcomer, not passing the licence on',
      (await countActiveSeats(lic.id)) === 1)
  }

  console.log('\n— releasing a seat —')
  {
    const lic = await mk('SEAT-RELEASE', 1)
    await claimSeat({ license: lic, hardwareId: 'old-pc' })
    const blocked = await claimSeat({ license: lic, hardwareId: 'new-pc' })
    t('the replacement is refused while the old machine holds the seat', !blocked.ok, blocked)

    await prisma.licenseInstall.updateMany({
      where: { licenseId: lic.id, hardwareId: 'old-pc' },
      data: { releasedAt: new Date(), releaseNote: 'Machine replaced' }
    })
    const now = await claimSeat({ license: lic, hardwareId: 'new-pc' })
    t('once released, the replacement gets in', now.ok && now.isNew, now)
    t('the released row is kept for the history',
      (await prisma.licenseInstall.count({ where: { licenseId: lic.id } })) === 2)
    t('...but stops counting', (await countActiveSeats(lic.id)) === 1)

    // The retired machine coming back must not sneak past the limit.
    const zombie = await claimSeat({ license: lic, hardwareId: 'old-pc' })
    t('a released machine cannot just reclaim its seat', !zombie.ok, zombie)
  }

  console.log('\n— a multi-branch licence —')
  {
    const lic = await mk('SEAT-THREE', 3)
    for (const id of ['branch-1', 'branch-2', 'branch-3']) {
      const r = await claimSeat({ license: lic, hardwareId: id, branchName: id })
      t(`${id} is admitted`, r.ok, r)
    }
    t('all three seats are counted', (await countActiveSeats(lic.id)) === 3)
    const fourth = await claimSeat({ license: lic, hardwareId: 'branch-4' })
    t('the fourth is refused', !fourth.ok && fourth.seatLimit === 3, fourth)

    // Every branch refreshing repeatedly must not inflate the count.
    for (let i = 0; i < 5; i++) {
      for (const id of ['branch-1', 'branch-2', 'branch-3']) {
        await claimSeat({ license: lic, hardwareId: id })
      }
    }
    t('repeated refreshes do not create extra rows', (await countActiveSeats(lic.id)) === 3)
  }

  console.log('\n— seats are per licence —')
  {
    const a = await mk('SEAT-ISO-A', 1)
    const b = await mk('SEAT-ISO-B', 1)
    const ra = await claimSeat({ license: a, hardwareId: 'shared-machine' })
    const rb = await claimSeat({ license: b, hardwareId: 'shared-machine' })
    t('one machine can hold a seat on two different licences', ra.ok && rb.ok, { ra, rb })
  }

  console.log(`\n${pass} passed, ${fail} failed`)
  await prisma.$disconnect()
  fs.rmSync(buildDir, { recursive: true, force: true })
  process.exit(fail === 0 ? 0 : 1)
})().catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1) })
