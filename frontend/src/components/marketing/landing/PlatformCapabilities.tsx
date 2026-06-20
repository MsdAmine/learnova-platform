import { Award, BookOpen, ClipboardCheck, TrendingUp } from 'lucide-react';

// Lists only capabilities that are actually shipped end-to-end today.
// Live sessions are intentionally excluded: per CURRENT_STATE.md, LiveSessionsPage
// is a frontend placeholder with no backend, so listing it here would be a fake claim.
const CAPABILITIES = [
  {
    Icon: BookOpen,
    title: 'Structured courses',
    body: 'Organized by category and skill level.',
  },
  {
    Icon: ClipboardCheck,
    title: 'Quizzes',
    body: "Test what you've learned as you go.",
  },
  {
    Icon: TrendingUp,
    title: 'Progress tracking',
    body: 'Pick up exactly where you left off.',
  },
  {
    Icon: Award,
    title: 'Certificates',
    body: 'Earn proof of completion.',
  },
] as const;

export function PlatformCapabilities() {
  return (
    <section aria-labelledby="capabilities-heading" className="bg-surface-elevated py-12 lg:py-16">
      <div className="px-6 md:px-12 lg:px-16 max-w-container mx-auto">
        <h2 id="capabilities-heading" className="text-headline text-text-primary mb-8">
          What you get with Learnova
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {CAPABILITIES.map(({ Icon, title, body }) => (
            <div key={title}>
              <Icon size={22} className="text-salem mb-3" aria-hidden="true" />
              <h3 className="text-body-sm font-semibold text-text-primary mb-1">{title}</h3>
              <p className="text-caption text-text-secondary">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
