import { jest } from '@jest/globals';
import { translateLocale } from '../src/worker.mjs';

describe('translateLocale', () => {
  it('calls callOpenAI with correct args and returns result', async () => {
    const mockCallOpenAI = jest.fn().mockResolvedValue('result');
    const result = await translateLocale({
      locale: 'fr',
      promptObj: { foo: 'bar' },
      apiKey: 'key',
      callOpenAIDep: mockCallOpenAI
    });
    expect(mockCallOpenAI).toHaveBeenCalledWith({
      promptObj: { foo: 'bar' },
      targetLocale: 'fr',
      apiKey: 'key'
    });
    expect(result).toBe('result');
  });
});
