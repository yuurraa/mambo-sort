import type { SortStep } from '../types';
import { clearPivot, compare, markSorted, setPivot, swap } from './steps';

export function quickSortSteps(input: number[]): SortStep[] {
  const values = [...input];
  const steps: SortStep[] = [];

  function partition(low: number, high: number): number {
    const pivot = values[high];
    let boundary = low;

    steps.push(setPivot(high));

    for (let index = low; index < high; index += 1) {
      steps.push(compare([index, high]));

      if (values[index] < pivot) {
        if (boundary !== index) {
          steps.push(swap([boundary, index]));
          [values[boundary], values[index]] = [values[index], values[boundary]];
        }
        boundary += 1;
      }
    }

    if (boundary !== high) {
      steps.push(swap([boundary, high]));
      [values[boundary], values[high]] = [values[high], values[boundary]];
    }

    steps.push(markSorted(boundary));
    steps.push(clearPivot());

    return boundary;
  }

  function sort(low: number, high: number): void {
    if (low > high) {
      return;
    }

    if (low === high) {
      steps.push(markSorted(low));
      return;
    }

    const pivotIndex = partition(low, high);
    sort(low, pivotIndex - 1);
    sort(pivotIndex + 1, high);
  }

  sort(0, values.length - 1);
  return steps;
}
