// Entrypoint logic for translation utility, now in src/main.mjs
import path from 'node:path';
import fs from 'node:fs/promises';
import { config as dotenvConfig } from 'dotenv';
import { translateLocale } from './worker.mjs';
import { createProgressBar } from './progress.mjs';
import pLimit from './p-limit.mjs';
import { getCurrentFilename, getCurrentDirname } from './esm-filename.mjs';

export async function runTranslate({
    fsDep = fs,
    pathDep = path,
    processDep = process,
    dotenvConfigDep = dotenvConfig,
    translateLocaleDep = translateLocale,
    createProgressBarDep = createProgressBar,
    pLimitDep = pLimit,
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
    const dotenvPath = pathDep.join(__dirname, '..', '.env');
    try {
        await fsDep.access(dotenvPath);
    } catch (e) {
        processDep.stderr && processDep.stderr.write && processDep.stderr.write('.env file not found\n');
        return 1;
    }
    dotenvConfigDep({ path: dotenvPath });
    const apiKey = processDep.env.OPENAI_API_KEY;
    if (!apiKey) {
        processDep.stderr && processDep.stderr.write && processDep.stderr.write('Missing OPENAI_API_KEY\n');
        return 1;
    }
    const cwd = processDep.cwd();
    const enUSPath = pathDep.join(cwd, 'en-US.json');
    const promptPath = pathDep.join(__dirname, '..', 'prompt.json');
    try {
        await fsDep.access(enUSPath);
    } catch (e) {
        processDep.stderr && processDep.stderr.write && processDep.stderr.write('en-US.json not found\n');
        return 1;
    }
    let enUSRaw, promptJsonRaw, promptObj;
    try {
        enUSRaw = await fsDep.readFile(enUSPath, 'utf8');
    } catch (e) {
        processDep.stderr && processDep.stderr.write && processDep.stderr.write('Failed to read en-US.json\n');
        return 1;
    }
    try {
        promptJsonRaw = await fsDep.readFile(promptPath, 'utf8');
    } catch (e) {
        processDep.stderr && processDep.stderr.write && processDep.stderr.write('Failed to read prompt.json\n');
        return 1;
    }
    try {
        promptObj = JSON.parse(promptJsonRaw);
    } catch (e) {
        processDep.stderr && processDep.stderr.write && processDep.stderr.write('Failed to parse prompt.json\n');
        return 1;
    }
    // Replace {json} placeholder in any text content with the raw en-US.json contents.
    if (promptObj && Array.isArray(promptObj.messages)) {
        let replaced = false;
        for (const msg of promptObj.messages) {
            if (msg && Array.isArray(msg.content)) {
                for (const part of msg.content) {
                    if (part && part.type === 'text' && typeof part.text === 'string' && part.text.includes('{json}')) {
                        part.text = part.text.replace('{json}', enUSRaw);
                        replaced = true;
                    }
                }
            }
        }
        // Fallback to legacy behavior: if no {json} placeholder found, inject en-US content into first system text slot.
        if (!replaced) {
            if (
                promptObj.messages[0] &&
                Array.isArray(promptObj.messages[0].content) &&
                promptObj.messages[0].content[0] &&
                typeof promptObj.messages[0].content[0].text === 'string'
            ) {
                promptObj.messages[0].content[0].text = enUSRaw;
            } else {
                processDep.stderr && processDep.stderr.write && processDep.stderr.write('Invalid prompt.json structure\n');
                return 1;
            }
        }
    } else {
        processDep.stderr && processDep.stderr.write && processDep.stderr.write('Invalid prompt.json structure\n');
        return 1;
    }
    const progress = createProgressBarDep(locales.length, processDep.stdout);
    const limit = pLimitDep(4);
    await Promise.all(locales.map(locale =>
        limit(async () => {
            if (locale === 'en-US') {
                try {
                    await fsDep.writeFile(pathDep.join(cwd, 'en-US.json'), enUSRaw);
                } catch (e) {
                }
                progress.update(locale);
                return;
            }
            try {
                // Deep copy prompt for this locale and replace {target_locale} placeholders (if any)
                const localePromptObj = JSON.parse(JSON.stringify(promptObj));
                if (Array.isArray(localePromptObj.messages)) {
                    for (const m of localePromptObj.messages) {
                        if (m && Array.isArray(m.content)) {
                            for (const part of m.content) {
                                if (part && part.type === 'text' && typeof part.text === 'string' && part.text.includes('{target_locale}')) {
                                    part.text = part.text.replace(/\{target_locale\}/g, locale);
                                }
                            }
                        }
                    }
                }
                const result = await translateLocaleDep({
                    locale,
                    promptObj: localePromptObj,
                    apiKey
                });
                await fsDep.writeFile(pathDep.join(cwd, `${locale}.json`), result);
                progress.update(locale);
            } catch (err) {
                processDep.stderr && processDep.stderr.write && processDep.stderr.write(`Failed to translate ${locale}\n`);
                progress.update(locale);
            }
        })
    ));
    return 0;
}
