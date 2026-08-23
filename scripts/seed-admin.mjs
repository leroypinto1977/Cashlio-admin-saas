/**
 * Creates or updates a console login.
 *
 *   node scripts/seed-admin.mjs <email> <password> [SUPER_ADMIN|SALES_AGENT]
 *
 * Public sign-up is disabled — this console lists every tenant, licence key
 * and customer contact, so accounts are provisioned deliberately rather than
 * self-served. This writes straight to the database using Better-Auth's own
 * password hashing, so it does not need the web server running and does not
 * depend on a sign-up route existing.
 */
import { PrismaClient } from '@prisma/client'
import { hashPassword } from 'better-auth/crypto'
import { randomUUID } from 'crypto'

const [, , emailArg, passwordArg, roleArg] = process.argv
const email = (emailArg ?? '').trim().toLowerCase()
const password = passwordArg ?? ''
const role = roleArg ?? 'SUPER_ADMIN'

if (!email || !password) {
  console.error('Usage: node scripts/seed-admin.mjs <email> <password> [role]')
  process.exit(1)
}
if (password.length < 12) {
  console.error('Choose a password of at least 12 characters — this account can see every customer.')
  process.exit(1)
}
if (!['SUPER_ADMIN', 'SALES_AGENT', 'SUPPORT_AGENT'].includes(role)) {
  console.error(`Unknown role "${role}".`)
  process.exit(1)
}

const prisma = new PrismaClient()
try {
  const now = new Date()
  const hash = await hashPassword(password)

  const user = await prisma.user.upsert({
    where: { email },
    update: { role, updatedAt: now },
    create: {
      id: randomUUID(),
      email,
      name: email.split('@')[0],
      emailVerified: true,
      role,
      createdAt: now,
      updatedAt: now
    }
  })

  // Better-Auth keeps the password on a credential Account row, not the user.
  const credential = await prisma.account.findFirst({
    where: { userId: user.id, providerId: 'credential' }
  })
  if (credential) {
    await prisma.account.update({
      where: { id: credential.id },
      data: { password: hash, updatedAt: now }
    })
    console.log(`Updated ${email} (${role}).`)
  } else {
    await prisma.account.create({
      data: {
        id: randomUUID(),
        accountId: user.id,
        providerId: 'credential',
        userId: user.id,
        password: hash,
        createdAt: now,
        updatedAt: now
      }
    })
    console.log(`Created ${email} (${role}).`)
  }
} finally {
  await prisma.$disconnect()
}
