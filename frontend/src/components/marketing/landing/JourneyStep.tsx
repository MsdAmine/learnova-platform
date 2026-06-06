import { Link } from 'react-router-dom';
import { Button } from '../../ui/Button';
import { cn } from '../../../lib/cn';

interface Cta {
  label: string;
  href: string;
}

interface JourneyStepImage {
  src: string;
  alt: string;
}

export interface JourneyStepProps {
  label: string;
  title: string;
  body: string;
  primaryCta: Cta;
  secondaryCta: Cta;
  image: JourneyStepImage;
  flip?: boolean;
  className?: string;
}

export function JourneyStep({
  label,
  title,
  body,
  primaryCta,
  secondaryCta,
  image,
  flip = false,
  className,
}: JourneyStepProps) {
  return (
    <div className={cn('border-t border-border-default py-20 lg:py-28', className)}>

      {/* Step label */}
      <p className="text-body-sm font-medium text-text-secondary mb-6 uppercase tracking-[0.08em]">
        {label}
      </p>

      {/* Two-column content row, optionally reversed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 items-stretch gap-12 lg:gap-16">

        {/* Text column */}
        <div className={cn('flex flex-col justify-center', flip && 'lg:order-2')}>
          <h3 className="text-title text-text-primary">
            {title}
          </h3>
          <p className="text-body-lg text-text-secondary mt-4 max-w-[65ch]">
            {body}
          </p>
          <div className="flex flex-wrap items-center gap-3 mt-8">
            <Button variant="secondary" size="md" asChild>
              <Link to={primaryCta.href}>{primaryCta.label}</Link>
            </Button>
            <Button variant="ghost" size="md" asChild>
              <Link to={secondaryCta.href}>{secondaryCta.label}</Link>
            </Button>
          </div>
        </div>

        {/* Image column — stretches to match text column height */}
        <div className={cn('min-h-[420px] lg:min-h-[500px] rounded-lg overflow-hidden', flip && 'lg:order-1')}>
          <img
            src={image.src}
            width={800}
            height={600}
            alt={image.alt}
            loading="lazy"
            className="w-full h-full object-cover"
          />
        </div>

      </div>
    </div>
  );
}
