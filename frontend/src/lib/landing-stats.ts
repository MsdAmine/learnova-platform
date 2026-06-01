export interface LandingStat {
  value: string;
  label: string;
  description: string;
}

// Swap these for live data when GET /api/v1/public/stats ships.
export const LANDING_STATS: LandingStat[] = [
  {
    value: '12,000+',
    label: 'Active learners',
    description: 'Students learning new skills every month',
  },
  {
    value: '450+',
    label: 'Published courses',
    description: 'Instructors sharing their expertise',
  },
  {
    value: '8,500+',
    label: 'Certificates earned',
    description: 'Proof of learning and achievement',
  },
];
