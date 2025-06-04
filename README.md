# translate

A CLI tool for translating locale files for [skeleton](https://github.com/rpurinton/skeleton) framework Discord apps. It uses OpenAI to generate translations for all supported Discord locales from a single English source file.

## Features

- Translates `en-US.json` to all Discord-supported locales
- Parallel translation with progress bar
- Designed for use with the skeleton Discord.js app template

## Installation

```sh
cd /opt
# Clone the repository
git clone https://github.com/rpurinton/translate.git
cd translate
npm install
# (Optional) Run tests
npm test
# Copy and edit the .env file
cp .env.example .env
# (Optional) Symlink for global CLI usage
# (Requires sudo/root)
ln -s /opt/translate/translate.mjs /usr/bin/translate
```

## Setup

1. Obtain an OpenAI API key and add it to your `.env` file:

   ```env
   OPENAI_API_KEY=your_openai_api_key_here
   ```

2. Place your English translations in `en-US.json` in your target directory (e.g., your Discord bot's `locales/` folder).

## Usage

```sh
cd /your_other_project/locales/
translate
```

- The tool will read `en-US.json` and generate translations for all other supported Discord locales in the same directory.
- If a locale file already exists, it will be overwritten.

## Supported Locales

- All Discord-supported locales, including: bg, cs, da, de, el, en-GB, es-419, es-ES, fi, fr, hi, hr, hu, id, it, ja, ko, lt, nl, no, pl, pt-BR, ro, ru, sv-SE, th, tr, uk, vi, zh-CN, zh-TW

## Project Structure

- `src/` - Main source code
- `example/` - Example locale files
- `tests/` - Test suite

## License

MIT

## Support

- Email: <russell.purinton@gmail.com>
- Discord: laozi101
