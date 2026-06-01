import { Container } from '../../ui/Container';
import { Stat } from '../../ui/Stat';
import { LANDING_STATS } from '../../../lib/landing-stats';

export function StatsGrid() {
  const [lead, ...supporting] = LANDING_STATS;

  return (
    <section aria-labelledby="stats-heading" className="w-full bg-bg-base py-16 lg:py-24">
      <Container>
        <div className="flex flex-col gap-12 lg:flex-row lg:items-start lg:gap-20">

          {/* Section heading — left column */}
          <div className="lg:flex-[2]">
            <h2 id="stats-heading" className="text-headline text-text-primary">
              Trusted by learners and instructors worldwide
            </h2>
          </div>

          {/* Stats — right column */}
          <div className="lg:flex-[3] flex flex-col">
            <div className="flex flex-col gap-xl lg:flex-row lg:gap-0">
              <div className="lg:flex-[3] min-w-0 lg:pr-lg xl:pr-2xl lg:border-r lg:border-border-default">
                <Stat
                  size="lead"
                  label={lead.label}
                  value={lead.value}
                  description={lead.description}
                />
              </div>

              <div className="lg:flex-[2] min-w-0 lg:pl-lg xl:pl-2xl flex flex-col">
                {supporting.map((stat, i) => (
                  <div
                    key={stat.label}
                    className={i > 0 ? 'mt-lg pt-lg border-t border-border-default' : undefined}
                  >
                    <Stat
                      label={stat.label}
                      value={stat.value}
                      description={stat.description}
                    />
                  </div>
                ))}
              </div>
            </div>

            <p className="mt-lg text-body-sm text-text-secondary">
              Updated monthly
            </p>
          </div>

        </div>
      </Container>
    </section>
  );
}
