import type { SortStep } from '../types';
import {
  clearPivot,
  compare,
  markSorted,
  setPivot,
  swap,
} from './steps';

const HALLUCINATION_CHANCE = 0.007;

type PassRunner = {
  name: string;
  label: string;
  run: (values: number[], steps: SortStep[], passIndex: number) => void;
};

export type SchizophreniaRuntime = {
  nextStep: () => SortStep | null;
};

function isSorted(values: number[]): boolean {
  for (let index = 1; index < values.length; index += 1) {
    if (values[index - 1] > values[index]) {
      return false;
    }
  }

  return true;
}

function recordSwap(
  values: number[],
  steps: SortStep[],
  firstIndex: number,
  secondIndex: number,
): void {
  if (firstIndex === secondIndex) {
    return;
  }

  steps.push(swap([firstIndex, secondIndex]));
  [values[firstIndex], values[secondIndex]] = [
    values[secondIndex],
    values[firstIndex],
  ];
}

function tagSteps(steps: SortStep[], source: string): SortStep[] {
  return steps.map((step) => ({ ...step, source }));
}

function compareAndSwapIfInverted(
  values: number[],
  steps: SortStep[],
  leftIndex: number,
  rightIndex: number,
): boolean {
  steps.push(compare([leftIndex, rightIndex]));

  if (values[leftIndex] <= values[rightIndex]) {
    return false;
  }

  recordSwap(values, steps, leftIndex, rightIndex);
  return true;
}

function bubblePass(values: number[], steps: SortStep[]): void {
  for (let index = 0; index < values.length - 1; index += 1) {
    compareAndSwapIfInverted(values, steps, index, index + 1);
  }
}

function insertionPass(
  values: number[],
  steps: SortStep[],
  passIndex: number,
): void {
  let currentIndex = (passIndex % (values.length - 1)) + 1;

  while (currentIndex > 0) {
    const swapped = compareAndSwapIfInverted(
      values,
      steps,
      currentIndex - 1,
      currentIndex,
    );

    if (!swapped) {
      break;
    }

    currentIndex -= 1;
  }
}

function quickPartitionPass(values: number[], steps: SortStep[]): void {
  const lowIndex = 0;
  const highIndex = values.length - 1;
  const pivotValue = values[highIndex];
  let boundaryIndex = lowIndex;

  steps.push(setPivot(highIndex));

  for (let index = lowIndex; index < highIndex; index += 1) {
    steps.push(compare([index, highIndex]));

    if (values[index] < pivotValue) {
      recordSwap(values, steps, boundaryIndex, index);
      boundaryIndex += 1;
    }
  }

  recordSwap(values, steps, boundaryIndex, highIndex);
  steps.push(clearPivot());
}

function mergeWindowPass(
  values: number[],
  steps: SortStep[],
  passIndex: number,
): void {
  const levelCount = Math.max(1, Math.ceil(Math.log2(values.length)));
  const width = 2 ** (passIndex % levelCount);
  const blockSize = width * 2;
  const blockIndex = Math.floor(passIndex / levelCount);
  const startIndex = (blockIndex * blockSize) % values.length;
  const middleIndex = Math.min(startIndex + width - 1, values.length - 1);
  const endIndex = Math.min(startIndex + blockSize - 1, values.length - 1);

  if (middleIndex >= endIndex) {
    bubblePass(values, steps);
    return;
  }

  let leftIndex = startIndex;
  let rightIndex = middleIndex + 1;
  let splitIndex = middleIndex;

  while (leftIndex <= splitIndex && rightIndex <= endIndex) {
    steps.push(compare([leftIndex, rightIndex]));

    if (values[leftIndex] <= values[rightIndex]) {
      leftIndex += 1;
      continue;
    }

    for (let swapIndex = rightIndex; swapIndex > leftIndex; swapIndex -= 1) {
      recordSwap(values, steps, swapIndex - 1, swapIndex);
    }

    leftIndex += 1;
    splitIndex += 1;
    rightIndex += 1;
  }
}

