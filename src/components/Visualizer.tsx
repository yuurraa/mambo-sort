import { useEffect, useRef, useState, type CSSProperties } from 'react';
import type { SortAlgorithm } from '../types';
import {
  ARRAY_SIZE_RANGE,
  SPEED_RANGE,
  algorithmLabel,
} from '../utils/array';
import {
  getSegmentBackgroundPosition,
  getSegmentId,
} from '../utils/media';

type VisualizerProps = {
  algorithm: SortAlgorithm;
  arraySize: number;
  speed: number;
  status: 'idle' | 'running' | 'paused' | 'completed';
  values: number[];
  comparing: number[];
  swapping: number[];
  sorted: number[];
  finalPassIndex: number | null;
  pivotIndex: number | null;
  activeSortLabel: string | null;
  imageUrl: string | null;
  onAlgorithmChange: (algorithm: SortAlgorithm) => void;
  onArraySizeChange: (size: number) => void;
  onSpeedChange: (speed: number) => void;
  onGenerateArray: () => void;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
};

const legendItems = [
  { label: 'Comparing', className: 'legend-compare' },
  { label: 'Swapping', className: 'legend-swap' },
  { label: 'Pivot', className: 'legend-pivot' },
  { label: 'Sorted', className: 'legend-sorted' },
];

const algorithms: SortAlgorithm[] = [
  'bubble',
  'insertion',
  'quick',
  'merge',
  'counting',
  'heap',
  'stalin',
  'thanos',
  'schizophrenia',
  'kidnapping',
  'bogo',
];

