import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import type { CategoryResponse } from '../../../api/categories';
import heroBackground from '../../../assets/hero-background.jpg';

// Checked once at module load; stable for the lifetime of the page.
const prefersReduced =
  typeof window !== 'undefined'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : true;

// Stagger indices: 0 = headline, 1 = body, 2 = search form, 3 = chips
const DURATION = 300;
const STAGGER = 80;

// A handful of real category shortcuts beneath the search bar — capped so
// the hero stays calm; the full list is one scroll away in
// CategoryShortcutRow, and /courses is the unbounded escape hatch.
const MAX_HERO_CHIPS = 8;

// Static text-search shortcuts, not backend categories — they route via
// `?q=` (full-text search), never `?category=`, so they never claim to be
// real category data. Shown alongside real category chips when the real
// list is too small to fill the hero's discovery row on its own.
const POPULAR_SEARCHES = [
  'React',
  'JavaScript',
  'Python',
  'UI Design',
  'Data Science',
  'Cybersecurity',
  'Cloud',
  'Business',
];

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
  // Mixing real categories with static search shortcuts only happens when the
  // real list is too small to carry the discovery row on its own — otherwise
  // the popular-search row would dilute genuinely real data with filler.
  const showPopularSearches = chips.length < 6;

  return (
    <section
      id="hero-section"
      aria-labelledby="hero-heading"
      className="relative w-full bg-salem pt-[100px] pb-20 lg:pt-[132px] lg:pb-28 bg-cover bg-center"
      style={{ backgroundImage: `url(${heroBackground})` }}
    >
      <div className="absolute inset-0 bg-salem/70" aria-hidden="true" />
      <div className="relative px-6 md:px-12 lg:px-16 max-w-container-wide mx-auto w-full">
        <div className="text-left">
          <h1
            id="hero-heading"
            className="text-display text-white max-w-[640px]"
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
            className="mt-10 flex flex-col sm:flex-row gap-3 w-full max-w-[1040px]"
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
            <div className="mt-6 max-w-[1040px]" style={animStyle(3)}>
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

          {showPopularSearches && (
            <div className="mt-4 max-w-[1040px]" style={animStyle(3)}>
              <p className="text-body-sm font-medium text-on-dark mb-2">Popular searches</p>
              <div className="flex flex-wrap items-center gap-2">
                {POPULAR_SEARCHES.map((term) => (
                  <Link
                    key={term}
                    to={`/courses?q=${encodeURIComponent(term)}`}
                    aria-label={`Search courses for ${term}`}
                    className="inline-flex items-center rounded-full border border-white/20 bg-transparent px-3 py-1.5 text-body-sm font-medium text-on-dark hover:bg-white/10 motion-safe:transition-colors duration-fast focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                  >
                    {term}
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
      </div>
    </section>
  );
}
