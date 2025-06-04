import { jest } from '@jest/globals';
import { createProgressBar } from '../src/progress.mjs';

describe('createProgressBar', () => {
  it('writes progress to output', () => {
    const output = { write: jest.fn() };
    const bar = createProgressBar(2, output);
    bar.update('fr');
    expect(output.write).toHaveBeenCalledWith(expect.stringContaining('1/2 (fr)'));
    bar.update('de');
    expect(output.write).toHaveBeenCalledWith('\nAll translations complete.\n');
  });
});
