import type { SortStep } from '../types';
import { compare, markSorted, swap } from './steps';

const KIDNAP_CHANCE = 0.05;
const KIDNAP_SEGMENT_RATIO = 0.1;
const MERGE_KIDNAP_ROLL_INTERVAL = 12;
const HOLD_STEPS = 44;
const MIN_KIDNAPPED = 5;
const RETURN_HOLD_MS = 1000;

type SortFrame = {
  type: 'sort';
  startIndex: number;
  endIndex: number;
};

type MergeFrame = {
  type: 'merge';
  startIndex: number;
  leftIndex: number;
  rightIndex: number;
  splitIndex: number;
  endIndex: number;
  phase: 'compare' | 'swap';
  swapIndex: number | null;
  rolledKidnap: boolean;
  mergeStepsUntilKidnapRoll: number;
};

type RecursionFrame = SortFrame | MergeFrame;

export type KidnappingRuntime = {
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

function tagged(step: SortStep, source: string): SortStep {
  return { ...step, source };
}

function shuffled<T>(items: T[]): T[] {
  const nextItems = [...items];

  for (let index = nextItems.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [nextItems[index], nextItems[randomIndex]] = [
      nextItems[randomIndex],
      nextItems[index],
    ];
  }

  return nextItems;
}

function createKidnappedIndices(startIndex: number, endIndex: number): number[] {
  const length = endIndex - startIndex + 1;
  const hostageCount = Math.min(
    length,
    Math.max(MIN_KIDNAPPED, Math.round(length * KIDNAP_SEGMENT_RATIO)),
  );

  return shuffled(Array.from({ length }, (_, index) => startIndex + index))
    .slice(0, hostageCount)
    .sort((left, right) => left - right);
}

function createReturnIndices(length: number, returnCount: number): number[] {
  return shuffled(Array.from({ length }, (_, index) => index))
    .slice(0, returnCount)
    .sort((left, right) => left - right);
}

function redistributeHostages(
  values: number[],
  steps: SortStep[],
  kidnappedIndices: number[],
): void {
  const kidnappedValues = kidnappedIndices.map((index) => values[index]);
  const returnIndices = createReturnIndices(values.length, kidnappedValues.length);

  kidnappedValues.forEach((hostageValue, index) => {
    const fromIndex = values.indexOf(hostageValue);
    const toIndex = returnIndices[index];

    if (fromIndex === -1 || fromIndex === toIndex) {
      return;
    }

    steps.push(tagged(swap([fromIndex, toIndex]), 'Redistribution'));
    [values[fromIndex], values[toIndex]] = [
      values[toIndex],
      values[fromIndex],
    ];
  });

  steps.push({
    ...tagged(compare(returnIndices), 'Returning'),
    durationMs: RETURN_HOLD_MS,
  });
}

function enqueueKidnapping(
  values: number[],
  pendingSteps: SortStep[],
  startIndex: number,
  endIndex: number,
): boolean {
  if (endIndex - startIndex < 2 || Math.random() > KIDNAP_CHANCE) {
    return false;
  }

  const kidnappedIndices = createKidnappedIndices(startIndex, endIndex);

  for (let holdIndex = 0; holdIndex < HOLD_STEPS; holdIndex += 1) {
    pendingSteps.push(tagged(compare(kidnappedIndices), 'Kidnapping'));
  }

  redistributeHostages(values, pendingSteps, kidnappedIndices);
  return true;
}

function enqueueSwap(
  values: number[],
  steps: SortStep[],
  firstIndex: number,
  secondIndex: number,
): void {
  if (firstIndex === secondIndex) {
    return;
  }

  steps.push(tagged(swap([firstIndex, secondIndex]), 'Merge Sort'));
  [values[firstIndex], values[secondIndex]] = [
    values[secondIndex],
    values[firstIndex],
  ];
}

function createMergeFrame(
  startIndex: number,
  middleIndex: number,
  endIndex: number,
): MergeFrame {
  return {
    type: 'merge',
    startIndex,
    leftIndex: startIndex,
    rightIndex: middleIndex + 1,
    splitIndex: middleIndex,
    endIndex,
    phase: 'compare',
    swapIndex: null,
    rolledKidnap: false,
    mergeStepsUntilKidnapRoll: MERGE_KIDNAP_ROLL_INTERVAL,
  };
}

export function createKidnappingRuntime(input: number[]): KidnappingRuntime {
  const values = [...input];
  const pendingSteps: SortStep[] = [];
  const recursionStack: RecursionFrame[] = [];
  let isDone = values.length <= 1;

  function enqueueSortFrame(frame: SortFrame): boolean {
    if (frame.startIndex >= frame.endIndex) {
      return false;
    }

    const middleIndex = Math.floor((frame.startIndex + frame.endIndex) / 2);

    recursionStack.push(
      createMergeFrame(frame.startIndex, middleIndex, frame.endIndex),
      {
        type: 'sort',
        startIndex: middleIndex + 1,
        endIndex: frame.endIndex,
      },
      {
        type: 'sort',
        startIndex: frame.startIndex,
        endIndex: middleIndex,
      },
    );

    return enqueueKidnapping(
      values,
      pendingSteps,
      frame.startIndex,
      frame.endIndex,
    );
  }

  function enqueueMergeFrame(frame: MergeFrame): boolean {
    if (!frame.rolledKidnap) {
      frame.rolledKidnap = true;
      recursionStack.push(frame);

      return enqueueKidnapping(
        values,
        pendingSteps,
        frame.startIndex,
        frame.endIndex,
      );
    }

    while (frame.leftIndex <= frame.splitIndex && frame.rightIndex <= frame.endIndex) {
      if (frame.mergeStepsUntilKidnapRoll <= 0) {
        frame.mergeStepsUntilKidnapRoll = MERGE_KIDNAP_ROLL_INTERVAL;
        recursionStack.push(frame);

        return enqueueKidnapping(
          values,
          pendingSteps,
          frame.startIndex,
          frame.endIndex,
        );
      }

      if (frame.phase === 'compare') {
        pendingSteps.push(
          tagged(compare([frame.leftIndex, frame.rightIndex]), 'Merge Sort'),
        );
        frame.mergeStepsUntilKidnapRoll -= 1;

        if (values[frame.leftIndex] <= values[frame.rightIndex]) {
          frame.leftIndex += 1;
        } else {
          frame.phase = 'swap';
          frame.swapIndex = frame.rightIndex;
        }

        recursionStack.push(frame);
        return true;
      }

      if (frame.swapIndex !== null && frame.swapIndex > frame.leftIndex) {
        enqueueSwap(values, pendingSteps, frame.swapIndex - 1, frame.swapIndex);
        frame.mergeStepsUntilKidnapRoll -= 1;
        frame.swapIndex -= 1;
        recursionStack.push(frame);
        return true;
      }

      frame.leftIndex += 1;
      frame.splitIndex += 1;
      frame.rightIndex += 1;
      frame.phase = 'compare';
      frame.swapIndex = null;
    }

    return false;
  }

  function enqueueNextRecursiveStep(): void {
    if (isSorted(values)) {
      isDone = true;
      return;
    }

    if (recursionStack.length === 0) {
      recursionStack.push({
        type: 'sort',
        startIndex: 0,
        endIndex: values.length - 1,
      });
    }

    while (pendingSteps.length === 0 && recursionStack.length > 0) {
      const frame = recursionStack.pop();

      if (!frame) {
        break;
      }

      const didEnqueue =
        frame.type === 'sort'
          ? enqueueSortFrame(frame)
          : enqueueMergeFrame(frame);

      if (didEnqueue) {
        return;
      }
    }
  }

  return {
    nextStep: () => {
      while (pendingSteps.length === 0 && !isDone) {
        enqueueNextRecursiveStep();
      }

      return pendingSteps.shift() ?? null;
    },
  };
}

export function kidnappingSortSteps(input: number[]): SortStep[] {
  return input.length === 1 ? [markSorted(0)] : [];
}
