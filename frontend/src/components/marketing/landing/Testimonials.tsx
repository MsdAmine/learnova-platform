import { Container } from '../../ui/Container';
import { SectionHeader } from '../../ui/SectionHeader';
import { TestimonialCard } from '../../ui/TestimonialCard';
import { LANDING_TESTIMONIALS } from '../../../lib/landing-testimonials';

export function Testimonials() {
  const [featured, ...supporting] = LANDING_TESTIMONIALS;

  return (
    <section aria-label="Learner stories" className="w-full bg-surface-elevated py-24">
      <Container>
        <SectionHeader
          title="Learner stories"
          description="From first course to career change — what learners and instructors say about their time on Learnova."
          align="left"
        />

        <div className="mt-12 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Featured testimonial — spans 2 of 3 columns */}
          <TestimonialCard
            logo={featured.logo}
            company={featured.company}
            rating={featured.rating}
            quote={featured.quote}
            author={featured.author}
            storyHref={featured.storyHref}
            variant="featured"
            className="lg:col-span-2"
          />

          {/* Supporting testimonials stacked in the third column */}
          <div className="flex flex-col gap-6 lg:h-full">
            {supporting.map((t) => (
              <TestimonialCard
                key={`${t.company}-${t.author.name}`}
                logo={t.logo}
                company={t.company}
                rating={t.rating}
                quote={t.quote}
                author={t.author}
                storyHref={t.storyHref}
                className="flex-1"
              />
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
