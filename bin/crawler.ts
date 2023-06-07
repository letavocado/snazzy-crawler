#!/usr/bin/env node

import { Command } from 'commander'
import { createRequire } from 'node:module'
import Crawler from '../lib/core.js'
import { normalizeURL } from '../lib/utils.ts'

const require = createRequire(import.meta.url)
const { version } = require('../package.json')
const program: Command = new Command()

program
  .version(version)
  .usage(
    '[options] <url>\n\n  A snazzy light Node.js image crawler laced with TypeScript goodness! 🕵️🦾'
  )
  .option('-l, --depth <number>', 'depth level')
  .parse(process.argv)

const options = program.opts()

if (program.args.length === 0) {
  program.help()
} else {
  const [url] = program.args
  const normalizedURL: string = normalizeURL(url)
  const crawler = await Crawler.init(normalizedURL, options.depth)
  await crawler.run()
}
