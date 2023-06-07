import puppeteer from 'puppeteer';
import inquirer from 'inquirer';
import { DEPTH_LIMIT, exportToJson, getOnlyHostURLs, getUnique, normalizeURL } from '../lib/utils.js';
import chalk from 'chalk';
class Crawler {
    constructor(options) {
        this.baseURL = options.baseURL;
        this.depth = options.depth;
        this.browser = options.browser;
        this.page = options.page;
        this.crawledUrls = new Set();
        this.stack = [];
        this.result = [];
    }
    static async init(url, depth = 0) {
        const browser = await puppeteer.launch({ headless: 'new' });
        const page = await browser.newPage();
        return new Crawler({ baseURL: url, depth, browser, page });
    }
    async run() {
        /* eslint-disable-next-line @typescript-eslint/no-misused-promises */
        this.page.once('close', async () => {
            await this.onPageClosed();
        });
        await this.crawlPage(this.baseURL, this.baseURL);
        console.log(chalk.magenta('\nCrawling end'));
        console.log(chalk.magenta(`Total images: ${this.result.length}`));
        console.log('\n');
        console.log(this.result);
        await this._close();
    }
    async onPageClosed() {
        await inquirer
            .prompt([
            {
                name: 'exportToJSON',
                type: 'confirm',
                message: 'Export to JSON file?',
                default: false
            }
        ])
            .then((answers) => {
            if (answers.exportToJSON) {
                exportToJson(this.result, this.baseURL);
            }
        })
            .catch((error) => {
            console.log(error);
        });
        process.exit();
    }
    async crawlPage(baseURL, currentURL) {
        const baseURLObj = new URL(baseURL);
        const currentURLObj = new URL(currentURL);
        if (baseURLObj.hostname !== currentURLObj.hostname) {
            return;
        }
        console.log(chalk.green(`Crawling ${currentURL}`));
        await this.page.goto(currentURL);
        const images = await this.findImages(this.page, currentURL, 0);
        console.log(chalk.cyan(`Images found : ${images.length}`));
        this.result.push(...images);
        const nextURLs = await this.findURLs(this.page);
        this.stack = [...nextURLs];
        for (let l = 0; l < Math.min(this.depth, DEPTH_LIMIT); l++) {
            console.log(chalk.magenta(`\nCurrent depth level: ${l}`));
            /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
            for (const _ of nextURLs) {
                const url = normalizeURL(this.stack.pop());
                if (!this.crawledUrls.has(url)) {
                    this.crawledUrls.add(url);
                    try {
                        console.log(chalk.gray(`Fetching: ${url}`));
                        await this.page.goto(url);
                        const images = await this.findImages(this.page, url, l);
                        console.log(chalk.cyan(`Images found : ${images.length}`));
                        this.result.push(...images);
                    }
                    catch (e) {
                        console.log(chalk.red(e.message));
                    }
                    const urls = await this.findURLs(this.page);
                    for (const i of urls) {
                        this.stack.push(i);
                    }
                }
            }
        }
    }
    async findImages(page, sourceUrl, depth) {
        const imagesArr = getUnique(await page.evaluate(() => Array.from(document.images, (e) => e.src)));
        return imagesArr.map((imageUrl) => ({
            imageUrl,
            sourceUrl,
            depth
        }));
    }
    async findURLs(page) {
        return getOnlyHostURLs(await page.evaluate(() => Array.from(document.links, (e) => e.href)), this.baseURL);
    }
    async _close() {
        await this.browser.close();
    }
}
export default Crawler;
