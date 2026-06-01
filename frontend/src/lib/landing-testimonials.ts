export interface LandingTestimonial {
  logo: string | null;
  company: string;
  rating: 1 | 2 | 3 | 4 | 5;
  quote: string;
  author: {
    name: string;
    role: string;
    avatar?: string;
  };
  /** URL for the full learner story page. Omit until real story pages exist. */
  storyHref?: string;
}

// Swap logo paths for real partner SVGs in frontend/src/assets/partners/ when available.
export const LANDING_TESTIMONIALS: LandingTestimonial[] = [
  {
    logo: null,
    company: 'Webflow',
    rating: 5,
    quote:
      'I found exactly what I needed. The courses are clear, the instructors are responsive, and I earned my certificate in three months.',
    author: {
      name: 'Sarah Chen',
      role: 'Product manager, Tech startup',
    },
  },
  {
    logo: null,
    company: 'Relume',
    rating: 5,
    quote:
      'Learnova made it easy to teach. The platform handles everything so I can focus on my students and their progress.',
    author: {
      name: 'Marcus Rodriguez',
      role: 'Instructor, Design',
    },
  },
  {
    logo: null,
    company: 'Linear',
    rating: 4,
    quote:
      'The live sessions changed everything for me. I could ask questions in real time and actually understand the material.',
    author: {
      name: 'Emma Thompson',
      role: 'Learner, Career transition',
    },
  },
];
