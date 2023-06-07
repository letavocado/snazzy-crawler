import puppeteer from 'puppeteer'
import type { Browser, Page } from 'puppeteer'
import inquirer, { type Answers } from 'inquirer'
import {
  DEPTH_LIMIT,
  exportToJson,
  getOnlyHostURLs,
  getRandomEmoji,
  getUnique,
  normalizeURL
} from '../lib/utils.js'
import chalk from 'chalk'

interface CrawlerOptions {
  /** URL for crawling **/
  baseURL: string
  /** crawling depth, by default 0 **/
  depth: number
  /** Puppeteer browser instance **/
  browser: Browser
  /** Puppeteer page instance **/
  page: Page
}

export type CrawlerResult = CrawlerResultObj[]

interface CrawlerResultObj {
  imageUrl: string
  /** the page url this image was found on" **/
  sourceUrl: string
  /** the depth of the source at which this image was found on" **/
  depth: number
}

class Crawler {
  public baseURL: string
  public depth: number
  public browser: Browser
  public page: Page
  public readonly result: CrawlerResult

  private readonly crawledUrls: Set<string>
  private stack: string[]

  private constructor (options: CrawlerOptions) {
    this.baseURL = options.baseURL
    this.depth = options.depth
    this.browser = options.browser
    this.page = options.page
    this.crawledUrls = new Set()
    this.stack = []
    this.result = []
  }

  static async init (url: string, depth: number = 0): Promise<Crawler> {
    const browser = await puppeteer.launch({ headless: 'new' })
    const page = await browser.newPage()
    return new Crawler({ baseURL: url, depth, browser, page })
  }

  public async run (): Promise<void> {
    /* eslint-disable-next-line @typescript-eslint/no-misused-promises */
    this.page.once('close', async () => {
      await this.onPageClosed()
    })

    await this.crawlPage(this.baseURL, this.baseURL)

    console.log(this.result)
    console.log(chalk.magenta('\nYASSSS, Crawling Done!. 🫡'))
    console.log(
      chalk.magenta(`"Wow! We found ${this.result.length} awesome images! 🎉"`)
    )

    await this._close()
  }

  private async onPageClosed (): Promise<void> {
    await inquirer
      .prompt([
        {
          name: 'exportToJSON',
          type: 'confirm',
          message: 'Export to JSON file? 💾',
          default: false
        }
      ])
      .then((answers: Answers) => {
        if (answers.exportToJSON as boolean) {
          exportToJson(this.result, this.baseURL)
        }
      })
      .catch((error) => {
        console.log(error)
      })

    process.exit()
  }

  public async crawlPage (baseURL: string, currentURL: string): Promise<void> {
    const baseURLObj = new URL(baseURL)
    const currentURLObj = new URL(currentURL)

    if (baseURLObj.hostname !== currentURLObj.hostname) {
      return
    }

    console.log(
      chalk.green(`${currentURL}? ${getRandomEmoji()} Let's crawl it!"`)
    )

    await this.page.goto(currentURL)
    const images = await this.findImages(this.page, currentURL, 0)

    if (images.length === 0) {
      console.log(chalk.cyan('No pics, no proof.'))
    } else {
      console.log(chalk.cyan(`Boom! Found ${images.length} pics.`))
    }

    this.result.push(...images)
    const nextURLs: string[] = await this.findURLs(this.page)
    this.stack = [...nextURLs]
    const maxDepth = Math.min(this.depth, DEPTH_LIMIT)

    for (let l = 0; l < maxDepth; l++) {
      if (l > 4) {
        console.log(
          chalk.magenta(`\nWe're diving in deep, we've hit level ${l}!`)
        )
      } else {
        console.log(chalk.magenta(`You're at level ${l}`))
      }

      /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
      for (const _ of nextURLs) {
        if (this.stack.length === 0) return

        const url: string = normalizeURL(this.stack.pop() as string)
        if (!this.crawledUrls.has(url)) {
          this.crawledUrls.add(url)
          try {
            console.log(
              chalk
                .hex('fff1f3')
                .underline(`\nGrabbing every link on ${url}! 🌐`)
            )
            await this.page.goto(url)
            const images = await this.findImages(this.page, url, l)

            if (images.length === 0) {
              console.log(chalk.cyan('No pics, no proof.'))
            } else {
              console.log(
                chalk.cyan(
                  `Boom! Found ${images.length} ${
                    images.length === 1 ? 'pic' : 'pics'
                  }.`
                )
              )
            }
            this.result.push(...images)
          } catch (e) {
            console.log(chalk.red((e as Error).message))
          }
          const urls = await this.findURLs(this.page)
          for (const i of urls) {
            this.stack.push(i)
          }
        }
      }
    }
  }

  private async findImages (
    page: Page,
    sourceUrl: string,
    depth: number
  ): Promise<CrawlerResult> {
    console.log(chalk.italic("Hmm... Let's find some pics on this page! 🧐📷"))
    const imagesArr = getUnique(
      await page.evaluate(() => Array.from(document.images, (e) => e.src))
    )

    return imagesArr.map((imageUrl) => ({
      imageUrl,
      sourceUrl,
      depth
    }))
  }

  private async findURLs (page: Page): Promise<string[]> {
    return getOnlyHostURLs(
      await page.evaluate(() => Array.from(document.links, (e) => e.href)),
      this.baseURL
    )
  }

  private async _close (): Promise<void> {
    await this.browser.close()
  }
}

export default Crawler
