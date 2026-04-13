export type SortAlgorithm =
  | 'bubble'
  | 'insertion'
  | 'quick'
  | 'merge'
  | 'counting'
  | 'heap'
  | 'stalin'
  | 'thanos'
  | 'schizophrenia'
  | 'kidnapping'
  | 'bogo';

export type SortStepType =
  | 'compare'
  | 'swap'
  | 'delete'
  | 'mark-sorted'
  | 'set-pivot'
  | 'clear-pivot';

export interface SortStep {
  type: SortStepType;
  indices: number[];
  source?: string;
  durationMs?: number;
}

export interface SortTouchItem {
  index: number;
  value: number;
  segmentId: number;
}

export interface SortTouchRequest {
  type: 'compare' | 'swap';
  items: SortTouchItem[];
  arrayLength: number;
}

export type MediaStatus = 'loading' | 'ready' | 'partial' | 'missing';

export interface MediaSourceState {
  imageUrl: string | null;
  audioUrl: string | null;
  imageReady: boolean;
  audioReady: boolean;
  status: MediaStatus;
}

export interface VisualState {
  array: number[];
  comparing: number[];
  swapping: number[];
  sorted: number[];
  pivotIndex: number | null;
  currentStepType: SortStepType | null;
  stepIndex: number;
  swapCount: number;
  elapsedMs: number;
  activeSortLabel: string | null;
  status: 'idle' | 'running' | 'paused' | 'completed';
}
