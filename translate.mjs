#!/usr/bin/env node
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
    processDep.stdout.write(`[translate] Script __filename: ${__filename}\n`);
    processDep.stdout.write(`[translate] Script __dirname: ${__dirname}\n`);
    const dotenvPath = pathDep.join(__dirname, '.env');
    processDep.stdout.write(`[translate] Looking for .env at: ${dotenvPath}\n`);
    try {
        await fsDep.access(dotenvPath);
    } catch (e) {
        processDep.stderr.write(`[translate] .env file not found in the script directory: ${dotenvPath}\n`);
        processDep.stderr.write(`[translate] Error: ${e && e.message ? e.message : e}\n`);
        return 1;
    }
    dotenvConfigDep({ path: dotenvPath });
    const apiKey = processDep.env.OPENAI_API_KEY;
    if (!apiKey) {
        processDep.stderr.write('[translate] Missing OPENAI_API_KEY in .env\n');
        return 1;
    }

    const cwd = processDep.cwd();
    processDep.stdout.write(`[translate] Current working directory: ${cwd}\n`);
    const enUSPath = pathDep.join(cwd, 'en-US.json');
    const promptPath = pathDep.join(__dirname, 'prompt.json');
    processDep.stdout.write(`[translate] Looking for en-US.json at: ${enUSPath}\n`);
    processDep.stdout.write(`[translate] Looking for prompt.json at: ${promptPath}\n`);

    try {
        await fsDep.access(enUSPath);
    } catch (e) {
        processDep.stderr.write(`[translate] en-US.json not found in current directory: ${enUSPath}\n`);
        processDep.stderr.write(`[translate] Error: ${e && e.message ? e.message : e}\n`);
        return 1;
    }
    let enUSRaw, promptJsonRaw, promptObj;
    try {
        enUSRaw = await fsDep.readFile(enUSPath, 'utf8');
    } catch (e) {
        processDep.stderr.write(`[translate] Failed to read en-US.json: ${enUSPath}\n`);
        processDep.stderr.write(`[translate] Error: ${e && e.message ? e.message : e}\n`);
        return 1;
    }
    try {
        promptJsonRaw = await fsDep.readFile(promptPath, 'utf8');
    } catch (e) {
        processDep.stderr.write(`[translate] Failed to read prompt.json: ${promptPath}\n`);
        processDep.stderr.write(`[translate] Error: ${e && e.message ? e.message : e}\n`);
        return 1;
    }
    try {
        promptObj = JSON.parse(promptJsonRaw);
    } catch (e) {
        processDep.stderr.write(`[translate] Failed to parse prompt.json: ${promptPath}\n`);
        processDep.stderr.write(`[translate] Error: ${e && e.message ? e.message : e}\n`);
        return 1;
    }
    if (
        promptObj.messages &&
        promptObj.messages[0] &&
        Array.isArray(promptObj.messages[0].content) &&
        promptObj.messages[0].content[0] &&
        typeof promptObj.messages[0].content[0].text === 'string'
    ) {
        promptObj.messages[0].content[0].text = enUSRaw;
    } else {
        processDep.stderr.write('[translate] prompt.json format is invalid: missing messages[0].content[0].text\n');
        return 1;
    }

    processDep.stdout.write(`[translate] Starting translation for locales: ${locales.join(', ')}\n`);
    const progress = createProgressBarDep(locales.length, processDep.stdout);
    const limit = pLimitDep(4);

    await Promise.all(locales.map(locale =>
        limit(async () => {
            processDep.stdout.write(`[translate] Processing locale: ${locale}\n`);
            if (locale === 'en-US') {
                try {
                    await fsDep.writeFile(pathDep.join(cwd, 'en-US.json'), enUSRaw);
                    processDep.stdout.write(`[translate] Copied en-US.json to ${pathDep.join(cwd, 'en-US.json')}\n`);
                } catch (e) {
                    processDep.stderr.write(`[translate] Failed to write en-US.json: ${e && e.message ? e.message : e}\n`);
                }
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
                processDep.stdout.write(`[translate] Wrote ${locale}.json\n`);
                progress.update(locale);
            } catch (err) {
                processDep.stderr.write(`\n[translate] Failed to translate ${locale}: ${err && err.message ? err.message : err}\n`);
                progress.update(locale);
            }
        })
    ));
    processDep.stdout.write('[translate] All translations attempted.\n');
    return 0;
}

// CLI entrypoint
if (process.argv[1] === getCurrentFilename(import.meta)) {
    runTranslate().then(code => process.exit(code));
}