function countingPlacementPass(
  values: number[],
  steps: SortStep[],
  passIndex: number,
): void {
  const targetIndex = passIndex % values.length;
  const targetOrder = [...values].sort((left, right) => left - right);
  const targetValue = targetOrder[targetIndex];
  let currentIndex = values.indexOf(targetValue);

  while (currentIndex !== targetIndex) {
    if (currentIndex > targetIndex) {
      steps.push(compare([currentIndex - 1, currentIndex]));
      recordSwap(values, steps, currentIndex - 1, currentIndex);
      currentIndex -= 1;
      continue;
    }

    steps.push(compare([currentIndex, currentIndex + 1]));
    recordSwap(values, steps, currentIndex, currentIndex + 1);
    currentIndex += 1;
  }
}

function heapSiftPass(
  values: number[],
  steps: SortStep[],
  passIndex: number,
): void {
  const parentCount = Math.max(1, Math.floor(values.length / 2));
  let rootIndex = parentCount - 1 - (passIndex % parentCount);

  while (true) {
    const leftChildIndex = rootIndex * 2 + 1;
    const rightChildIndex = leftChildIndex + 1;
    let smallestIndex = rootIndex;

    if (leftChildIndex < values.length) {
      steps.push(compare([smallestIndex, leftChildIndex]));

      if (values[leftChildIndex] < values[smallestIndex]) {
        smallestIndex = leftChildIndex;
      }
    }

    if (rightChildIndex < values.length) {
      steps.push(compare([smallestIndex, rightChildIndex]));

      if (values[rightChildIndex] < values[smallestIndex]) {
        smallestIndex = rightChildIndex;
      }
    }

    if (smallestIndex === rootIndex) {
      break;
    }

    recordSwap(values, steps, rootIndex, smallestIndex);
    rootIndex = smallestIndex;
  }
}

function bogoPass(values: number[], steps: SortStep[]): void {
  for (let index = values.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));

    steps.push(compare([index, randomIndex]));
    recordSwap(values, steps, index, randomIndex);
  }
}

function maybeHallucinateBogoPass(values: number[], steps: SortStep[]): void {
  if (values.length < 2 || Math.random() > HALLUCINATION_CHANCE) {
    return;
  }

  const hallucinationSteps: SortStep[] = [];
  bogoPass(values, hallucinationSteps);
  steps.push(...tagSteps(hallucinationSteps, 'Bogo Sort'));
}

const passRunners: PassRunner[] = [
  { name: 'bubble', label: 'Bubble Sort', run: bubblePass },
  { name: 'insertion', label: 'Insertion Sort', run: insertionPass },
  { name: 'quick', label: 'Quick Sort', run: quickPartitionPass },
  { name: 'merge', label: 'Merge Sort', run: mergeWindowPass },
  { name: 'counting', label: 'Counting Sort', run: countingPlacementPass },
  { name: 'heap', label: 'Heap Sort', run: heapSiftPass },
];

function pickNextRunner(previousRunner: PassRunner | null): PassRunner {
  const options = previousRunner
    ? passRunners.filter((runner) => runner.name !== previousRunner.name)
    : passRunners;
  const randomIndex = Math.floor(Math.random() * options.length);

  return options[randomIndex];
}

export function createSchizophreniaRuntime(input: number[]): SchizophreniaRuntime {
  const values = [...input];
  const pendingSteps: SortStep[] = [];
  let previousRunner: PassRunner | null = null;
  const runnerPassCounts = new Map<string, number>();
  let isDone = values.length <= 1;

  function enqueueNextPass(): void {
    if (isSorted(values)) {
      isDone = true;
      return;
    }

    const runner = pickNextRunner(previousRunner);
    const passSteps: SortStep[] = [];
    const runnerPassIndex = runnerPassCounts.get(runner.name) ?? 0;

    runner.run(values, passSteps, runnerPassIndex);
    runnerPassCounts.set(runner.name, runnerPassIndex + 1);
    pendingSteps.push(...tagSteps(passSteps, runner.label));
    maybeHallucinateBogoPass(values, pendingSteps);
    previousRunner = runner;
  }

  return {
    nextStep: () => {
      while (pendingSteps.length === 0 && !isDone) {
        enqueueNextPass();
      }

      return pendingSteps.shift() ?? null;
    },
  };
}

export function schizophreniaSortSteps(input: number[]): SortStep[] {
  return input.length === 1 ? [markSorted(0)] : [];
}
