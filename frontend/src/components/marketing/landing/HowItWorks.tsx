import { Search, Layers, ClipboardCheck, Award, type LucideIcon } from 'lucide-react';

// A four-step workflow describing the actual learner journey on Learnova —
// every step maps to a shipped capability (catalog search, sectioned course
// content, quiz attempts, certificate issuance). No live sessions here: that
// surface has no backend yet, so claiming it as a step would be a fake promise.

interface Step {
  Icon: LucideIcon;
  title: string;
  body: string;
}

const STEPS: Step[] = [
  {
    Icon: Search,
    title: 'Find a course',
    body: 'Search the catalog by topic, skill, or instructor to find the right fit.',
  },
  {
    Icon: Layers,
    title: 'Learn by sections',
    body: 'Work through structured sections and lessons at your own pace.',
  },
  {
    Icon: ClipboardCheck,
    title: 'Practice with quizzes',
    body: 'Check what you have learned with quizzes built into each course.',
  },
  {
    Icon: Award,
    title: 'Earn a certificate',
    body: 'Complete every lesson to earn a certificate of completion.',
  },
];

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      aria-labelledby="how-it-works-heading"
      className="bg-bg-base py-14 lg:py-20 scroll-mt-[var(--nav-height)]"
    >
      <div className="px-6 md:px-12 lg:px-16 max-w-container mx-auto">
        <div className="mb-10 max-w-[640px]">
          <h2 id="how-it-works-heading" className="text-headline text-text-primary">
            How Learnova works
          </h2>
          <p className="text-body-sm text-text-secondary mt-2">
            A clear path from finding a course to earning proof you finished it.
          </p>
        </div>

        <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-10">
          {STEPS.map(({ Icon, title, body }, index) => (
            <li key={title} className="relative flex flex-col">
              {/* Connector line between steps on desktop */}
              {index < STEPS.length - 1 && (
                <span
                  aria-hidden="true"
                  className="hidden lg:block absolute top-5 left-[calc(2.5rem+0.75rem)] right-0 h-px bg-border-default"
                />
              )}

              <div className="flex items-center gap-3 mb-4">
                <span className="relative z-10 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-salem-50">
                  <Icon size={20} className="text-salem" aria-hidden="true" />
                </span>
                <span className="text-caption font-semibold uppercase tracking-[0.04em] text-text-muted">
                  Step {index + 1}
                </span>
              </div>

              <h3 className="text-body font-semibold text-text-primary mb-1">{title}</h3>
              <p className="text-body-sm text-text-secondary max-w-[26ch]">{body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
