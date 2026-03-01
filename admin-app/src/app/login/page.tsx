'use client'

import { useActionState } from 'react'
import { login } from '@/app/actions/auth'

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(login, undefined)

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50" dir="ltr">
      <div className="bg-white rounded-lg shadow-md p-8 w-full max-w-sm">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">KidTube Admin</h1>
        <p className="text-gray-500 text-sm mb-6">Sign in to your account</p>

        <form action={formAction} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent"
              placeholder="admin@example.com"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent"
              placeholder="••••••••"
            />
          </div>

          {state?.error && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-md">
              {state.error}
            </p>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="w-full py-2 px-4 bg-slate-800 text-white rounded-md text-sm font-medium hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isPending ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}
