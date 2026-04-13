import type { SortAlgorithm } from '../types';

export const ARRAY_SIZE_RANGE = {
  min: 5,
  max: 100,
};

export const SPEED_RANGE = {
  min: 5,
  max: 100,
};

export const DEFAULT_ARRAY_SIZE = 50;
export const DEFAULT_SPEED = 100;
export const DEFAULT_ALGORITHM: SortAlgorithm = 'bubble';

export function createShuffledArray(size: number): number[] {
  const values = Array.from({ length: size }, (_, index) => index + 1);

  for (let index = values.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [values[index], values[randomIndex]] = [values[randomIndex], values[index]];
  }

  return values;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function speedToStepDuration(speed: number): number {
  const normalized = (speed - SPEED_RANGE.min) / (SPEED_RANGE.max - SPEED_RANGE.min);
  return Math.round(80 - normalized * 77);
}

export function algorithmLabel(algorithm: SortAlgorithm): string {
  switch (algorithm) {
    case 'bubble':
      return 'Bubble Sort';
    case 'insertion':
      return 'Insertion Sort';
    case 'quick':
      return 'Quick Sort';
    case 'merge':
      return 'Merge Sort';
    case 'counting':
      return 'Counting Sort';
    case 'heap':
      return 'Heap Sort';
    case 'stalin':
      return 'Stalin Sort';
    case 'thanos':
      return 'Thanos Sort';
    case 'schizophrenia':
      return 'Schizophrenia Sort';
    case 'kidnapping':
      return 'Kidnapping Sort';
    case 'bogo':
      return 'Bogo Sort';
  }
}
