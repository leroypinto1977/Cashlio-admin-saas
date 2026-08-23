'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/require-admin'

export async function createTenant(formData: FormData) {
  await requireAdmin()

  const ownerName = formData.get('ownerName') as string
  const companyName = formData.get('companyName') as string
  const contactEmail = formData.get('contactEmail') as string

  if (!ownerName || !companyName || !contactEmail) {
    throw new Error('Missing fields')
  }

  const tenant = await prisma.tenant.create({
    data: {
      ownerName,
      companyName,
      contactEmail,
    }
  })

  revalidatePath('/dashboard/tenants')
  return tenant
}
