import { renderHook } from '@testing-library/react-hooks';
import { useDebounce } from '../useDebounce';

describe('useDebounce', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('returns initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('test', 300));
    expect(result.current).toBe('test');
  });

  it('debounces value changes', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: 'test', delay: 300 },
      }
    );

    expect(result.current).toBe('test');

    rerender({ value: 'test2', delay: 300 });
    expect(result.current).toBe('test'); // Still old value

    jest.advanceTimersByTime(300);
    expect(result.current).toBe('test2');
  });

  it('uses custom delay', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: 'test', delay: 500 },
      }
    );

    rerender({ value: 'test2', delay: 500 });
    jest.advanceTimersByTime(300);
    expect(result.current).toBe('test'); // Still old value

    jest.advanceTimersByTime(200);
    expect(result.current).toBe('test2');
  });

  it('cancels previous timeout on rapid changes', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      {
        initialProps: { value: 'test', delay: 300 },
      }
    );

    rerender({ value: 'test2', delay: 300 });
    jest.advanceTimersByTime(200);

    rerender({ value: 'test3', delay: 300 });
    jest.advanceTimersByTime(100);
    expect(result.current).toBe('test'); // Still original value

    jest.advanceTimersByTime(200);
    expect(result.current).toBe('test3');
  });
});

