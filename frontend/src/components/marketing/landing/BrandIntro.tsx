import { Link } from 'react-router-dom';
import { Container } from '../../ui/Container';
import { SectionHeader } from '../../ui/SectionHeader';
import featureImageUrl from '../../../assets/feature-live-sessions.jpg';
import featureSrcset from '../../../assets/feature-live-sessions.jpg?w=320;480;640&format=webp&as=srcset';
import journey1Url from '../../../assets/journey-1.jpg';
import journey1Srcset from '../../../assets/journey-1.jpg?w=320;480;640&format=webp&as=srcset';
import journey2Url from '../../../assets/journey-2.jpg';
import journey2Srcset from '../../../assets/journey-2.jpg?w=320;480;640&format=webp&as=srcset';

// ── Card: image on top, text block below ─────────────────────────────────────

interface TopImageCardProps {
  imageUrl: string;
  imageSrcSet?: string;
  imageAlt: string;
  eyebrow: string;
  title: string;
  body: string;
  linkLabel: string;
  linkTo: string;
}

function TopImageCard({ imageUrl, imageSrcSet, imageAlt, eyebrow, title, body, linkLabel, linkTo }: TopImageCardProps) {
  return (
    <div className="rounded-xl overflow-hidden border border-card-dark-border bg-card-dark-bg flex flex-col min-h-[400px]">
      <div className="h-[220px] flex-shrink-0 overflow-hidden">
        <img
          src={imageUrl}
          srcSet={imageSrcSet}
          sizes="(min-width: 1200px) 235px, (min-width: 1024px) calc((100vw - 144px) / 4.5), (min-width: 768px) calc(50vw - 40px), calc(100vw - 48px)"
          alt={imageAlt}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover"
        />
      </div>
      <div className="flex flex-col flex-1 p-6">
        <span className="text-caption font-semibold uppercase tracking-[0.08em] text-on-dark-muted mb-3">
          {eyebrow}
        </span>
        <h3 className="text-title text-white">{title}</h3>
        <p className="text-body-sm text-on-dark mt-2 flex-1">{body}</p>
        <Link
          to={linkTo}
          className="mt-6 text-body-sm font-medium text-on-dark hover:text-white transition-colors duration-fast rounded-[4px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          {linkLabel}
        </Link>
      </div>
    </div>
  );
}

// ── Card: image left, text vertically centered right ─────────────────────────

interface SplitImageCardProps {
  imageUrl: string;
  imageSrcSet?: string;
  imageAlt: string;
  eyebrow: string;
  title: string;
  body: string;
  linkLabel: string;
  linkTo: string;
  className?: string;
}

function SplitImageCard({ imageUrl, imageSrcSet, imageAlt, eyebrow, title, body, linkLabel, linkTo, className = '' }: SplitImageCardProps) {
  return (
    <div className={`rounded-xl overflow-hidden border border-card-dark-border bg-card-dark-bg flex flex-col lg:flex-row min-h-[400px] ${className}`}>
      <div className="h-[220px] lg:h-auto lg:w-1/2 flex-shrink-0 overflow-hidden">
        <img
          src={imageUrl}
          srcSet={imageSrcSet}
          sizes="(min-width: 1200px) 293px, (min-width: 1024px) calc((100vw - 144px) * 5 / 18), (min-width: 768px) calc(50vw - 40px), calc(100vw - 48px)"
          alt={imageAlt}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover"
        />
      </div>
      <div className="flex flex-col justify-center flex-1 p-6">
        <span className="text-caption font-semibold uppercase tracking-[0.08em] text-on-dark-muted mb-3">
          {eyebrow}
        </span>
        <h3 className="text-title text-white">{title}</h3>
        <p className="text-body-sm text-on-dark mt-2">{body}</p>
        <Link
          to={linkTo}
          className="mt-6 text-body-sm font-medium text-on-dark hover:text-white transition-colors duration-fast rounded-[4px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          {linkLabel}
        </Link>
      </div>
    </div>
  );
}

// ── Section ───────────────────────────────────────────────────────────────────

export function BrandIntro() {
  return (
    <section
      id="brand-intro-section"
      className="w-full bg-salem py-16 lg:py-24"
      aria-labelledby="brand-intro-heading"
    >
      <Container>
        <SectionHeader
          id="brand-intro-heading"
          eyebrow="Platform"
          title="Built for real learning"
          description="Browse thousands of courses across every skill level"
          align="center"
          onDark
          titleSize="brand-display"
        />

        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_1.5fr] gap-4">
          <TopImageCard
            imageUrl={journey1Url}
            imageSrcSet={journey1Srcset}
            imageAlt="Students browsing the course catalog"
            eyebrow="Discover"
            title="Find your course"
            body="Search by category, level, or instructor expertise"
            linkLabel="Browse →"
            linkTo="/courses"
          />
          <TopImageCard
            imageUrl={journey2Url}
            imageSrcSet={journey2Srcset}
            imageAlt="Learner tracking their progress"
            eyebrow="Progress"
            title="Track every step forward"
            body="Watch your skills grow with clear progress tracking"
            linkLabel="Learn →"
            linkTo="/courses"
          />
          <SplitImageCard
            imageUrl={featureImageUrl}
            imageSrcSet={featureSrcset}
            imageAlt="Students collaborating during a live learning session"
            eyebrow="Live"
            title="Live sessions and real instructors"
            body="Connect with instructors in real time during live sessions"
            linkLabel="Join →"
            linkTo="/courses"
            className="lg:col-span-2"
          />
        </div>
      </Container>
    </section>
  );
}
