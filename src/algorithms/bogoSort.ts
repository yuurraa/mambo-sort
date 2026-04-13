import type { SortStep } from '../types';
import { markSorted } from './steps';

export function bogoSortSteps(input: number[]): SortStep[] {
  return input.length === 1 ? [markSorted(0)] : [];
}
