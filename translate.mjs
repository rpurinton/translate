#!/usr/bin/env node
import { runTranslate } from './src/main.mjs';
runTranslate().then(code => process.exit(code));
