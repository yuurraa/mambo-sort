import type { SortStep } from '../types';
import { compare, markAllSorted, markSorted, remove } from './steps';

function deleteFirstGulagCandidate(values: number[], steps: SortStep[]): boolean {
  let currentMaximum = values[0];

  for (let index = 1; index < values.length; index += 1) {
    steps.push(compare([index - 1, index]));

    if (values[index] >= currentMaximum) {
      currentMaximum = values[index];
      continue;
    }

    steps.push(remove([index]));
    values.splice(index, 1);
    return true;
  }

  return false;
}

export function stalinSortSteps(input: number[]): SortStep[] {
  const values = [...input];
  const steps: SortStep[] = [];

  if (values.length <= 1) {
    return values.length === 1 ? [markSorted(0)] : [];
  }

  while (deleteFirstGulagCandidate(values, steps)) {
    // Each sweep deletes one segment at most, keeping the destructive gag readable.
  }

  return [...steps, ...markAllSorted(values.length)];
}
