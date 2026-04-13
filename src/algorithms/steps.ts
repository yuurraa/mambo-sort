import type { SortStep } from '../types';

export function compare(indices: number[]): SortStep {
  return { type: 'compare', indices };
}

export function swap(indices: number[]): SortStep {
  return { type: 'swap', indices };
}

export function remove(indices: number[]): SortStep {
  return { type: 'delete', indices };
}

export function markSorted(index: number): SortStep {
  return { type: 'mark-sorted', indices: [index] };
}

export function setPivot(index: number): SortStep {
  return { type: 'set-pivot', indices: [index] };
}

export function clearPivot(): SortStep {
  return { type: 'clear-pivot', indices: [] };
}

export function markAllSorted(length: number): SortStep[] {
  return Array.from({ length }, (_, index) => markSorted(index));
}
