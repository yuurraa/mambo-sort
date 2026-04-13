import type { SortStep } from '../types';
import { compare, markSorted, swap } from './steps';

export function bubbleSortSteps(input: number[]): SortStep[] {
  const values = [...input];
  const steps: SortStep[] = [];
  const sorted = new Set<number>();

  if (values.length <= 1) {
    return values.length === 1 ? [markSorted(0)] : [];
  }

  for (let pass = 0; pass < values.length; pass += 1) {
    let swapped = false;

    for (let index = 0; index < values.length - pass - 1; index += 1) {
      steps.push(compare([index, index + 1]));

      if (values[index] > values[index + 1]) {
        steps.push(swap([index, index + 1]));
        [values[index], values[index + 1]] = [values[index + 1], values[index]];
        swapped = true;
      }
    }

    const settledIndex = values.length - pass - 1;
    if (!sorted.has(settledIndex)) {
      sorted.add(settledIndex);
      steps.push(markSorted(settledIndex));
    }

    if (!swapped) {
      for (let index = 0; index < settledIndex; index += 1) {
        if (!sorted.has(index)) {
          sorted.add(index);
          steps.push(markSorted(index));
        }
      }
      break;
    }
  }

  return steps;
}
