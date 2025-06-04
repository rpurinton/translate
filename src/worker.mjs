// Worker logic for translation
// Accepts callOpenAI as dependency for testability
export async function translateLocale({
  locale, promptObj, apiKey, callOpenAIDep } = {}) {
  const callOpenAIImpl = callOpenAIDep || (await import('./openai.mjs')).callOpenAI;
  const response = await callOpenAIImpl({
    promptObj,
    targetLocale: locale,
    apiKey
  });
  return response;
}
