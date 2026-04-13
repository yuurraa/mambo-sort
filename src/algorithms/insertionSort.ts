import type { SortStep } from '../types';
import { compare, markAllSorted, markSorted, swap } from './steps';

export function insertionSortSteps(input: number[]): SortStep[] {
  const values = [...input];
  const steps: SortStep[] = [];

  if (values.length <= 1) {
    return values.length === 1 ? [markSorted(0)] : [];
  }

  for (let index = 1; index < values.length; index += 1) {
    let currentIndex = index;

    while (currentIndex > 0) {
      steps.push(compare([currentIndex - 1, currentIndex]));

      if (values[currentIndex - 1] <= values[currentIndex]) {
        break;
      }

      steps.push(swap([currentIndex - 1, currentIndex]));
      [values[currentIndex - 1], values[currentIndex]] = [
        values[currentIndex],
        values[currentIndex - 1],
      ];
      currentIndex -= 1;
    }
  }

  return [...steps, ...markAllSorted(values.length)];
}
