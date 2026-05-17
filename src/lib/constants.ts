export const THRUST_AREAS = [
  'Revenue & Profitability',
  'Quality & Operational Excellence',
  'Compliance & Risk Management',
  'People & Development',
  'Innovation & Digital Transformation',
  'Customer Experience',
];

export const UOM_TYPES = [
  { id: 'numeric_min', label: 'Numeric/% (Min) - Higher is better' },
  { id: 'numeric_max', label: 'Numeric/% (Max) - Lower is better' },
  { id: 'timeline', label: 'Timeline (Date-based)' },
  { id: 'zero', label: 'Zero (Safety/Defects)' },
];

export const DEMO_CREDENTIALS = {
  employee: { email: 'employee@demo.com', password: 'Demo@1234' },
  manager: { email: 'manager@demo.com', password: 'Demo@1234' },
  admin: { email: 'admin@demo.com', password: 'Demo@1234' },
};

export const PHASES = ['goal_setting', 'Q1', 'Q2', 'Q3', 'Q4'] as const;
