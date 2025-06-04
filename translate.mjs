// Entrypoint for the translation utility
import path from 'node:path';
import fs from 'node:fs/promises';
import { config as dotenvConfig } from 'dotenv';
import { translateLocale } from './src/worker.mjs';
import { createProgressBar } from './src/progress.mjs';
import pLimit from './src/p-limit.mjs';
import { fileURLToPath } from 'node:url';
import { getCurrentFilename, getCurrentDirname } from './src/esm-filename.mjs';

export async function runTranslate({
    fsDep = fs,
    pathDep = path,
    processDep = process,
    dotenvConfigDep = dotenvConfig,
    translateLocaleDep = translateLocale,
    createProgressBarDep = createProgressBar,
    pLimitDep = pLimit,
    fileURLToPathDep = fileURLToPath,
    __filenameDep,
    __dirnameDep,
    importMeta = import.meta,
    locales = [
        'bg', 'cs', 'da', 'de', 'el', 'en-GB', 'es-419', 'es-ES', 'fi', 'fr', 'hi', 'hr', 'hu', 'id', 'it', 'ja', 'ko',
        'lt', 'nl', 'no', 'pl', 'pt-BR', 'ro', 'ru', 'sv-SE', 'th', 'tr', 'uk', 'vi', 'zh-CN', 'zh-TW'
    ]
} = {}) {
    const __filename = __filenameDep || getCurrentFilename(importMeta);
    const __dirname = __dirnameDep || getCurrentDirname(importMeta, pathDep.dirname);
    const dotenvPath = pathDep.join(__dirname, '.env');
    try {
        await fsDep.access(dotenvPath);
    } catch {
        processDep.stderr.write('.env file not found in the script directory.\n');
        return 1;
    }
    dotenvConfigDep({ path: dotenvPath });
    const apiKey = processDep.env.OPENAI_API_KEY;
    if (!apiKey) {
        processDep.stderr.write('Missing OPENAI_API_KEY in .env\n');
        return 1;
    }

    const cwd = processDep.cwd();
    const enUSPath = pathDep.join(cwd, 'en-US.json');
    const promptPath = pathDep.join(__dirname, 'prompt.json');

    try {
        await fsDep.access(enUSPath);
    } catch {
        processDep.stderr.write('en-US.json not found in current directory.\n');
        return 1;
    }
    const enUSRaw = await fsDep.readFile(enUSPath, 'utf8');
    const promptJsonRaw = await fsDep.readFile(promptPath, 'utf8');
    const promptObj = JSON.parse(promptJsonRaw);
    if (
        promptObj.messages &&
        promptObj.messages[0] &&
        Array.isArray(promptObj.messages[0].content) &&
        promptObj.messages[0].content[0] &&
        typeof promptObj.messages[0].content[0].text === 'string'
    ) {
        promptObj.messages[0].content[0].text = enUSRaw;
    }

    const progress = createProgressBarDep(locales.length, processDep.stdout);
    const limit = pLimitDep(4);

    await Promise.all(locales.map(locale =>
        limit(async () => {
            if (locale === 'en-US') {
                await fsDep.writeFile(pathDep.join(cwd, 'en-US.json'), enUSRaw);
                progress.update(locale);
                return;
            }
            try {
                const result = await translateLocaleDep({
                    locale,
                    promptObj,
                    apiKey
                });
                await fsDep.writeFile(pathDep.join(cwd, `${locale}.json`), result);
                progress.update(locale);
            } catch (err) {
                processDep.stderr.write(`\nFailed to translate ${locale}: ${err.message}\n`);
                progress.update(locale);
            }
        })
    ));
    return 0;
}

// CLI entrypoint
if (process.argv[1] === getCurrentFilename(import.meta)) {
    runTranslate().then(code => process.exit(code));
}
