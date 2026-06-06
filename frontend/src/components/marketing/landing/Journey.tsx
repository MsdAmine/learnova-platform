import { Container } from '../../ui/Container';
import { JourneyStep } from './JourneyStep';
import journey1Url from '../../../assets/journey-1.jpg';
import journey2Url from '../../../assets/journey-2.jpg';
import journey3Url from '../../../assets/journey-3.jpg';

const steps = [
  {
    label: 'Browse courses',
    title: 'Search and filter by what interests you',
    body: "Learnova's course catalog is organized by skill level and subject. You'll find beginner courses for those starting out and advanced programs for those pushing further.",
    primaryCta: { label: 'Browse catalog', href: '/courses' },
    secondaryCta: { label: 'Create account', href: '/register' },
    image: {
      src: journey1Url,
      alt: 'A learner browsing courses on a laptop in a café setting',
    },
  },
  {
    label: 'Enroll and learn',
    title: 'Join a course and access all lessons immediately',
    body: 'Once enrolled, you own your learning path. Work through lessons at your own pace, complete quizzes when ready, and attend live sessions with your instructor.',
    primaryCta: { label: 'Continue learning', href: '/dashboard' },
    secondaryCta: { label: 'Browse courses', href: '/courses' },
    image: {
      src: journey2Url,
      alt: 'Two people sitting on a couch learning together with a laptop',
    },
  },
  {
    label: 'Earn certificates',
    title: 'Complete your course and prove your knowledge',
    body: 'Finish all lessons and pass the final quiz. Your certificate is yours to keep, share, and add to your resume.',
    primaryCta: { label: 'View certificates', href: '/certificates' },
    secondaryCta: { label: 'Start a course', href: '/courses' },
    image: {
      src: journey3Url,
      alt: 'Two students collaborating outdoors, celebrating their progress',
    },
  },
] as const;

export function Journey() {
  return (
    <section
      id="how-it-works"
      aria-labelledby="journey-heading"
      className="w-full bg-bg-base py-16 lg:py-24"
    >
      <Container size="wide">
        <h2 id="journey-heading" className="text-headline text-text-primary mb-3">
          Your learning journey
        </h2>
        <p className="text-body-lg text-text-secondary mb-12 max-w-[60ch]">
          Three steps from your first search to a certificate ready to share.
        </p>
        {steps.map((step, i) => (
          <JourneyStep key={step.label} {...step} flip={i === 1} />
        ))}
      </Container>
    </section>
  );
}
