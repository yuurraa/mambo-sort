import type { SortAlgorithm, SortStep } from '../types';
import { bogoSortSteps } from './bogoSort';
import { bubbleSortSteps } from './bubbleSort';
import { countingSortSteps } from './countingSort';
import { heapSortSteps } from './heapSort';
import { insertionSortSteps } from './insertionSort';
import { kidnappingSortSteps } from './kidnappingSort';
import { mergeSortSteps } from './mergeSort';
import { quickSortSteps } from './quickSort';
import { schizophreniaSortSteps } from './schizophreniaSort';
import { stalinSortSteps } from './stalinSort';
import { thanosSortSteps } from './thanosSort';

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
    case 'thanos':
      return thanosSortSteps(input);
    case 'schizophrenia':
      return schizophreniaSortSteps(input);
    case 'kidnapping':
      return kidnappingSortSteps(input);
    case 'bogo':
      return bogoSortSteps(input);
  }
}
