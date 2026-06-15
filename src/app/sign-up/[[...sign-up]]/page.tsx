import Link from 'next/link'

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg)]">
      <div className="w-full max-w-sm rounded-lg border border-[var(--border)] bg-[var(--surface)] p-8 shadow-lg">
        <h1 className="mb-6 text-center text-2xl font-bold text-[var(--fg)]">
          Sign Up
        </h1>
        <p className="mb-6 text-center text-sm text-[var(--fg-muted)]">
          Authentication will be configured with Clerk in a later phase.
        </p>
        <Link
          href="/dashboard"
          className="block w-full rounded-[var(--radius-md)] bg-[var(--primary)] py-2 text-center text-white hover:bg-[var(--primary-hover)]"
        >
          Continue to Dashboard
        </Link>
      </div>
    </div>
  )
}
