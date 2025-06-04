// OpenAI API logic using openai SDK
// Accepts OpenAI as dependency for testability
export async function callOpenAI({ promptObj, targetLocale, apiKey, OpenAIDep } = {}) {
  const OpenAIImpl = OpenAIDep || (await import('openai')).default;
  const messages = JSON.parse(JSON.stringify(promptObj.messages)); // deep copy
  if (
    messages &&
    messages[1] &&
    Array.isArray(messages[1].content) &&
    messages[1].content[0] &&
    typeof messages[1].content[0].text === 'string'
  ) {
    messages[1].content[0].text = messages[1].content[0].text.replace('{target_locale}', targetLocale);
  }
  const openai = new OpenAIImpl({ apiKey });
  const response = await openai.chat.completions.create({
    model: promptObj.model,
    messages,
    response_format: promptObj.response_format,
    temperature: promptObj.temperature,
    max_tokens: promptObj.max_completion_tokens,
    top_p: promptObj.top_p,
    frequency_penalty: promptObj.frequency_penalty,
    presence_penalty: promptObj.presence_penalty
  });
  return response.choices[0].message.content;
}
