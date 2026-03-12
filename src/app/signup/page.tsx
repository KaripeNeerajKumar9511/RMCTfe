"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import api, { ensureCsrfCookie } from "@/lib/api"

export default function SignupPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [csrfReady, setCsrfReady] = useState(false)

  useEffect(() => {
    ensureCsrfCookie().then(() => setCsrfReady(true)).catch(() => setError("Could not reach server"))
  }, [])

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters")
      return
    }
    setLoading(true)
    try {
      await api.post("/api/signup/", {
        name: name.trim(),
        email: email.trim(),
        password,
        password_confirm: confirmPassword,
      })
      window.location.href = "/login"
    } catch (err: unknown) {
      const msg = err && typeof err === "object" && "response" in err
        ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
        : "Signup failed"
      setError(msg || "Signup failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="w-full max-w-md">
        <div className="rounded-2xl bg-white/5 border border-white/10 shadow-2xl p-8 backdrop-blur-sm">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-white tracking-tight">Create account</h1>
            <p className="text-slate-400 text-sm mt-1">Join the RMCT platform</p>
          </div>

          <form onSubmit={handleSignup} className="space-y-5">
            {error && (
              <div className="rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-sm px-4 py-3">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-1.5">
                Full name
              </label>
              <input
                id="name"
                type="text"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg bg-white/5 border border-white/10 text-white placeholder-slate-500 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50"
                placeholder="Jane Doe"
                required
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-1.5">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg bg-white/5 border border-white/10 text-white placeholder-slate-500 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50"
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-1.5">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg bg-white/5 border border-white/10 text-white placeholder-slate-500 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50"
                placeholder="••••••••"
                required
                minLength={8}
              />
              <p className="text-xs text-slate-500 mt-1">At least 8 characters</p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-300 mb-1.5">
                Confirm password
              </label>
              <input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full rounded-lg bg-white/5 border border-white/10 text-white placeholder-slate-500 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={!csrfReady || loading}
              className="w-full rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-3 px-4 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Creating account…" : "Sign up"}
            </button>
          </form>

          <p className="text-center text-slate-400 text-sm mt-6">
            Already have an account?{" "}
            <Link href="/login" className="text-emerald-400 hover:text-emerald-300 font-medium">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
