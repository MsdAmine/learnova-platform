import { Award, CircleCheck, Circle, Play } from 'lucide-react';

// A static, illustrative preview of the learner experience — modelled on the
// real LearnerDashboard / CoursePlayer surfaces (continue-learning card,
// per-lesson progress, section quiz, certificate) so the hero's right column
// reads as a genuine product snapshot rather than decoration. Deliberately
// carries NO platform metrics (no learner counts, ratings, or reviews): the
// only numbers shown are generic course-structure cues (lessons completed),
// which describe how the product works, not fabricated traction.
//
// aria-hidden: every concept here (progress, quizzes, certificates) is stated
// in real copy elsewhere on the page, so this visual is hidden from the
// accessibility tree to avoid duplicate, confusing screen-reader narration.

const LESSONS = [
  { label: 'Introduction', state: 'done' as const },
  { label: 'Core concepts', state: 'done' as const },
  { label: 'Building your first project', state: 'current' as const },
  { label: 'Going further', state: 'todo' as const },
];

export function HeroProductPreview() {
  return (
    <div
      aria-hidden="true"
      className="relative w-full max-w-[440px] mx-auto select-none"
    >
      {/* Main panel — mirrors the dashboard "Continue learning" card */}
      <div className="rounded-xl border border-border-default bg-surface shadow-layer overflow-hidden">
        {/* Window chrome — signals "this is the product UI" */}
        <div className="flex items-center gap-1.5 px-4 py-3 border-b border-border-default bg-surface-elevated">
          <span className="h-2.5 w-2.5 rounded-full bg-border-hover" />
          <span className="h-2.5 w-2.5 rounded-full bg-border-hover" />
          <span className="h-2.5 w-2.5 rounded-full bg-border-hover" />
          <span className="ml-3 text-caption text-text-muted">My learning</span>
        </div>

        <div className="p-5">
          {/* Course header */}
          <div className="flex items-center gap-3 mb-4">
            <div
              className="h-12 w-12 flex-shrink-0 rounded-md"
              style={{ background: 'linear-gradient(140deg, #032117, #1A3B2E)' }}
            />
            <div className="min-w-0">
              <p className="text-body-sm font-semibold text-text-primary truncate">
                Foundations of Web Development
              </p>
              <p className="text-caption text-text-muted">Continue where you left off</p>
            </div>
          </div>

          {/* Progress */}
          <div className="mb-5">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-caption font-medium text-text-secondary">Course progress</span>
              <span className="text-caption font-semibold text-text-primary">12 of 18 lessons</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-surface-elevated overflow-hidden">
              <div className="h-full rounded-full bg-salem" style={{ width: '67%' }} />
            </div>
          </div>

          {/* Lesson list — section structure cue */}
          <p className="text-caption font-semibold uppercase tracking-[0.04em] text-text-muted mb-2">
            Section 2 · Components &amp; state
          </p>
          <ul className="flex flex-col gap-2.5 mb-5">
            {LESSONS.map((lesson) => (
              <li key={lesson.label} className="flex items-center gap-2.5">
                {lesson.state === 'done' ? (
                  <CircleCheck size={16} className="flex-shrink-0 text-salem" />
                ) : lesson.state === 'current' ? (
                  <Play size={16} className="flex-shrink-0 text-salem" fill="currentColor" />
                ) : (
                  <Circle size={16} className="flex-shrink-0 text-border-hover" />
                )}
                <span
                  className={
                    lesson.state === 'todo'
                      ? 'text-body-sm text-text-muted'
                      : 'text-body-sm text-text-primary'
                  }
                >
                  {lesson.label}
                </span>
                {lesson.state === 'current' && (
                  <span className="ml-auto text-caption font-medium text-salem">In progress</span>
                )}
              </li>
            ))}
          </ul>

          {/* Certificate cue */}
          <div className="flex items-center gap-3 rounded-md border border-border-default bg-surface-elevated px-3 py-3">
            <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md bg-anzac-50">
              <Award size={18} className="text-anzac" />
            </span>
            <div className="min-w-0">
              <p className="text-body-sm font-semibold text-text-primary">Certificate of completion</p>
              <p className="text-caption text-text-muted">Awarded when you finish the course</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
