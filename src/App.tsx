import { useEffect, useRef, useState } from 'react';
import { generateSortSteps } from './algorithms';
import { ControlPanel } from './components/ControlPanel';
import { Visualizer } from './components/Visualizer';
import { useSortingAnimator } from './hooks/useSortingAnimator';
import type {
  MediaSourceState,
  SortAlgorithm,
  SortStep,
} from './types';
import { SegmentAudioEngine } from './utils/audio';
import {
  ARRAY_SIZE_RANGE,
  DEFAULT_ALGORITHM,
  DEFAULT_ARRAY_SIZE,
  DEFAULT_SPEED,
  algorithmLabel,
  clamp,
  createShuffledArray,
  speedToStepDuration,
} from './utils/array';
import {
  MEDIA_AUDIO_URL,
  MEDIA_IMAGE_URL,
  checkAudioAsset,
  getSegmentId,
  loadImageAsset,
} from './utils/media';

function createMediaState(
  imageUrl: string | null,
  audioUrl: string | null,
): MediaSourceState {
  const imageReady = imageUrl !== null;
  const audioReady = audioUrl !== null;

  return {
    imageUrl,
    audioUrl,
    imageReady,
    audioReady,
    status:
      imageReady && audioReady
        ? 'ready'
        : imageReady || audioReady
          ? 'partial'
          : 'missing',
  };
}

function calculateChaos(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  const misplacedCount = values.reduce((count, value, index) => {
    return count + (value !== index + 1 ? 1 : 0);
  }, 0);

  return Math.round((misplacedCount / values.length) * 100);
}

