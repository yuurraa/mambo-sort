import type { SortStep } from '../types';
import { compare, markSorted, swap } from './steps';

export function heapSortSteps(input: number[]): SortStep[] {
  const values = [...input];
  const steps: SortStep[] = [];

  if (values.length <= 1) {
    return values.length === 1 ? [markSorted(0)] : [];
  }

  function siftDown(heapSize: number, rootIndex: number): void {
    let currentRoot = rootIndex;

    while (true) {
      const leftChild = currentRoot * 2 + 1;
      const rightChild = leftChild + 1;
      let largest = currentRoot;

      if (leftChild < heapSize) {
        steps.push(compare([largest, leftChild]));
        if (values[leftChild] > values[largest]) {
          largest = leftChild;
        }
      }

      if (rightChild < heapSize) {
        steps.push(compare([largest, rightChild]));
        if (values[rightChild] > values[largest]) {
          largest = rightChild;
        }
      }

      if (largest === currentRoot) {
        break;
      }

      steps.push(swap([currentRoot, largest]));
      [values[currentRoot], values[largest]] = [
        values[largest],
        values[currentRoot],
      ];
      currentRoot = largest;
    }
  }

  for (let index = Math.floor(values.length / 2) - 1; index >= 0; index -= 1) {
    siftDown(values.length, index);
  }

  for (let endIndex = values.length - 1; endIndex > 0; endIndex -= 1) {
    steps.push(swap([0, endIndex]));
    [values[0], values[endIndex]] = [values[endIndex], values[0]];
    steps.push(markSorted(endIndex));
    siftDown(endIndex, 0);
  }

  steps.push(markSorted(0));
  return steps;
}
