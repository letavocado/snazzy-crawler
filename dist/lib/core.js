import puppeteer from 'puppeteer';
import inquirer from 'inquirer';
import { DEPTH_LIMIT, exportToJson, getOnlyHostURLs, getRandomEmoji, getUnique, normalizeURL } from '../lib/utils.js';
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
        const startTime = process.hrtime.bigint();
        /* eslint-disable-next-line @typescript-eslint/no-misused-promises */
        this.page.once('close', async () => {
            await this.onPageClosed();
        });
        await this.crawlPage(this.baseURL, this.baseURL);
        const endTime = process.hrtime.bigint();
        const completedInSeconds = (Number(endTime - startTime) /
            1000000 /
            1000).toFixed(2);
        console.log(this.result);
        console.log(chalk.magenta(`\nYASSSS, Crawling Done!. 🫡 ${completedInSeconds}s`));
        console.log(chalk.magenta(`"Wow! We found ${this.result.length} awesome images! 🎉"`));
        await this._close();
    }
    async onPageClosed() {
        await inquirer
            .prompt([
            {
                name: 'exportToJSON',
                type: 'confirm',
                message: 'Export to JSON file? 💾',
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
        console.log(chalk.green(`${currentURL}? ${getRandomEmoji()} Let's crawl it!"`));
        await this.page.goto(currentURL);
        const images = await this.findImages(this.page, currentURL, 0);
        if (images.length === 0) {
            console.log(chalk.cyan('No pics, no proof.'));
        }
        else {
            console.log(chalk.cyan(`Boom! Found ${images.length} pics.`));
        }
        this.result.push(...images);
        const nextURLs = await this.findURLs(this.page);
        this.stack = [...nextURLs];
        const maxDepth = Math.min(this.depth, DEPTH_LIMIT);
        for (let l = 0; l < maxDepth; l++) {
            if (l > 4) {
                console.log(chalk.magenta(`\nWe're diving in deep, we've hit level ${l}!`));
            }
            else {
                console.log(chalk.magenta(`You're at level ${l}`));
            }
            /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
            for (const _ of nextURLs) {
                if (this.stack.length === 0)
                    return;
                const url = normalizeURL(this.stack.pop());
                if (!this.crawledUrls.has(url)) {
                    this.crawledUrls.add(url);
                    try {
                        console.log(chalk
                            .hex('fff1f3')
                            .underline(`\nGrabbing every link on ${url}! 🌐`));
                        await this.page.goto(url);
                        const images = await this.findImages(this.page, url, l);
                        if (images.length === 0) {
                            console.log(chalk.cyan('No pics, no proof.'));
                        }
                        else {
                            console.log(chalk.cyan(`Boom! Found ${images.length} ${images.length === 1 ? 'pic' : 'pics'}.`));
                        }
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
        console.log(chalk.italic("Hmm... Let's find some pics on this page! 🧐📷"));
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
