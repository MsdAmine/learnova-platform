import { Link } from 'react-router-dom';
import { CircleCheck, GraduationCap } from 'lucide-react';
import { Button } from '../../ui/Button';

// Only lists instructor capabilities that ship end-to-end today: course +
// section/lesson authoring and quiz authoring (per the instructor API surface).
// Live sessions (no backend) and learner analytics (no instructor-facing
// endpoint) are deliberately omitted so the pitch stays honest.
const INSTRUCTOR_POINTS = [
  'Build courses with structured sections and lessons',
  'Create quizzes to assess what learners take in',
  'Publish to a growing public course catalog',
] as const;

export function InstructorCta() {
  return (
    <section aria-labelledby="instructor-cta-heading" className="bg-surface-elevated py-14 lg:py-20">
      <div className="px-6 md:px-12 lg:px-16 max-w-container mx-auto">
        <div className="grid md:grid-cols-2 rounded-xl border border-border-default overflow-hidden bg-surface">

          {/* ── Left: the pitch ─────────────────────────────────────────── */}
          <div className="p-8 lg:p-10 flex flex-col justify-center">
            <span
              className="flex h-11 w-11 items-center justify-center rounded-md bg-salem-50 mb-5"
              aria-hidden="true"
            >
              <GraduationCap size={22} className="text-salem" />
            </span>

            <h2 id="instructor-cta-heading" className="text-headline text-text-primary">
              Share what you know
            </h2>
            <p className="text-body-sm text-text-secondary mt-2 max-w-[46ch]">
              Apply to teach on Learnova and turn your expertise into structured,
              published courses.
            </p>

            <ul className="mt-6 flex flex-col gap-3">
              {INSTRUCTOR_POINTS.map((point) => (
                <li key={point} className="flex items-start gap-2.5">
                  <CircleCheck size={18} className="flex-shrink-0 text-salem mt-0.5" aria-hidden="true" />
                  <span className="text-body-sm text-text-primary">{point}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* ── Right: the action ───────────────────────────────────────── */}
          <div className="p-8 lg:p-10 flex flex-col justify-center gap-4 border-t md:border-t-0 md:border-l border-border-default bg-bg-base">
            <p className="text-title-sm font-semibold text-text-primary">
              Ready to teach your first course?
            </p>
            <p className="text-body-sm text-text-secondary">
              Create a free account to apply. Instructor access is granted after a
              quick review by our team.
            </p>
            <div>
              <Button variant="secondary" size="md" asChild>
                <Link to="/register">Become an instructor</Link>
              </Button>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
