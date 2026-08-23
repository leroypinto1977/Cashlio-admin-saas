import { headers } from 'next/headers'
import { auth } from './auth'

/**
 * Authorisation gate for server actions.
 *
 * A `'use server'` export is a public POST endpoint whose id is baked into
 * the client bundle — it is not protected by the dashboard layout's session
 * check, which only decides whether a page renders. Every action that touches
 * a licence or a tenant must call this first; without it, anyone able to load
 * the login page could mint themselves an unlimited licence or revoke a
 * paying customer's.
 */
export async function requireAdmin(): Promise<{ id: string; email: string; role: string }> {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('UNAUTHORIZED')

  const role = (session.user as { role?: string }).role ?? ''
  if (role !== 'SUPER_ADMIN') throw new Error('FORBIDDEN')

  return { id: session.user.id, email: session.user.email, role }
}

/** Read-only pages need a session but not necessarily the admin role. */
export async function requireStaff(): Promise<{ id: string; email: string; role: string }> {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('UNAUTHORIZED')
  return {
    id: session.user.id,
    email: session.user.email,
    role: (session.user as { role?: string }).role ?? ''
  }
}
