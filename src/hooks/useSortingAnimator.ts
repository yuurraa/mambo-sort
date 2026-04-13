import { useEffect, useRef, useState } from 'react';
import {
  createSchizophreniaRuntime,
  type SchizophreniaRuntime,
} from '../algorithms/schizophreniaSort';
import type {
  SortAlgorithm,
  SortStep,
  SortTouchRequest,
  VisualState,
} from '../types';
import { getSegmentId } from '../utils/media';

type UseSortingAnimatorOptions = {
  algorithm: SortAlgorithm;
  initialArray: number[];
  steps: SortStep[];
  stepDurationMs: number;
  onTouch?: (request: SortTouchRequest) => void;
};

const MAX_STEPS_PER_FRAME = 120;

type BogoRuntimeState =
  | {
      mode: 'check';
      index: number;
      sortedCandidate: boolean;
    }
  | {
      mode: 'shuffle';
      index: number;
    };

function createVisualState(array: number[]): VisualState {
  return {
    array: [...array],
    comparing: [],
    swapping: [],
    sorted: [],
    pivotIndex: null,
    currentStepType: null,
    stepIndex: 0,
    swapCount: 0,
    elapsedMs: 0,
    activeSortLabel: null,
    status: 'idle',
  };
}

function mergeSorted(sorted: number[], incoming: number[]): number[] {
  const next = new Set(sorted);
  incoming.forEach((index) => next.add(index));
  return [...next].sort((left, right) => left - right);
}

