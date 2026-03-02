const { PrismaClient } = require('@prisma/client')

// Script to create the first admin user via better-auth
// Run AFTER the dev server is started: node scripts/seed-admin.cjs

async function main() {
  const baseUrl = process.env.BETTER_AUTH_URL || 'http://localhost:3000'

  console.log(`Creating user via Better-Auth...`)
  const res = await fetch(`${baseUrl}/api/auth/sign-up/email`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Origin': baseUrl
    },
    body: JSON.stringify({
      name: 'Super Admin',
      email: 'admin@cashlio.com',
      password: 'Admin@123456',
    }),
  })

  const data = await res.json()

  if (res.ok) {
    console.log(`✅ Admin user created!`)
  } else if (data.code?.includes('USER_ALREADY_EXISTS')) {
    console.log(`ℹ️ User already exists. Proceeding to update role...`)
  } else {
    console.error(`❌ Failed:`, data)
    return
  }

  console.log(`Updating role to SUPER_ADMIN via Prisma...`)
  const prisma = new PrismaClient()
  try {
    const user = await prisma.user.update({
      where: { email: 'admin@cashlio.com' },
      data: { role: 'SUPER_ADMIN' }
    })
    console.log(`✅ Admin user role is now ${user.role}`)
    console.log('   Email: admin@cashlio.com')
    console.log('   Password: Admin@123456')
    console.log('\n   ⚠️  Change these credentials after first login!')
  } catch (error) {
    console.error(`❌ Failed to update role via Prisma:`, error.message)
  } finally {
    await prisma.$disconnect()
  }
}

main().catch(console.error)
