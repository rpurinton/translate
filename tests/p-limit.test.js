import { jest } from '@jest/globals';
import pLimit, { pLimit as namedPLimit } from '../src/p-limit.mjs';

describe('pLimit', () => {
  it('limits concurrency', async () => {
    let running = 0;
    let max = 0;
    const limit = pLimit(2);
    const tasks = Array.from({ length: 5 }, (_, i) => limit(async () => {
      running++;
      if (running > max) max = running;
      await new Promise(res => setTimeout(res, 10));
      running--;
      return i;
    }));
    const results = await Promise.all(tasks);
    expect(results).toEqual([0,1,2,3,4]);
    expect(max).toBeLessThanOrEqual(2);
  });

  it('named export works', () => {
    expect(typeof namedPLimit).toBe('function');
  });
});
