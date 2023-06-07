#!/usr/bin/env node
import { Command } from 'commander';
import { createRequire } from 'node:module';
import Crawler from '../lib/core.js';
import { normalizeURL } from '../lib/utils.js';
const require = createRequire(import.meta.url);
const { version } = require('../../package.json');
const program = new Command();
program
    .version(version)
    .usage('<url> [options] \n\n  A snazzy light Node.js image crawler laced with TypeScript goodness! 🕵️🦾')
    .option('-l, --depth <number>', 'depth level')
    .parse(process.argv);
const options = program.opts();
if (program.args.length === 0) {
    program.help();
}
else {
    const [url] = program.args;
    const normalizedURL = normalizeURL(url);
    const crawler = await Crawler.init(normalizedURL, options.depth);
    await crawler.run();
}
