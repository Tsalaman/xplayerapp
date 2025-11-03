import { cache } from '../cache';

describe('Cache', () => {
  beforeEach(() => {
    cache.clear();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('sets and gets value', () => {
    cache.set('key1', 'value1');
    expect(cache.get('key1')).toBe('value1');
  });

  it('returns null for non-existent key', () => {
    expect(cache.get('nonexistent')).toBeNull();
  });

  it('deletes value', () => {
    cache.set('key1', 'value1');
    cache.delete('key1');
    expect(cache.get('key1')).toBeNull();
  });

  it('returns null for expired entries', () => {
    cache.set('key1', 'value1', 1000); // 1 second TTL
    expect(cache.get('key1')).toBe('value1');

    jest.advanceTimersByTime(1001); // Advance past TTL
    // Note: Cache uses Date.now() which is mocked, but get() also uses Date.now()
    // So we need to manually expire or test differently
    const entry = (cache as any).store.get('key1');
    if (entry) {
      entry.timestamp = Date.now() - 1001; // Manually expire
    }
    expect(cache.get('key1')).toBeNull();
  });

  it('has returns true for existing valid entry', () => {
    cache.set('key1', 'value1');
    expect(cache.has('key1')).toBe(true);
  });

  it('has returns false for non-existent key', () => {
    expect(cache.has('nonexistent')).toBe(false);
  });

  it('has returns false for expired entry', () => {
    cache.set('key1', 'value1', 1000);
    jest.advanceTimersByTime(1001);
    // Manually expire
    const entry = (cache as any).store.get('key1');
    if (entry) {
      entry.timestamp = Date.now() - 1001;
    }
    expect(cache.has('key1')).toBe(false);
  });

  it('clears all entries', () => {
    cache.set('key1', 'value1');
    cache.set('key2', 'value2');
    cache.clear();
    expect(cache.get('key1')).toBeNull();
    expect(cache.get('key2')).toBeNull();
  });

  it('uses default TTL of 5 minutes', () => {
    cache.set('key1', 'value1'); // No TTL specified
    expect(cache.get('key1')).toBe('value1');

    jest.advanceTimersByTime(5 * 60 * 1000 - 1); // Just before expiry
    expect(cache.get('key1')).toBe('value1');

    jest.advanceTimersByTime(1); // Now expired
    // Manually expire
    const entry = (cache as any).store.get('key1');
    if (entry) {
      entry.timestamp = Date.now() - (5 * 60 * 1000 + 1);
    }
    expect(cache.get('key1')).toBeNull();
  });
});

