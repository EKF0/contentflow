const steps = [
  {
    number: '1',
    title: 'Set up your workspace',
    description: 'Create your workspace, invite your team, and choose a template or start from scratch.',
  },
  {
    number: '2',
    title: 'Plan & collaborate',
    description: 'Map out content ideas in grid view, assign tasks in Kanban, and schedule in calendar view.',
  },
  {
    number: '3',
    title: 'Publish & measure',
    description: 'Track performance with analytics, learn what works, and refine your content strategy.',
  },
];

export function HowItWorks() {
  return (
    <section className="bg-[var(--bg)] py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-[var(--fg)] sm:text-4xl">
            Get started in minutes
          </h2>
          <p className="mt-4 text-lg text-[var(--fg-weak)]">
            Three simple steps to a better content workflow.
          </p>
        </div>

        <div className="mt-14 grid gap-8 sm:grid-cols-3">
          {steps.map((step, i) => (
            <div key={step.number} className="relative text-center">
              {i < steps.length - 1 && (
                <div className="absolute left-1/2 top-8 hidden h-px w-full bg-gradient-to-r from-transparent via-[var(--border)] to-transparent sm:block" />
              )}
              <div className="relative mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full border-2 border-[var(--primary)] bg-[var(--primary-soft)] text-xl font-bold text-[var(--primary)]">
                {step.number}
              </div>
              <h3 className="text-base font-semibold text-[var(--fg)]">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--fg-weak)]">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
