import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Bone } from '../../common/skeletons/Bone';
import { CoursePreviewCard } from '../../../features/catalog/components/CoursePreviewCard';
import { CoursePreviewPanel } from '../../../features/catalog/components/CoursePreviewPanel';
import { getPublishedCourses, type CourseCatalogItem } from '../../../api/courses';

const MAX_RECENT = 6;

// Roughly one card-width per click; scrollBy with smooth behavior reads as
// a deliberate "page" of the row rather than a jarring jump.
const SCROLL_STEP = 320;

// Must match the panel's own w-[400px] so the side-placement math below
// reserves exactly the space the panel will actually occupy.
const PANEL_WIDTH = 400;
const PANEL_GAP = 16;
const VIEWPORT_MARGIN = 8;
// Rough ceiling on the popover's rendered height (thumbnail + body text at
// the widths/clamps used in CoursePreviewPanel) — enough to keep it from
// running off the bottom of the viewport without measuring the real node.
const PANEL_MAX_HEIGHT = 420;

type LoadState = 'loading' | 'ready' | 'empty' | 'error';

interface PreviewState {
  course: CourseCatalogItem;
  top: number;
  left: number;
  side: 'left' | 'right';
}

export function RecentCourses() {
  const [state, setState] = useState<LoadState>('loading');
  const [courses, setCourses] = useState<CourseCatalogItem[]>([]);
  const [preview, setPreview] = useState<PreviewState | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLDivElement>(null);

  function scrollByStep(direction: 1 | -1) {
    trackRef.current?.scrollBy({ left: direction * SCROLL_STEP, behavior: 'smooth' });
  }

  // Positions the panel beside the hovered/focused card: to its right by
  // default, flipping to its left when there isn't enough room before the
  // viewport edge, then clamped so it can never push past either edge (the
  // clamp is what guarantees no horizontal page overflow, regardless of
  // which side was chosen). Coordinates are computed in viewport space (where
  // the "does it fit" check is meaningful) and converted to section-relative
  // space at the end, since the panel is positioned absolutely within the
  // section container, not the viewport.
  function showPreview(course: CourseCatalogItem, cardRect: DOMRect) {
    const sectionRect = sectionRef.current?.getBoundingClientRect();
    if (!sectionRect) return;

    const fitsRight = cardRect.right + PANEL_GAP + PANEL_WIDTH <= window.innerWidth - VIEWPORT_MARGIN;
    const side: 'left' | 'right' = fitsRight ? 'right' : 'left';
    let leftInViewport = fitsRight
      ? cardRect.right + PANEL_GAP
      : cardRect.left - PANEL_GAP - PANEL_WIDTH;
    leftInViewport = Math.max(
      VIEWPORT_MARGIN,
      Math.min(leftInViewport, window.innerWidth - PANEL_WIDTH - VIEWPORT_MARGIN),
    );

    // Anchored near the card's top edge (so the notch lines up with where it
    // visually meets the card), then clamped so a card near the bottom of the
    // viewport can't push the popover off-screen.
    const topInViewport = Math.max(
      VIEWPORT_MARGIN,
      Math.min(cardRect.top, window.innerHeight - PANEL_MAX_HEIGHT - VIEWPORT_MARGIN),
    );

    setPreview({
      course,
      top: topInViewport - sectionRect.top,
      left: leftInViewport - sectionRect.left,
      side,
    });
  }

  // Cleared by course id rather than unconditionally, so a leave/blur on the
  // card that's losing hover/focus can't stomp on a different card that has
  // already taken over (the two events don't always land in a guaranteed order).
  function hidePreview(course: CourseCatalogItem) {
    setPreview((prev) => (prev?.course.id === course.id ? null : prev));
  }

  useEffect(() => {
    let cancelled = false;
    getPublishedCourses()
      .then((data) => {
        if (cancelled) return;
        if (data.length === 0) {
          setState('empty');
          return;
        }
        const sorted = [...data].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
        setCourses(sorted.slice(0, MAX_RECENT));
        setState('ready');
      })
      .catch(() => {
        if (!cancelled) setState('error');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Discovery preview degrades silently: an empty catalog or a failed
  // background fetch omits the section rather than showing a broken-looking
  // panel on the public marketing surface. The full catalog at /courses
  // already owns the "no courses available yet" / "could not load" states.
  if (state === 'empty' || state === 'error') return null;

  return (
    <section aria-labelledby="recent-courses-heading" className="bg-bg-base py-12 lg:py-16">
      <div ref={sectionRef} className="relative px-6 md:px-12 lg:px-16 max-w-container mx-auto">
        <div className="flex items-center justify-between gap-4 mb-6">
          <h2 id="recent-courses-heading" className="text-headline text-text-primary">
            Recently added courses
          </h2>
          <div className="flex items-center gap-3">
            <Link
              to="/courses"
              className="text-body-sm font-medium text-salem hover:text-salem-400 motion-safe:transition-colors duration-fast rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-salem whitespace-nowrap"
            >
              View all courses <span aria-hidden="true">→</span>
            </Link>
            {state === 'ready' && (
              <div className="hidden sm:flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => scrollByStep(-1)}
                  aria-label="Scroll to previous courses"
                  className="inline-flex items-center justify-center w-9 h-9 rounded-md border border-border-default bg-surface text-text-primary hover:bg-surface-elevated motion-safe:transition-colors duration-fast focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-salem"
                >
                  <ChevronLeft className="w-4 h-4" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => scrollByStep(1)}
                  aria-label="Scroll to next courses"
                  className="inline-flex items-center justify-center w-9 h-9 rounded-md border border-border-default bg-surface text-text-primary hover:bg-surface-elevated motion-safe:transition-colors duration-fast focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-salem"
                >
                  <ChevronRight className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            )}
          </div>
        </div>

        {state === 'loading' ? (
          <div aria-hidden="true" className="flex gap-4 overflow-x-hidden">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="flex-shrink-0 w-[260px] sm:w-[300px] lg:w-[320px] rounded-lg overflow-hidden border border-border-default bg-surface"
              >
                <Bone className="aspect-video w-full rounded-none" />
                <div className="p-4 flex flex-col gap-2">
                  <Bone className="h-3 w-1/3" />
                  <Bone className="h-4 w-3/4" />
                  <Bone className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div
            ref={trackRef}
            className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2 -mx-6 px-6 md:-mx-12 md:px-12 lg:-mx-16 lg:px-16 scroll-smooth"
          >
            {courses.map((course) => (
              <div
                key={course.id}
                className="flex-shrink-0 snap-start w-[260px] sm:w-[300px] lg:w-[320px]"
              >
                <CoursePreviewCard
                  course={course}
                  onShowPreview={(cardRect) => showPreview(course, cardRect)}
                  onHidePreview={() => hidePreview(course)}
                />
              </div>
            ))}
          </div>
        )}

        {/* Absolutely positioned within the relative section container above
            (not inside the overflow-x-auto track), so it can float beside the
            hovered/focused card without ever being clipped by the slider's
            scroll container. Hidden below `lg` — at 768px-wide tablet a
            400px-wide popover next to a card leaves no margin, so the
            full-card link is the only interaction below desktop width. */}
        {preview && (
          <div
            className="hidden lg:block absolute z-20 motion-safe:animate-auth-enter"
            style={{ top: preview.top, left: preview.left }}
          >
            <CoursePreviewPanel course={preview.course} side={preview.side} />
          </div>
        )}
      </div>
    </section>
  );
}