export function Visualizer({
  algorithm,
  arraySize,
  speed,
  status,
  values,
  comparing,
  swapping,
  sorted,
  finalPassIndex,
  pivotIndex,
  activeSortLabel,
  imageUrl,
  onAlgorithmChange,
  onArraySizeChange,
  onSpeedChange,
  onGenerateArray,
  onStart,
  onPause,
  onReset,
}: VisualizerProps) {
  const [isAlgorithmMenuOpen, setIsAlgorithmMenuOpen] = useState(false);
  const algorithmMenuRef = useRef<HTMLDivElement | null>(null);
  const comparingSet = new Set(comparing);
  const swappingSet = new Set(swapping);
  const sortedSet = new Set(sorted);
  const isRunning = status === 'running';
  const canPlay = status !== 'running';
  const isKidnapping = activeSortLabel === 'Kidnapping';
  const isReturning = activeSortLabel === 'Returning';
  const isRedistributing = activeSortLabel === 'Redistribution';

  useEffect(() => {
    if (!isRunning) {
      return;
    }

    setIsAlgorithmMenuOpen(false);
  }, [isRunning]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent): void {
      if (!algorithmMenuRef.current?.contains(event.target as Node)) {
        setIsAlgorithmMenuOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent): void {
      if (event.key === 'Escape') {
        setIsAlgorithmMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  function createSegmentStyle(value: number): CSSProperties | undefined {
    if (!imageUrl) {
      return undefined;
    }

    return {
      backgroundImage: `url(${imageUrl})`,
      backgroundSize: `${arraySize * 100}% 100%`,
      backgroundPosition: getSegmentBackgroundPosition(
        getSegmentId(value),
        arraySize,
      ),
    };
  }

  return (
    <section className="shell-card visualizer-card">
      <div className="visualizer-head">
        <h2>Mambo Visualiser</h2>

        <div className="legend-row" aria-label="Color legend">
          {legendItems.map((item) => (
            <div key={item.label} className="legend-item">
              <span className={`legend-swatch ${item.className}`} />
              {item.label}
            </div>
          ))}
        </div>
      </div>

      <div className="visualizer-layout">
        <div className="visualizer-stage">
          {isKidnapping || isReturning || isRedistributing ? (
            <div
              className={`sort-event-badge ${
                isKidnapping
                  ? 'is-kidnapping'
                  : isReturning
                    ? 'is-returning'
                    : 'is-redistributing'
              }`}
              aria-live="polite"
            >
              {isKidnapping
                ? 'Kidnapping segments'
                : isReturning
                  ? 'Returning segments'
                  : 'Redistributing hostages'}
            </div>
          ) : null}

          <div className="bars-wrapper">
            {values.map((value, index) => {
              const classes = ['bar'];

              if (pivotIndex === index) {
                classes.push('is-pivot');
              }

              if (comparingSet.has(index)) {
                classes.push('is-comparing');
              }

              if (swappingSet.has(index)) {
                classes.push('is-swapping');
              }

              if (sortedSet.has(index) || getSegmentId(value) === index) {
                classes.push('is-sorted');
              }

              if (finalPassIndex !== null && index <= finalPassIndex) {
                classes.push('is-final-pass');
              }

              if (isKidnapping && comparingSet.has(index)) {
                classes.push('is-kidnapped');
              }

              if (
                isReturning &&
                (comparingSet.has(index) || swappingSet.has(index))
              ) {
                classes.push('is-returning');
              }

              if (isRedistributing && swappingSet.has(index)) {
                classes.push('is-redistributing');
              }

              return (
                <div key={index} className="bar-slot">
                  <div
                    className={classes.join(' ')}
                    aria-label={`Bar ${index + 1} carrying segment ${value}`}
                  >
                    <div className="bar-segment">
                      <div
                        className={`bar-media ${imageUrl ? '' : 'is-fallback'}`.trim()}
                        style={createSegmentStyle(value)}
                      />
                    </div>
                    <div className="bar-status" aria-hidden="true" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="visualizer-side">
          <aside className="controls-side-card">
            <h3 className="controls-title">Controls</h3>

            <label className={`side-control-field ${isRunning ? 'is-disabled' : ''}`.trim()}>
              <div className="side-control-head">
                <span>Algorithm</span>
              </div>
              <div
                ref={algorithmMenuRef}
                className={`algorithm-dropdown ${isAlgorithmMenuOpen ? 'is-open' : ''}`.trim()}
              >
                <button
                  className="algorithm-dropdown-trigger"
                  type="button"
                  disabled={isRunning}
                  aria-haspopup="listbox"
                  aria-expanded={isAlgorithmMenuOpen}
                  onClick={() => setIsAlgorithmMenuOpen((open) => !open)}
                >
                  <span className="algorithm-dropdown-value">
                    {algorithmLabel(algorithm)}
                    {algorithm === 'bogo' || algorithm === 'stalin' || algorithm === 'thanos' || algorithm === 'schizophrenia' || algorithm === 'kidnapping' ? (
                      <span className="algorithm-warning-badge" aria-label="Gag sort warning">
                        (!)
                      </span>
                    ) : null}
                  </span>
                  <span className="algorithm-dropdown-caret" aria-hidden="true">
                    ▾
                  </span>
                </button>

                {isAlgorithmMenuOpen ? (
                  <div className="algorithm-dropdown-menu" role="listbox" aria-label="Algorithm">
                    {algorithms.map((option) => {
                      const isSelected = option === algorithm;

                      return (
                        <button
                          key={option}
                          className={`algorithm-dropdown-option ${isSelected ? 'is-selected' : ''}`.trim()}
                          type="button"
                          role="option"
                          aria-selected={isSelected}
                          onClick={() => {
                            onAlgorithmChange(option);
                            setIsAlgorithmMenuOpen(false);
                          }}
                        >
                          <span>{algorithmLabel(option)}</span>
                          {option === 'bogo' || option === 'stalin' || option === 'thanos' || option === 'schizophrenia' || option === 'kidnapping' ? (
                            <span className="algorithm-warning-badge" aria-hidden="true">
                              (!)
                            </span>
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            </label>

            <label className={`side-control-field ${isRunning ? 'is-disabled' : ''}`.trim()}>
              <div className="side-control-head">
                <span>Segment Count</span>
                <strong>{arraySize}</strong>
              </div>
              <input
                type="range"
                min={ARRAY_SIZE_RANGE.min}
                max={ARRAY_SIZE_RANGE.max}
                value={arraySize}
                disabled={isRunning}
                onChange={(event) =>
                  onArraySizeChange(Number(event.target.value))
                }
              />
            </label>

            <label className="side-control-field">
              <div className="side-control-head">
                <span>Speed</span>
                <strong>{speed}</strong>
              </div>
              <input
                type="range"
                min={SPEED_RANGE.min}
                max={SPEED_RANGE.max}
                value={speed}
                onChange={(event) =>
                  onSpeedChange(Number(event.target.value))
                }
              />
            </label>

            <div className="controls-action-row">
              <button
                className="primary-button controls-button"
                type="button"
                onClick={onStart}
                disabled={!canPlay}
              >
                Play
              </button>
              <button
                className="secondary-button controls-button"
                type="button"
                onClick={onPause}
                disabled={!isRunning}
              >
                Pause
              </button>
              <button
                className="secondary-button controls-button"
                type="button"
                onClick={onReset}
              >
                Reset
              </button>
              <button
                className="secondary-button controls-button"
                type="button"
                onClick={onGenerateArray}
                disabled={isRunning}
              >
                Shuffle
              </button>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
