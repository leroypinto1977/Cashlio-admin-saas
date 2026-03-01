const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  const passwordHash = await bcrypt.hash('password123', 10)
  
  const admin = await prisma.adminUser.upsert({
    where: { email: 'admin@cashlio.com' },
    update: {},
    create: {
      email: 'admin@cashlio.com',
      name: 'Super Admin',
      passwordHash,
    },
  })

  console.log('Seeded AdminUser:', admin.email)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
