import Link from 'next/link'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold text-[var(--primary)]">ContentFlow</h1>
      <p className="mt-4 text-lg text-[var(--fg-weak)]">
        Editorial content planner for teams
      </p>
      <Link
        href="/dashboard"
        className="mt-8 rounded-[var(--radius-md)] bg-[var(--primary)] px-6 py-3 text-white hover:bg-[var(--primary-hover)]"
      >
        Get Started
      </Link>
    </main>
  )
}
