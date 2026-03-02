'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from '@/lib/auth-client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { error: signInError } = await signIn.email({
        email,
        password,
        callbackURL: '/dashboard',
      })

      if (signInError) {
        setError(signInError.message || 'Invalid credentials. Please try again.')
      } else {
        router.push('/dashboard')
        router.refresh()
      }
    } catch {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-screen w-screen items-center justify-center bg-zinc-50">
      <div className="w-full max-w-[400px] px-4 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">System Admin</h1>
          <p className="text-sm text-muted-foreground">Sign in to manage licenses and tenants</p>
        </div>
        
        <Card className="border-border shadow-sm bg-white">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl">Authentication</CardTitle>
            <CardDescription>
              Enter your staff credentials
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@cashlio.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-white"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-white"
                  required
                />
              </div>
              {error && (
                <p className="rounded-md bg-destructive/15 px-3 py-2 text-sm text-destructive border border-destructive/20 font-medium tracking-tight">
                  {error}
                </p>
              )}
              <Button
                type="submit"
                className="w-full font-medium"
                disabled={loading}
              >
                {loading ? 'Authenticating...' : 'Sign In'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
