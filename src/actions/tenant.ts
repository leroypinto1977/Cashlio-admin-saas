'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function createTenant(formData: FormData) {
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
