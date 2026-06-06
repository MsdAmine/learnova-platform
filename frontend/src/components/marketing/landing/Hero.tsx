import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../ui/Button';
import heroImageUrl from '../../../assets/hero-collaboration.jpg';
import heroSrcset from '../../../assets/hero-collaboration.jpg?w=480;720;960&format=webp&as=srcset';

// Checked once at module load; stable for the lifetime of the page.
const prefersReduced =
  typeof window !== 'undefined'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : true;

// Stagger indices: 0 = headline, 1 = body, 2 = CTAs, 3 = image
const DURATION = 300;
const STAGGER = 80;

export function Hero() {
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

  return (
    <section
      id="hero-section"
      aria-labelledby="hero-heading"
      className="w-full bg-salem min-h-[85vh] flex items-center pt-[68px] pb-20 lg:pt-[84px] lg:pb-24"
    >
      <div className="px-6 md:px-12 lg:px-16 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 items-center border border-white/[0.15]">

          {/* Left column — text and CTAs */}
          <div className="py-2xl px-xl lg:py-3xl lg:px-2xl">
            <h1
              id="hero-heading"
              className="text-display text-white"
              style={animStyle(0)}
            >
              Learn what<br />matters to you
            </h1>

            <p
              className="text-body-lg text-on-dark mt-6 max-w-[520px]"
              style={animStyle(1)}
            >
              Learnova connects you with courses that fit your pace and goals. Find structured programs, track your progress, and earn certificates that prove what you know.
            </p>

            <div
              className="flex flex-wrap items-center gap-3 mt-10"
              style={animStyle(2)}
            >
              <Button variant="inverted" size="lg" asChild>
                <Link to="/register">Get started</Link>
              </Button>
              <Button
                variant="ghost"
                size="lg"
                asChild
                className="text-white hover:bg-white/10"
              >
                <Link to="/courses">Browse courses</Link>
              </Button>
            </div>
          </div>

          {/* Right column — image fills card height, anchored to right edge */}
          <div
            className="hidden lg:flex self-stretch"
            style={animStyle(3)}
          >
            <img
              src={heroImageUrl}
              srcSet={heroSrcset}
              sizes="(min-width: 1024px) calc(50vw - 32px)"
              width={960}
              height={720}
              alt="Two people collaborating over a laptop in warm natural daylight"
              loading="eager"
              fetchPriority="high"
              decoding="async"
              className="h-full w-full object-cover object-right"
            />
          </div>

        </div>
      </div>
    </section>
  );
}
