const testimonials = [
  {
    quote: "ContentFlow replaced our spreadsheet + Trello + calendar mess with one tool. Our team's content output doubled in the first month.",
    name: "Sarah Chen",
    role: "Head of Content, GrowthLab",
    avatar: "SC",
  },
  {
    quote: "The AI suggestions are genuinely useful — not gimmicky. It helps us write better headlines and tag content more consistently.",
    name: "Marcus Rodriguez",
    role: "Marketing Director, ScaleUp Inc.",
    avatar: "MR",
  },
  {
    quote: "Finally, a content tool that actually understands editorial workflows. The calendar view alone saves us hours every week.",
    name: "Priya Sharma",
    role: "Editor-in-Chief, Digital Daily",
    avatar: "PS",
  },
];

const avatarColors = [
  'bg-[var(--avatar-1)]',
  'bg-[var(--avatar-2)]',
  'bg-[var(--avatar-3)]',
];

export function Testimonials() {
  return (
    <section className="bg-[var(--bg)] py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-[var(--fg)] sm:text-4xl">
            Loved by content teams
          </h2>
          <p className="mt-4 text-lg text-[var(--fg-weak)]">
            See what teams are saying about ContentFlow.
          </p>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((t, i) => (
            <div
              key={t.name}
              className="flex flex-col rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6"
            >
              <div className="mb-4 flex gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg key={star} className="h-4 w-4 text-[var(--accent)]" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                ))}
              </div>
              <blockquote className="flex-1 text-sm leading-relaxed text-[var(--fg)]">
                &ldquo;{t.quote}&rdquo;
              </blockquote>
              <div className="mt-6 flex items-center gap-3 border-t border-[var(--border)] pt-4">
                <div className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold text-white ${avatarColors[i]}`}>
                  {t.avatar}
                </div>
                <div>
                  <div className="text-sm font-medium text-[var(--fg)]">{t.name}</div>
                  <div className="text-xs text-[var(--fg-muted)]">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
