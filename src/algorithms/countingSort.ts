import type { SortStep } from '../types';
import { compare, markSorted, swap } from './steps';

export function countingSortSteps(input: number[]): SortStep[] {
  const values = [...input];
  const steps: SortStep[] = [];

  if (values.length <= 1) {
    return values.length === 1 ? [markSorted(0)] : [];
  }

  const maxValue = Math.max(...values);
  const counts = new Array<number>(maxValue + 1).fill(0);

  values.forEach((value) => {
    counts[value] += 1;
  });

  const targetOrder: number[] = [];
  for (let value = 0; value < counts.length; value += 1) {
    for (let count = 0; count < counts[value]; count += 1) {
      targetOrder.push(value);
    }
  }

  for (let targetIndex = 0; targetIndex < targetOrder.length; targetIndex += 1) {
    const targetValue = targetOrder[targetIndex];
    let currentIndex = targetIndex;

    while (values[currentIndex] !== targetValue) {
      currentIndex += 1;
    }

    while (currentIndex > targetIndex) {
      steps.push(compare([currentIndex - 1, currentIndex]));
      steps.push(swap([currentIndex - 1, currentIndex]));
      [values[currentIndex - 1], values[currentIndex]] = [
        values[currentIndex],
        values[currentIndex - 1],
      ];
      currentIndex -= 1;
    }

    steps.push(markSorted(targetIndex));
  }

  return steps;
}
