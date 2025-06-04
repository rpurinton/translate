import { jest } from '@jest/globals';
import { runTranslate } from '../src/main.mjs';

describe('runTranslate', () => {
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
      __filenameDep: '/src/main.mjs',
      __dirnameDep: '/src',
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
      __filenameDep: '/src/main.mjs',
      __dirnameDep: '/src',
      locales: ['fr']
    });
    expect(code).toBe(1);
    expect(mockProcess.stderr.write).toHaveBeenCalledWith(expect.stringContaining('.env file not found'));
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
      __filenameDep: '/src/main.mjs',
      __dirnameDep: '/src',
      locales: ['fr']
    });
    expect(code).toBe(1);
    expect(proc.stderr.write).toHaveBeenCalledWith(expect.stringContaining('Missing OPENAI_API_KEY'));
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
      __filenameDep: '/src/main.mjs',
      __dirnameDep: '/src',
      locales: ['fr']
    });
    expect(code).toBe(1);
    expect(mockProcess.stderr.write).toHaveBeenCalledWith(expect.stringContaining('en-US.json not found'));
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
      __filenameDep: '/src/main.mjs',
      __dirnameDep: '/src',
      locales: ['fr']
    });
    expect(mockProcess.stderr.write).toHaveBeenCalledWith(expect.stringContaining('Failed to translate fr'));
  });
});
