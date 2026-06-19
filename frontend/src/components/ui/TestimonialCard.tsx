import { useState } from 'react';
import { ArrowRight, Star } from 'lucide-react';
import { Avatar } from './Avatar';
import { cn } from '../../lib/cn';

export interface TestimonialCardProps {
  /** Path to company logo image. Renders company name text as fallback when absent or broken. */
  logo: string | null;
  /** Company name — used as logo alt text and as the text fallback. */
  company: string;
  /** Star rating out of 5. */
  rating: 1 | 2 | 3 | 4 | 5;
  /** The testimonial body copy. */
  quote: string;
  author: {
    name: string;
    role: string;
    /** Avatar image URL. Renders initials when absent. */
    avatar?: string;
  };
  /** URL for the full learner story page. Omit to hide the "Read story" link. */
  storyHref?: string;
  /** Visual weight. 'featured' uses larger padding and body-lg quote text. */
  variant?: 'default' | 'featured';
  className?: string;
}

// ── StarRating ────────────────────────────────────────────────────────────────

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-[3px]" aria-label={`${rating} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => {
        const filled = i < rating;
        return (
          <Star
            key={i}
            size={14}
            strokeWidth={1.5}
            className={cn(
              filled
                ? 'fill-anzac text-anzac'
                : 'fill-transparent text-border-default',
            )}
            aria-hidden="true"
          />
        );
      })}
    </div>
  );
}

// ── LogoCell ─────────────────────────────────────────────────────────────────

function LogoCell({ src, company }: { src: string | null; company: string }) {
  const [broken, setBroken] = useState(false);

  if (src && !broken) {
    return (
      <img
        src={src}
        alt={company}
        onError={() => setBroken(true)}
        className="h-6 w-auto object-contain"
      />
    );
  }

  return (
    <span className="text-body-sm font-semibold text-text-primary tracking-tight">
      {company}
    </span>
  );
}

// ── TestimonialCard ───────────────────────────────────────────────────────────

export function TestimonialCard({
  logo,
  company,
  rating,
  quote,
  author,
  storyHref,
  variant = 'default',
  className,
}: TestimonialCardProps) {
  const isFeatured = variant === 'featured';

  return (
    <article
      className={cn(
        'flex flex-col bg-surface rounded-lg border border-border-default',
        isFeatured ? 'p-xl' : 'p-lg',
        className,
      )}
    >
      {/* Header: logo + stars */}
      <div className="flex items-center justify-between gap-md mb-lg">
        <LogoCell src={logo} company={company} />
        <StarRating rating={rating} />
      </div>

      {/* Quote — flex-grow keeps the footer anchored at the bottom */}
      <blockquote
        className={cn(
          'flex-1 text-text-primary leading-body',
          isFeatured ? 'text-body-lg' : 'text-body',
        )}
      >
        <p>{quote}</p>
      </blockquote>

      {/* Footer: author + optional read story link */}
      <footer className="mt-lg pt-lg border-t border-border-default flex items-center justify-between gap-md">
        <div className="flex items-center gap-sm min-w-0">
          <Avatar src={author.avatar} name={author.name} size={40} />
          <div className="min-w-0">
            <p className="text-body-sm font-semibold text-text-primary truncate">
              {author.name}
            </p>
            <p className="text-caption text-text-secondary truncate">
              {author.role}
            </p>
          </div>
        </div>

        {storyHref && (
          <a
            href={storyHref}
            className={cn(
              'shrink-0 text-body-sm font-semibold text-salem',
              'hover:text-salem-700 transition-colors duration-fast ease-standard',
              'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-salem rounded-sm',
            )}
            aria-label={`Read ${author.name}'s story`}
          >
            Read story
            <ArrowRight size={13} strokeWidth={2} className="inline-block ml-1 align-[-1px]" aria-hidden="true" />
          </a>
        )}
      </footer>
    </article>
  );
}
