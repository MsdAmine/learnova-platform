import { Link } from 'react-router-dom';
import { Container } from '../../ui/Container';
import { SectionHeader } from '../../ui/SectionHeader';
import { Card } from '../../ui/Card';
import featureImageUrl from '../../../assets/feature-live-sessions.jpg';

// ── Text card — Salem-on-Salem dark variant ──────────────────────────────────

interface TextCardProps {
  title: string;
  body: string;
  linkLabel: string;
  linkTo: string;
}

function TextCard({ title, body, linkLabel, linkTo }: TextCardProps) {
  return (
    <Card className="bg-card-dark-bg border-card-dark-border p-6 flex flex-col">
      <h4 className="text-title-sm text-white">{title}</h4>
      <p className="text-body-sm text-on-dark mt-2">{body}</p>
      <Link
        to={linkTo}
        className="mt-6 text-[14px] font-medium leading-[1.5] text-on-dark hover:text-white transition-colors duration-[120ms]"
      >
        {linkLabel}
      </Link>
    </Card>
  );
}

// ── Image card — full-bleed photo with gradient text overlay ─────────────────

function ImageCard() {
  return (
    <Card className="bg-transparent border-0 p-0 overflow-hidden min-h-[280px] relative md:col-span-2 lg:col-span-1">
      <img
        src={featureImageUrl}
        alt="Students collaborating with an instructor during a live learning session"
        loading="lazy"
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"
      />
      <div className="absolute bottom-0 left-0 p-6">
        <h4 className="text-title-sm text-white">
          Live sessions and real instructors
        </h4>
        <p className="text-body-sm text-on-dark mt-2">
          Connect with instructors in real time during live sessions
        </p>
        <Link
          to="/courses"
          className="mt-6 inline-block text-[14px] font-medium leading-[1.5] text-on-dark hover:text-white transition-colors duration-[120ms]"
        >
          Find a session
        </Link>
      </div>
    </Card>
  );
}

// ── Section ──────────────────────────────────────────────────────────────────

export function BrandIntro() {
  return (
    <section
      id="brand-intro-section"
      className="w-full bg-[#042C1F] py-16 lg:py-24"
      aria-labelledby="brand-intro-heading"
    >
      <Container>
        <SectionHeader
          id="brand-intro-heading"
          title="Built for real learning"
          description="Browse thousands of courses across every skill level"
          align="center"
          onDark
          titleSize="display"
        />

        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <TextCard
            title="Find your course"
            body="Search by category, level, or instructor expertise"
            linkLabel="Browse courses"
            linkTo="/courses"
          />
          <TextCard
            title="Track every step forward"
            body="Watch your skills grow with clear progress tracking"
            linkLabel="Start learning"
            linkTo="/courses"
          />
          <ImageCard />
        </div>
      </Container>
    </section>
  );
}
