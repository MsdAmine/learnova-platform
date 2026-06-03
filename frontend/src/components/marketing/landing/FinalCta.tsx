import { Link } from 'react-router-dom';
import { Button } from '../../ui/Button';
import ctaImageUrl from '../../../assets/cta-learner.jpg';

export function FinalCta() {
  return (
    <section aria-labelledby="final-cta-heading" className="w-full">
      <div className="flex flex-col lg:flex-row min-h-[480px] lg:min-h-[560px]">

        {/* Learner image — mobile top, desktop left half */}
        <div className="relative w-full lg:w-1/2 aspect-[16/10] lg:aspect-auto overflow-hidden">
          <img
            src={ctaImageUrl}
            width={960}
            height={720}
            alt="A focused learner working through a course at their workspace"
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>

        {/* Salem panel — mobile bottom, desktop right half */}
        <div className="flex flex-col items-center justify-center text-center lg:text-left lg:items-start w-full lg:w-1/2 bg-salem px-8 py-14 sm:px-12 lg:px-16 xl:px-20">
          <h2
            id="final-cta-heading"
            className="text-display text-white"
          >
            Ready to begin<br className="hidden sm:block" /> learning
          </h2>

          <p className="mt-5 text-body-lg text-on-dark max-w-[400px]">
            Join thousands of learners already advancing their skills on Learnova.
          </p>

          <div className="mt-10 flex items-center justify-center lg:justify-start gap-4 flex-wrap">
            <Button asChild variant="inverted" size="lg">
              <Link to="/register">Get started</Link>
            </Button>

            <Link
              to="/courses"
              className="text-button text-on-dark-muted hover:text-white transition-colors duration-fast underline-offset-4 hover:underline rounded-[4px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Browse courses
            </Link>
          </div>
        </div>

      </div>
    </section>
  );
}
