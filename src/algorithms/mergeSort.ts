import type { SortStep } from '../types';
import { compare, markAllSorted, swap } from './steps';

export function mergeSortSteps(input: number[]): SortStep[] {
  const values = [...input];
  const steps: SortStep[] = [];

  function merge(start: number, middle: number, end: number): void {
    let leftIndex = start;
    let rightIndex = middle + 1;
    let splitPoint = middle;

    while (leftIndex <= splitPoint && rightIndex <= end) {
      steps.push(compare([leftIndex, rightIndex]));

      if (values[leftIndex] <= values[rightIndex]) {
        leftIndex += 1;
        continue;
      }

      for (let swapIndex = rightIndex; swapIndex > leftIndex; swapIndex -= 1) {
        steps.push(swap([swapIndex - 1, swapIndex]));
        [values[swapIndex - 1], values[swapIndex]] = [
          values[swapIndex],
          values[swapIndex - 1],
        ];
      }

      leftIndex += 1;
      splitPoint += 1;
      rightIndex += 1;
    }
  }

  function sort(start: number, end: number): void {
    if (start >= end) {
      return;
    }

    const middle = Math.floor((start + end) / 2);
    sort(start, middle);
    sort(middle + 1, end);
    merge(start, middle, end);
  }

  sort(0, values.length - 1);
  return [...steps, ...markAllSorted(values.length)];
}
