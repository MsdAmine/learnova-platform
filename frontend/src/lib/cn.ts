import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

// Custom font-size utilities (from tailwind.config.ts fontSize extension) must be
// registered here so tailwind-merge doesn't misclassify them as text-color classes
// and incorrectly drop text-white / text-salem / etc. from composed class strings.
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [
        {
          text: [
            'brand-display',
            'display',
            'headline',
            'title',
            'title-sm',
            'body-lg',
            'body',
            'body-sm',
            'caption',
            'button',
            'btn-sm',
            'btn-md',
          ],
        },
      ],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
