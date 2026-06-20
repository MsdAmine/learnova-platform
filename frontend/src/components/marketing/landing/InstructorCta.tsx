import { Link } from 'react-router-dom';
import { Button } from '../../ui/Button';

export function InstructorCta() {
  return (
    <section aria-labelledby="instructor-cta-heading" className="bg-bg-base py-12 lg:py-16">
      <div className="px-6 md:px-12 lg:px-16 max-w-container mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 border border-border-default rounded-lg p-8">
          <div>
            <h2 id="instructor-cta-heading" className="text-title-sm font-semibold text-text-primary">
              Have expertise to share?
            </h2>
            <p className="text-body-sm text-text-secondary mt-1">
              Create an account to apply as an instructor and publish structured courses.
            </p>
          </div>
          <Button variant="secondary" size="md" asChild className="flex-shrink-0">
            <Link to="/register">Become an instructor</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
