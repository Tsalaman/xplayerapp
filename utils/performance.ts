/**
 * Performance utilities
 */

/**
 * Request animation frame wrapper for React Native
 */
export function requestAnimationFrame(callback: () => void): number {
  if (typeof requestAnimationFrame !== 'undefined') {
    return window.requestAnimationFrame(callback);
  }
  // Fallback for React Native
  return setTimeout(callback, 16) as any;
}

/**
 * Cancel animation frame wrapper
 */
export function cancelAnimationFrame(id: number): void {
  if (typeof cancelAnimationFrame !== 'undefined') {
    window.cancelAnimationFrame(id);
  } else {
    clearTimeout(id);
  }
}

/**
 * Batch multiple state updates together
 */
export function batchUpdates(...updates: (() => void)[]): void {
  updates.forEach((update) => update());
}

/**
 * Measure performance of a function
 */
export function measurePerformance<T>(
  fn: () => T,
  label?: string
): T {
  const start = performance?.now() || Date.now();
  const result = fn();
  const end = performance?.now() || Date.now();
  const duration = end - start;

  if (__DEV__ && label) {
    console.log(`[Performance] ${label}: ${duration.toFixed(2)}ms`);
  }

  return result;
}

/**
 * Debounce function (non-hook version)
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function (non-hook version)
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false;

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

