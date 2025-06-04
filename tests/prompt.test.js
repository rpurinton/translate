import { jest } from '@jest/globals';
import { loadPrompt } from '../src/prompt.mjs';

describe('loadPrompt', () => {
  it('loads and replaces target_locale', async () => {
    const mockFs = { readFile: jest.fn().mockResolvedValue('foo {target_locale} bar') };
    const result = await loadPrompt('prompt.json', 'fr', mockFs);
    expect(result).toBe('foo fr bar');
    expect(mockFs.readFile).toHaveBeenCalledWith('prompt.json', 'utf8');
  });
});
