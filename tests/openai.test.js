import { jest } from '@jest/globals';
import { callOpenAI } from '../src/openai.mjs';

describe('callOpenAI', () => {
  it('calls OpenAI SDK and returns content', async () => {
    const mockCreate = jest.fn().mockResolvedValue({ choices: [{ message: { content: 'translated' } }] });
    const mockOpenAI = jest.fn().mockImplementation(() => ({ chat: { completions: { create: mockCreate } } }));
    const promptObj = {
      model: 'gpt',
      messages: [
        { content: [{ text: 'en' }] },
        { content: [{ text: 'Translate this to locale: {target_locale}.' }] }
      ],
      response_format: {},
      temperature: 1,
      max_completion_tokens: 100,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0
    };
    const result = await callOpenAI({
      promptObj,
      targetLocale: 'fr',
      apiKey: 'key',
      OpenAIDep: mockOpenAI
    });
    expect(mockOpenAI).toHaveBeenCalledWith({ apiKey: 'key' });
    expect(mockCreate).toHaveBeenCalled();
    expect(result).toBe('translated');
  });
});
