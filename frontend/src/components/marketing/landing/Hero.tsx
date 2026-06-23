import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { HeroProductPreview } from './HeroProductPreview';
import type { CategoryResponse } from '../../../api/categories';
import heroBackground from '../../../assets/hero-background.jpg';

// Checked once at module load; stable for the lifetime of the page.
const prefersReduced =
  typeof window !== 'undefined'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : true;

// Stagger indices: 0 = headline, 1 = body, 2 = search form, 3 = chips,
// 4 = product preview (enters last so the eye lands on the search first).
const DURATION = 300;
const STAGGER = 80;

// A handful of real category shortcuts beneath the search bar — capped so the
// hero stays calm. The fuller, icon-led category browse lives one scroll down
// in CategoryShortcutRow; /courses is the unbounded escape hatch.
const MAX_HERO_CHIPS = 6;

interface HeroProps {
  categories: CategoryResponse[];
}

export function Hero({ categories }: HeroProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  // Start visible immediately if reduced-motion is requested or unavailable.
  const [visible, setVisible] = useState(prefersReduced);

  useEffect(() => {
    if (prefersReduced) return;
    const id = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(id);
  }, []);

  function animStyle(index: number): React.CSSProperties {
    if (prefersReduced) return {};
    return {
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(8px)',
      transition: `opacity ${DURATION}ms var(--ease-standard) ${index * STAGGER}ms, transform ${DURATION}ms var(--ease-standard) ${index * STAGGER}ms`,
    };
  }

  function handleSearchSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = query.trim();
    navigate(trimmed ? `/courses?q=${encodeURIComponent(trimmed)}` : '/courses');
  }

  const chips = categories.slice(0, MAX_HERO_CHIPS);

  return (
    <section
      id="hero-section"
      aria-labelledby="hero-heading"
      className="w-full bg-salem pt-[100px] pb-16 lg:pt-[128px] lg:pb-24"
    >
      <div className="px-6 md:px-12 lg:px-16 max-w-container-wide mx-auto w-full">
        <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,460px)] gap-12 xl:gap-20 lg:items-center">

          {/* ── Left: headline + search ─────────────────────────────────── */}
          <div className="text-left">
            <h1
              id="hero-heading"
              className="text-display text-white max-w-[600px]"
              style={animStyle(0)}
            >
              Find the course that moves you forward
            </h1>

            <p
              className="text-body-lg text-on-dark mt-6 max-w-[520px]"
              style={animStyle(1)}
            >
              Search structured courses by topic, skill, or instructor. Track your
              progress and earn a certificate when you finish.
            </p>

            <form
              role="search"
              aria-label="Search courses"
              onSubmit={handleSearchSubmit}
              className="mt-8 flex flex-col sm:flex-row gap-3 w-full max-w-[560px]"
              style={animStyle(2)}
            >
              <label htmlFor="hero-search" className="sr-only">
                Search courses, topics, or instructors
              </label>
              <div className="flex-1 min-w-0">
                <Input
                  id="hero-search"
                  type="search"
                  placeholder="Search courses, topics, or instructors"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full text-body-lg py-4 px-5"
                />
              </div>
              <Button type="submit" variant="inverted" size="lg" className="flex-shrink-0">
                Search
              </Button>
            </form>

            {chips.length > 0 && (
              <div className="mt-6 max-w-[560px]" style={animStyle(3)}>
                <p className="text-body-sm font-medium text-on-dark mb-2">Browse by category</p>
                <div className="flex flex-wrap items-center gap-2">
                  {chips.map((category) => (
                    <Link
                      key={category.id}
                      to={`/courses?category=${encodeURIComponent(category.name)}`}
                      aria-label={`Browse ${category.name} courses`}
                      className="inline-flex items-center rounded-full border border-white/30 bg-white/10 px-3 py-1.5 text-body-sm font-medium text-on-dark hover:bg-white/15 motion-safe:transition-colors duration-fast focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                    >
                      {category.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-8" style={animStyle(3)}>
              <Link
                to="/register"
                className="text-body-sm text-on-dark hover:text-white underline-offset-4 hover:underline motion-safe:transition-colors duration-fast rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                Want to teach? Create an account to apply.
              </Link>
            </div>
          </div>

          {/* ── Right: product preview ──────────────────────────────────── */}
          {/* Hidden below lg so the mobile hero stays focused on the search */}
          {/* (the preview would only add scroll length on small screens). */}
          <div className="hidden lg:block" style={animStyle(4)}>
            <HeroProductPreview />
          </div>

        </div>
      </div>
    </section>
  );
}