export function useSortingAnimator({
  algorithm,
  initialArray,
  steps,
  stepDurationMs,
  onTouch,
}: UseSortingAnimatorOptions) {
  const [visualState, setVisualState] = useState<VisualState>(() =>
    createVisualState(initialArray),
  );

  const frameRef = useRef<number | null>(null);
  const stepIndexRef = useRef(0);
  const lastFrameAtRef = useRef<number | null>(null);
  const isRunningRef = useRef(false);
  const stepDurationRef = useRef(stepDurationMs);
  const stateRef = useRef<VisualState>(createVisualState(initialArray));
  const stepsRef = useRef<SortStep[]>(steps);
  const algorithmRef = useRef<SortAlgorithm>(algorithm);
  const initialArrayRef = useRef<number[]>(initialArray);
  const onTouchRef = useRef(onTouch);
  const runStartedAtRef = useRef<number | null>(null);
  const accumulatedElapsedMsRef = useRef(0);
  const schizophreniaRuntimeRef = useRef<SchizophreniaRuntime>(
    createSchizophreniaRuntime(initialArray),
  );
  const bogoStateRef = useRef<BogoRuntimeState>({
    mode: 'check',
    index: 0,
    sortedCandidate: true,
  });

  stepDurationRef.current = stepDurationMs;
  onTouchRef.current = onTouch;
  algorithmRef.current = algorithm;

  function syncState(nextState: VisualState): void {
    stateRef.current = nextState;
    setVisualState(nextState);
  }

  function getElapsedMs(now?: number): number {
    if (!isRunningRef.current || runStartedAtRef.current === null || now === undefined) {
      return accumulatedElapsedMsRef.current;
    }

    return accumulatedElapsedMsRef.current + (now - runStartedAtRef.current);
  }

  function stopLoop(): void {
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
    lastFrameAtRef.current = null;
    isRunningRef.current = false;
    runStartedAtRef.current = null;
  }

  function finishAnimation(): void {
    const elapsedMs = getElapsedMs(lastFrameAtRef.current ?? undefined);
    accumulatedElapsedMsRef.current = elapsedMs;
    stopLoop();

    const visibleLength = stateRef.current.array.length;
    const completeState: VisualState = {
      ...stateRef.current,
      comparing: [],
      swapping: [],
      pivotIndex: null,
      currentStepType: null,
      sorted: Array.from({ length: visibleLength }, (_, index) => index),
      stepIndex: stepIndexRef.current,
      elapsedMs,
      activeSortLabel: null,
      status: 'completed',
    };

    syncState(completeState);
  }

  function reset(): void {
    stopLoop();
    stepIndexRef.current = 0;
    accumulatedElapsedMsRef.current = 0;
    bogoStateRef.current = {
      mode: 'check',
      index: 0,
      sortedCandidate: true,
    };
    schizophreniaRuntimeRef.current = createSchizophreniaRuntime(
      initialArrayRef.current,
    );
    syncState(createVisualState(initialArrayRef.current));
  }

  function advanceBogo(timestamp: number): void {
    const currentState = stateRef.current;
    const arrayLength = currentState.array.length;

    if (arrayLength <= 1) {
      finishAnimation();
      return;
    }

    const nextArray = [...currentState.array];
    let comparing: number[] = [];
    let swapping: number[] = [];
    let touchRequest: SortTouchRequest | undefined;
    let currentStepType: SortStep['type'] = 'compare';

    while (true) {
      const runtimeState = bogoStateRef.current;

      if (runtimeState.mode === 'check') {
        if (runtimeState.index >= arrayLength - 1) {
          if (runtimeState.sortedCandidate) {
            finishAnimation();
            return;
          }

          bogoStateRef.current = {
            mode: 'shuffle',
            index: arrayLength - 1,
          };
          continue;
        }

        const leftIndex = runtimeState.index;
        const rightIndex = leftIndex + 1;
        comparing = [leftIndex, rightIndex];
        currentStepType = 'compare';
        touchRequest = {
          type: 'compare',
          items: [leftIndex, rightIndex].map((index) => ({
            index,
            value: currentState.array[index],
            segmentId: getSegmentId(currentState.array[index]),
          })),
          arrayLength,
        };

        bogoStateRef.current = {
          mode: 'check',
          index: rightIndex,
          sortedCandidate:
            runtimeState.sortedCandidate &&
            currentState.array[leftIndex] <= currentState.array[rightIndex],
        };
        break;
      }

      if (runtimeState.index <= 0) {
        bogoStateRef.current = {
          mode: 'check',
          index: 0,
          sortedCandidate: true,
        };
        continue;
      }

      const leftIndex = runtimeState.index;
      const rightIndex = Math.floor(Math.random() * (runtimeState.index + 1));
      swapping = [leftIndex, rightIndex];
      currentStepType = 'swap';
      touchRequest = {
        type: 'swap',
        items: [leftIndex, rightIndex].map((index) => ({
          index,
          value: currentState.array[index],
          segmentId: getSegmentId(currentState.array[index]),
        })),
        arrayLength,
      };
      [nextArray[leftIndex], nextArray[rightIndex]] = [
        nextArray[rightIndex],
        nextArray[leftIndex],
      ];
      bogoStateRef.current = {
        mode: 'shuffle',
        index: runtimeState.index - 1,
      };
      break;
    }

    stepIndexRef.current += 1;

    const nextState: VisualState = {
      array: nextArray,
      comparing,
      swapping,
      sorted: [],
      pivotIndex: null,
      currentStepType,
      stepIndex: stepIndexRef.current,
      swapCount:
        currentStepType === 'swap'
          ? currentState.swapCount + 1
          : currentState.swapCount,
      elapsedMs: getElapsedMs(timestamp),
      activeSortLabel: 'Bogo Sort',
      status: 'running',
    };

    syncState(nextState);

    if (touchRequest) {
      onTouchRef.current?.(touchRequest);
    }
  }

  function advance(timestamp: number): void {
    if (algorithmRef.current === 'bogo') {
      advanceBogo(timestamp);
      return;
    }

    const isSchizophrenia = algorithmRef.current === 'schizophrenia';
    const step = isSchizophrenia
      ? schizophreniaRuntimeRef.current.nextStep()
      : stepsRef.current[stepIndexRef.current];

    if (!step) {
      finishAnimation();
      return;
    }

    const currentState = stateRef.current;
    const nextArray = [...currentState.array];
    let nextSorted =
      step.type === 'mark-sorted'
        ? mergeSorted(currentState.sorted, step.indices)
        : currentState.sorted;

    let comparing: number[] = [];
    let swapping: number[] = [];
    let pivotIndex = currentState.pivotIndex;
    let touchRequest: SortTouchRequest | undefined;
    const activeSortLabel = step.source ?? null;

    switch (step.type) {
      case 'compare':
        comparing = step.indices;
        touchRequest = {
          type: 'compare',
          items: step.indices.map((index) => ({
            index,
            value: currentState.array[index],
            segmentId: getSegmentId(currentState.array[index]),
          })),
          arrayLength: initialArrayRef.current.length,
        };
        break;
      case 'swap': {
        swapping = step.indices;
        touchRequest = {
          type: 'swap',
          items: step.indices.map((index) => ({
            index,
            value: currentState.array[index],
            segmentId: getSegmentId(currentState.array[index]),
          })),
          arrayLength: initialArrayRef.current.length,
        };
        const [leftIndex, rightIndex] = step.indices;
        [nextArray[leftIndex], nextArray[rightIndex]] = [
          nextArray[rightIndex],
          nextArray[leftIndex],
        ];
        break;
      }
      case 'delete': {
        const deletedIndex = step.indices[0] ?? 0;
        nextArray.splice(deletedIndex, 1);
        nextSorted = currentState.sorted
          .filter((index) => index !== deletedIndex)
          .map((index) => (index > deletedIndex ? index - 1 : index));
        break;
      }
      case 'mark-sorted':
        break;
      case 'set-pivot':
        pivotIndex = step.indices[0] ?? null;
        break;
      case 'clear-pivot':
        pivotIndex = null;
        break;
    }

    stepIndexRef.current += 1;

    const nextState: VisualState = {
      array: nextArray,
      comparing,
      swapping,
      sorted: nextSorted,
      pivotIndex,
      currentStepType: step.type,
      stepIndex: stepIndexRef.current,
      swapCount:
        step.type === 'swap' ||
        (
          step.type === 'delete' &&
          (algorithmRef.current === 'stalin' || algorithmRef.current === 'thanos')
        )
          ? currentState.swapCount + 1
          : currentState.swapCount,
      elapsedMs: getElapsedMs(timestamp),
      activeSortLabel,
      status: 'running',
    };

    syncState(nextState);

    if (touchRequest) {
      onTouchRef.current?.(touchRequest);
    }

    if (!isSchizophrenia && stepIndexRef.current >= stepsRef.current.length) {
      finishAnimation();
    }
  }

  function tick(timestamp: number): void {
    if (!isRunningRef.current) {
      return;
    }

    if (lastFrameAtRef.current === null) {
      lastFrameAtRef.current = timestamp;
    }

    let stepsProcessed = 0;

    while (
      isRunningRef.current &&
      lastFrameAtRef.current !== null &&
      timestamp - lastFrameAtRef.current >= stepDurationRef.current &&
      stepsProcessed < MAX_STEPS_PER_FRAME
    ) {
      const stepTimestamp: number =
        lastFrameAtRef.current + stepDurationRef.current;
      lastFrameAtRef.current = stepTimestamp;
      advance(stepTimestamp);
      stepsProcessed += 1;
    }

    if (isRunningRef.current) {
      frameRef.current = requestAnimationFrame(tick);
    }
  }

  function start(): void {
    if (
      algorithmRef.current !== 'bogo' &&
      algorithmRef.current !== 'schizophrenia' &&
      stepsRef.current.length === 0
    ) {
      finishAnimation();
      return;
    }

    if (
      algorithmRef.current === 'bogo'
        ? stateRef.current.status === 'completed'
        : algorithmRef.current === 'schizophrenia'
          ? stateRef.current.status === 'completed'
          : stepIndexRef.current >= stepsRef.current.length
    ) {
      stepIndexRef.current = 0;
      accumulatedElapsedMsRef.current = 0;
      bogoStateRef.current = {
        mode: 'check',
        index: 0,
        sortedCandidate: true,
      };
      schizophreniaRuntimeRef.current = createSchizophreniaRuntime(
        initialArrayRef.current,
      );
      syncState(createVisualState(initialArrayRef.current));
    }

    if (isRunningRef.current) {
      return;
    }

    isRunningRef.current = true;
    runStartedAtRef.current = performance.now();
    syncState({
      ...stateRef.current,
      elapsedMs: accumulatedElapsedMsRef.current,
      status: 'running',
    });
    frameRef.current = requestAnimationFrame(tick);
  }

  function pause(): void {
    if (!isRunningRef.current) {
      return;
    }

    accumulatedElapsedMsRef.current = getElapsedMs(performance.now());
    stopLoop();
    syncState({
      ...stateRef.current,
      elapsedMs: accumulatedElapsedMsRef.current,
      status: 'paused',
    });
  }

  useEffect(() => {
    stepsRef.current = steps;
    algorithmRef.current = algorithm;
    initialArrayRef.current = [...initialArray];
    stepIndexRef.current = 0;
    accumulatedElapsedMsRef.current = 0;
    bogoStateRef.current = {
      mode: 'check',
      index: 0,
      sortedCandidate: true,
    };
    schizophreniaRuntimeRef.current = createSchizophreniaRuntime(initialArray);
    syncState(createVisualState(initialArray));
    stopLoop();

    return () => {
      stopLoop();
    };
  }, [algorithm, initialArray, steps]);

  return {
    ...visualState,
    totalSteps: algorithm === 'bogo' || algorithm === 'schizophrenia' ? 0 : steps.length,
    start,
    pause,
    reset,
  };
}
