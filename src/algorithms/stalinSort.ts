import type { SortStep } from '../types';
import { compare, markAllSorted, markSorted, remove } from './steps';

export function stalinSortSteps(input: number[]): SortStep[] {
  const values = [...input];
  const steps: SortStep[] = [];

  if (values.length <= 1) {
    return values.length === 1 ? [markSorted(0)] : [];
  }

  let currentMaximum = values[0];
  let index = 1;

  while (index < values.length) {
    steps.push(compare([index - 1, index]));

    if (values[index] >= currentMaximum) {
      currentMaximum = values[index];
      index += 1;
      continue;
    }

    steps.push(remove([index]));
    values.splice(index, 1);
  }

  return [...steps, ...markAllSorted(values.length)];
}
