import { UoMType } from '../types';

export function computeScore(uomType: UoMType, targetValue: string, actualValue: string): number {
  if (!actualValue || actualValue.trim() === '') return 0;

  const target = parseFloat(targetValue);
  const actual = parseFloat(actualValue);

  switch (uomType) {
    case 'numeric_min':
      if (isNaN(target) || isNaN(actual) || target === 0) return 0;
      return Math.min((actual / target) * 100, 150); // Cap at 150% for display

    case 'numeric_max':
      if (isNaN(target) || isNaN(actual) || actual === 0) return 0;
      return Math.min((target / actual) * 100, 150);

    case 'timeline':
      const targetDate = new Date(targetValue);
      const actualDate = new Date(actualValue);
      if (isNaN(targetDate.getTime()) || isNaN(actualDate.getTime())) return 0;
      return actualDate <= targetDate ? 100 : 0;

    case 'zero':
      if (isNaN(actual)) return 0;
      return actual === 0 ? 100 : 0;

    default:
      return 0;
  }
}
