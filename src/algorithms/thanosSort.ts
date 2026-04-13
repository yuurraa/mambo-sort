import type { SortStep } from '../types';
import { compare, markAllSorted, markSorted, remove } from './steps';

function shuffle(values: number[]): number[] {
  const next = [...values];

  for (let index = next.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [next[index], next[randomIndex]] = [next[randomIndex], next[index]];
  }

  return next;
}

function checkSorted(values: number[], steps: SortStep[]): boolean {
  if (values.length <= 1) {
    return true;
  }

  let sorted = true;

  for (let index = 0; index < values.length - 1; index += 1) {
    steps.push(compare([index, index + 1]));

    if (values[index] > values[index + 1]) {
      sorted = false;
    }
  }

  return sorted;
}

function findSortedSurvivors(values: number[]): number[] {
  const lengths = new Array<number>(values.length).fill(1);
  const previous = new Array<number>(values.length).fill(-1);
  let bestIndex = 0;

  for (let index = 1; index < values.length; index += 1) {
    for (let candidate = 0; candidate < index; candidate += 1) {
      if (
        values[candidate] <= values[index] &&
        lengths[candidate] + 1 > lengths[index]
      ) {
        lengths[index] = lengths[candidate] + 1;
        previous[index] = candidate;
      }
    }

    if (lengths[index] > lengths[bestIndex]) {
      bestIndex = index;
    }
  }

  const survivorIndices: number[] = [];
  let currentIndex = bestIndex;

  while (currentIndex !== -1) {
    survivorIndices.push(currentIndex);
    currentIndex = previous[currentIndex];
  }

  return survivorIndices.reverse();
}

export function thanosSortSteps(input: number[]): SortStep[] {
  const values = [...input];
  const steps: SortStep[] = [];

  if (values.length <= 1) {
    return values.length === 1 ? [markSorted(0)] : [];
  }

  while (!checkSorted(values, steps)) {
    const survivorIndices = findSortedSurvivors(values);
    const survivorSet = new Set(survivorIndices);
    const vulnerableIndices = Array.from(
      { length: values.length },
      (_, index) => index,
    ).filter((index) => !survivorSet.has(index));
    const deleteCount = Math.min(
      vulnerableIndices.length,
      Math.max(1, Math.floor(values.length / 2)),
    );
    const deleteIndices = shuffle(vulnerableIndices)
      .slice(0, deleteCount)
      .sort((left, right) => right - left);

    survivorIndices.forEach((index) => {
      steps.push(markSorted(index));
    });

    deleteIndices.forEach((index) => {
      steps.push(remove([index]));
      values.splice(index, 1);
    });
  }

  return [...steps, ...markAllSorted(values.length)];
}
