import type { SortAlgorithm } from '../types';

export const ARRAY_SIZE_RANGE = {
  min: 5,
  max: 100,
};

export const SPEED_RANGE = {
  min: 5,
  max: 100,
};

export const VOLUME_RANGE = {
  min: 0,
  max: 100,
};

export const DEFAULT_ARRAY_SIZE = 50;
export const DEFAULT_SPEED = 100;
export const DEFAULT_VOLUME = 50;
export const DEFAULT_ALGORITHM: SortAlgorithm = 'bubble';
const MAX_VOLUME_GAIN = 2.5;

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

export function volumeToGain(volume: number): number {
  const clampedVolume = clamp(volume, VOLUME_RANGE.min, VOLUME_RANGE.max);

  if (clampedVolume <= DEFAULT_VOLUME) {
    return clampedVolume / DEFAULT_VOLUME;
  }

  const boostRatio =
    (clampedVolume - DEFAULT_VOLUME) / (VOLUME_RANGE.max - DEFAULT_VOLUME);

  return 1 + boostRatio * (MAX_VOLUME_GAIN - 1);
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
