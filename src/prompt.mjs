// Prompt loading and template logic
// Accepts fs dependency for testability
export async function loadPrompt(promptPath, targetLocale, fsDep) {
  const fsImpl = fsDep || (await import('node:fs/promises'));
  const raw = await fsImpl.readFile(promptPath, 'utf8');
  return raw.replace('{target_locale}', targetLocale);
}
