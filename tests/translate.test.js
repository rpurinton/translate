import { jest } from '@jest/globals';
import { runTranslate } from '../translate.mjs';

const mockFs = {
  access: jest.fn(),
  readFile: jest.fn(),
  writeFile: jest.fn()
};
const mockPath = {
  join: jest.fn((...args) => args.join('/')),
  dirname: jest.fn(p => p.split('/').slice(0, -1).join('/'))
};
const mockProcess = {
  env: { OPENAI_API_KEY: 'test-key' },
  cwd: jest.fn(() => '/cwd'),
  stderr: { write: jest.fn() },
  stdout: { write: jest.fn() }
};
const mockDotenv = jest.fn();
const mockTranslateLocale = jest.fn(async ({ locale }) => `{"translated": "${locale}"}`);
const mockCreateProgressBar = jest.fn(() => ({ update: jest.fn() }));
const mockPLimit = jest.fn(() => fn => fn());
const mockFileURLToPath = jest.fn(() => '/script/translate.mjs');

describe('runTranslate', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFs.access.mockResolvedValue();
    mockFs.readFile.mockImplementation((file) => {
      if (file.endsWith('en-US.json')) return Promise.resolve('{"en": "text"}');
      if (file.endsWith('prompt.json')) return Promise.resolve('{"messages":[{"content":[{"text":""}]},{"content":[{"text":"Translate this to locale: {target_locale}."}]}]}');
      return Promise.resolve('');
    });
    mockFs.writeFile.mockResolvedValue();
  });

  it('runs successfully and writes all locale files', async () => {
    const code = await runTranslate({
      fsDep: mockFs,
      pathDep: mockPath,
      processDep: mockProcess,
      dotenvConfigDep: mockDotenv,
      translateLocaleDep: mockTranslateLocale,
      createProgressBarDep: mockCreateProgressBar,
      pLimitDep: mockPLimit,
      fileURLToPathDep: mockFileURLToPath,
      __filenameDep: '/script/translate.mjs',
      __dirnameDep: '/script',
      locales: ['fr', 'de', 'en-US']
    });
    expect(code).toBe(0);
    expect(mockFs.writeFile).toHaveBeenCalledWith('/cwd/en-US.json', '{"en": "text"}');
    expect(mockFs.writeFile).toHaveBeenCalledWith('/cwd/fr.json', '{"translated": "fr"}');
    expect(mockFs.writeFile).toHaveBeenCalledWith('/cwd/de.json', '{"translated": "de"}');
  });

  it('returns 1 if .env is missing', async () => {
    mockFs.access.mockImplementationOnce(() => Promise.reject(new Error('no env')));
    const code = await runTranslate({
      fsDep: mockFs,
      pathDep: mockPath,
      processDep: mockProcess,
      dotenvConfigDep: mockDotenv,
      translateLocaleDep: mockTranslateLocale,
      createProgressBarDep: mockCreateProgressBar,
      pLimitDep: mockPLimit,
      fileURLToPathDep: mockFileURLToPath,
      __filenameDep: '/script/translate.mjs',
      __dirnameDep: '/script',
      locales: ['fr']
    });
    expect(code).toBe(1);
    expect(mockProcess.stderr.write).toHaveBeenCalledWith('.env file not found in the script directory.\n');
  });

  it('returns 1 if OPENAI_API_KEY is missing', async () => {
    const proc = { ...mockProcess, env: {} };
    const code = await runTranslate({
      fsDep: mockFs,
      pathDep: mockPath,
      processDep: proc,
      dotenvConfigDep: mockDotenv,
      translateLocaleDep: mockTranslateLocale,
      createProgressBarDep: mockCreateProgressBar,
      pLimitDep: mockPLimit,
      fileURLToPathDep: mockFileURLToPath,
      __filenameDep: '/script/translate.mjs',
      __dirnameDep: '/script',
      locales: ['fr']
    });
    expect(code).toBe(1);
    expect(proc.stderr.write).toHaveBeenCalledWith('Missing OPENAI_API_KEY in .env\n');
  });

  it('returns 1 if en-US.json is missing', async () => {
    mockFs.access.mockResolvedValueOnce().mockRejectedValueOnce(new Error('no en-US'));
    const code = await runTranslate({
      fsDep: mockFs,
      pathDep: mockPath,
      processDep: mockProcess,
      dotenvConfigDep: mockDotenv,
      translateLocaleDep: mockTranslateLocale,
      createProgressBarDep: mockCreateProgressBar,
      pLimitDep: mockPLimit,
      fileURLToPathDep: mockFileURLToPath,
      __filenameDep: '/script/translate.mjs',
      __dirnameDep: '/script',
      locales: ['fr']
    });
    expect(code).toBe(1);
    expect(mockProcess.stderr.write).toHaveBeenCalledWith('en-US.json not found in current directory.\n');
  });

  it('logs error if translation fails for a locale', async () => {
    mockTranslateLocale.mockImplementationOnce(() => { throw new Error('fail'); });
    await runTranslate({
      fsDep: mockFs,
      pathDep: mockPath,
      processDep: mockProcess,
      dotenvConfigDep: mockDotenv,
      translateLocaleDep: mockTranslateLocale,
      createProgressBarDep: mockCreateProgressBar,
      pLimitDep: mockPLimit,
      fileURLToPathDep: mockFileURLToPath,
      __filenameDep: '/script/translate.mjs',
      __dirnameDep: '/script',
      locales: ['fr']
    });
    expect(mockProcess.stderr.write).toHaveBeenCalledWith('\nFailed to translate fr: fail\n');
  });
});