export default function App() {
  const [algorithm, setAlgorithm] = useState<SortAlgorithm>(DEFAULT_ALGORITHM);
  const [arraySize, setArraySize] = useState(DEFAULT_ARRAY_SIZE);
  const [speed, setSpeed] = useState(DEFAULT_SPEED);
  const [baseArray, setBaseArray] = useState<number[]>(() =>
    createShuffledArray(DEFAULT_ARRAY_SIZE),
  );
  const [steps, setSteps] = useState<SortStep[]>(() =>
    generateSortSteps(DEFAULT_ALGORITHM, baseArray),
  );
  const [mediaState, setMediaState] = useState<MediaSourceState>({
    imageUrl: null,
    audioUrl: null,
    imageReady: false,
    audioReady: false,
    status: 'loading',
  });
  const [finalPassIndex, setFinalPassIndex] = useState<number | null>(null);

  const isMountedRef = useRef(true);
  const segmentAudioEngineRef = useRef(new SegmentAudioEngine());
  const completedPassKeyRef = useRef<string | null>(null);

  async function refreshMediaSources(): Promise<MediaSourceState> {
    const [imageResult, audioResult] = await Promise.allSettled([
      loadImageAsset(MEDIA_IMAGE_URL),
      checkAudioAsset(MEDIA_AUDIO_URL),
    ]);

    const nextState = createMediaState(
      imageResult.status === 'fulfilled' ? imageResult.value : null,
      audioResult.status === 'fulfilled' ? MEDIA_AUDIO_URL : null,
    );

    if (isMountedRef.current) {
      setMediaState(nextState);
    }

    return nextState;
  }

  const {
    array,
    comparing,
    swapping,
    sorted,
    pivotIndex,
    status,
    stepIndex,
    swapCount,
    elapsedMs,
    activeSortLabel,
    start,
    pause,
    reset,
  } = useSortingAnimator({
    algorithm,
    initialArray: baseArray,
    steps,
    stepDurationMs: speedToStepDuration(speed),
    onTouch: (request) => {
      if (!mediaState.audioReady) {
        return;
      }

      void segmentAudioEngineRef.current.playSegments({
        type: request.type,
        segmentIds: request.items.map((item) => item.segmentId),
        segmentCount: request.arrayLength,
      });
    },
  });

  useEffect(() => {
    isMountedRef.current = true;
    void refreshMediaSources();

    return () => {
      isMountedRef.current = false;
      segmentAudioEngineRef.current.stop();
    };
  }, []);

  useEffect(() => {
    if (status !== 'completed') {
      completedPassKeyRef.current = null;
      setFinalPassIndex(null);
      return;
    }

    if (!mediaState.audioReady) {
      return;
    }

    const completionKey = `${array.length}:${array.join(',')}`;

    if (completedPassKeyRef.current === completionKey) {
      return;
    }

    completedPassKeyRef.current = completionKey;

    void segmentAudioEngineRef.current.playFinalPass({
      segmentIds: array.map((value) => getSegmentId(value)),
      segmentCount: arraySize,
      onSegmentStart: (playIndex) => {
        if (isMountedRef.current) {
          setFinalPassIndex(playIndex);
        }
      },
      onComplete: () => {
        if (isMountedRef.current) {
          setFinalPassIndex(null);
        }
      },
    });
  }, [array, mediaState.audioReady, status]);

  function loadSequence(nextAlgorithm: SortAlgorithm, nextArray: number[]): void {
    const nextBaseArray = [...nextArray];
    setBaseArray(nextBaseArray);
    setSteps(generateSortSteps(nextAlgorithm, nextBaseArray));
    setFinalPassIndex(null);
  }

  function handleGenerateArray(size = arraySize): void {
    loadSequence(algorithm, createShuffledArray(size));
    segmentAudioEngineRef.current.stop();
  }

  function handleAlgorithmChange(nextAlgorithm: SortAlgorithm): void {
    setAlgorithm(nextAlgorithm);
    loadSequence(nextAlgorithm, baseArray);
    segmentAudioEngineRef.current.stop();
  }

  function handleArraySizeChange(nextSize: number): void {
    const clampedSize = clamp(nextSize, ARRAY_SIZE_RANGE.min, ARRAY_SIZE_RANGE.max);
    setArraySize(clampedSize);
    loadSequence(algorithm, createShuffledArray(clampedSize));
    segmentAudioEngineRef.current.stop();
  }

  function handleSpeedChange(nextSpeed: number): void {
    setSpeed(nextSpeed);
  }

  async function handleStart(): Promise<void> {
    const latestMediaState = await refreshMediaSources();

    await segmentAudioEngineRef.current.prepare();
    segmentAudioEngineRef.current.stop();
    setFinalPassIndex(null);

    if (latestMediaState.audioReady && latestMediaState.audioUrl) {
      try {
        await segmentAudioEngineRef.current.loadFromUrl(latestMediaState.audioUrl);
      } catch {
        const fallbackState = createMediaState(
          latestMediaState.imageUrl,
          null,
        );

        if (isMountedRef.current) {
          setMediaState(fallbackState);
        }
      }
    }

    start();
  }

  function handlePause(): void {
    pause();
    segmentAudioEngineRef.current.stop();
    setFinalPassIndex(null);
  }

  function handleReset(): void {
    reset();
    segmentAudioEngineRef.current.stop();
    setFinalPassIndex(null);
  }

  const progress =
    status === 'completed'
      ? 100
      : 100 - calculateChaos(array);
  const usesDeletionCount = algorithm === 'stalin' || algorithm === 'thanos';
  const actionLabel = usesDeletionCount ? 'Deletions' : 'Swaps';
  const trailingStatLabel = 'Progress';
  const trailingStatValue = `${progress}%`;
  const usingLabel =
    algorithm === 'schizophrenia' || algorithm === 'kidnapping'
      ? activeSortLabel ?? algorithmLabel(algorithm)
      : algorithmLabel(algorithm);

  return (
    <main className="app-shell">
      <div className="backdrop-grid" />

      <div className="content">
        <ControlPanel
          status={status}
          stepCount={stepIndex}
          actionCount={swapCount}
          actionLabel={actionLabel}
          elapsedMs={elapsedMs}
          usingLabel={usingLabel}
          trailingStatLabel={trailingStatLabel}
          trailingStatValue={trailingStatValue}
        />

        <Visualizer
          algorithm={algorithm}
          arraySize={arraySize}
          speed={speed}
          status={status}
          values={array}
          comparing={comparing}
          swapping={swapping}
          sorted={sorted}
          finalPassIndex={finalPassIndex}
          pivotIndex={pivotIndex}
          activeSortLabel={activeSortLabel}
          imageUrl={mediaState.imageUrl}
          onAlgorithmChange={handleAlgorithmChange}
          onArraySizeChange={handleArraySizeChange}
          onSpeedChange={handleSpeedChange}
          onGenerateArray={() => handleGenerateArray()}
          onStart={() => {
            void handleStart();
          }}
          onPause={handlePause}
          onReset={handleReset}
        />
      </div>

      <footer className="app-footer">
        <a
          className="app-footer-link"
          href="https://github.com/yuurraa"
          target="_blank"
          rel="noreferrer"
        >
          github.com/yuurraa
        </a>
      </footer>
    </main>
  );
}
