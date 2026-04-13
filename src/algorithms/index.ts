import type { SortAlgorithm, SortStep } from '../types';
import { bogoSortSteps } from './bogoSort';
import { bubbleSortSteps } from './bubbleSort';
import { countingSortSteps } from './countingSort';
import { heapSortSteps } from './heapSort';
import { insertionSortSteps } from './insertionSort';
import { mergeSortSteps } from './mergeSort';
import { quickSortSteps } from './quickSort';
import { stalinSortSteps } from './stalinSort';

export function generateSortSteps(
  algorithm: SortAlgorithm,
  input: number[],
): SortStep[] {
  switch (algorithm) {
    case 'bubble':
      return bubbleSortSteps(input);
    case 'insertion':
      return insertionSortSteps(input);
    case 'quick':
      return quickSortSteps(input);
    case 'merge':
      return mergeSortSteps(input);
    case 'counting':
      return countingSortSteps(input);
    case 'heap':
      return heapSortSteps(input);
    case 'stalin':
      return stalinSortSteps(input);
    case 'bogo':
      return bogoSortSteps(input);
  }
}
