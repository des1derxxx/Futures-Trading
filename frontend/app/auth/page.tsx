import type { Metadata } from 'next'
import AuthForm from './AuthForm'

export const metadata: Metadata = {
  title: 'Sign In — FuturesX',
}

export default function AuthPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4">
      <AuthForm />
    </div>
  )
}
