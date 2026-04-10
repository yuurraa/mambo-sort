import type { SortAlgorithm, SortStep } from '../types';

function compare(indices: number[]): SortStep {
  return { type: 'compare', indices };
}

function swap(indices: number[]): SortStep {
  return { type: 'swap', indices };
}

function remove(indices: number[]): SortStep {
  return { type: 'delete', indices };
}

function markSorted(index: number): SortStep {
  return { type: 'mark-sorted', indices: [index] };
}

function setPivot(index: number): SortStep {
  return { type: 'set-pivot', indices: [index] };
}

function clearPivot(): SortStep {
  return { type: 'clear-pivot', indices: [] };
}

function markAllSorted(length: number): SortStep[] {
  return Array.from({ length }, (_, index) => markSorted(index));
}

function bubbleSortSteps(input: number[]): SortStep[] {
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

function insertionSortSteps(input: number[]): SortStep[] {
  const values = [...input];
  const steps: SortStep[] = [];

  for (let index = 1; index < values.length; index += 1) {
    let currentIndex = index;

    while (currentIndex > 0) {
      steps.push(compare([currentIndex - 1, currentIndex]));

      if (values[currentIndex - 1] <= values[currentIndex]) {
        break;
      }

      steps.push(swap([currentIndex - 1, currentIndex]));
      [values[currentIndex - 1], values[currentIndex]] = [
        values[currentIndex],
        values[currentIndex - 1],
      ];
      currentIndex -= 1;
    }
  }

  return [...steps, ...markAllSorted(values.length)];
}

function quickSortSteps(input: number[]): SortStep[] {
  const values = [...input];
  const steps: SortStep[] = [];

  function partition(low: number, high: number): number {
    const pivot = values[high];
    let boundary = low;

    steps.push(setPivot(high));

    for (let index = low; index < high; index += 1) {
      steps.push(compare([index, high]));

      if (values[index] < pivot) {
        if (boundary !== index) {
          steps.push(swap([boundary, index]));
          [values[boundary], values[index]] = [values[index], values[boundary]];
        }
        boundary += 1;
      }
    }

    if (boundary !== high) {
      steps.push(swap([boundary, high]));
      [values[boundary], values[high]] = [values[high], values[boundary]];
    }

    steps.push(markSorted(boundary));
    steps.push(clearPivot());

    return boundary;
  }

  function sort(low: number, high: number): void {
    if (low > high) {
      return;
    }

    if (low === high) {
      steps.push(markSorted(low));
      return;
    }

    const pivotIndex = partition(low, high);
    sort(low, pivotIndex - 1);
    sort(pivotIndex + 1, high);
  }

  sort(0, values.length - 1);
  return steps;
}

function mergeSortSteps(input: number[]): SortStep[] {
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

function stalinSortSteps(input: number[]): SortStep[] {
  const values = [...input];
  const steps: SortStep[] = [];

  if (values.length <= 1) {
    return values.length === 1 ? [markSorted(0)] : [];
  }

  let currentMaximum = values[0];
  let index = 1;

  while (index < values.length) {
    steps.push(compare([index - 1, index]));

    if (values[index] >= currentMaximum) {
      currentMaximum = values[index];
      index += 1;
      continue;
    }

    steps.push(remove([index]));
    values.splice(index, 1);
  }

  return [...steps, ...markAllSorted(values.length)];
}

function countingSortSteps(input: number[]): SortStep[] {
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

function heapSortSteps(input: number[]): SortStep[] {
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

function bogoSortSteps(input: number[]): SortStep[] {
  return input.length <= 1 && input.length === 1 ? [markSorted(0)] : [];
}

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
    case 'stalin':
      return stalinSortSteps(input);
    case 'counting':
      return countingSortSteps(input);
    case 'heap':
      return heapSortSteps(input);
    case 'bogo':
      return bogoSortSteps(input);
  }
}
