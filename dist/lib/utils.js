import chalk from 'chalk';
import { writeFileSync } from 'fs';
export const DEPTH_LIMIT = 100;
export function normalizeURL(url) {
    try {
        const urlObj = url.includes('http')
            ? new URL(url)
            : new URL(`https://${url}`);
        const path = `${urlObj.origin}${urlObj.pathname}`;
        if (path.length > 0 && path.slice(-1) === '/') {
            return path.slice(0, -1);
        }
        return path;
    }
    catch (e) {
        throw new Error(chalk.red(`${e.message}`));
    }
}
export function getOnlyHostURLs(urls, baseURL) {
    const validURLs = new Set();
    for (const url of urls) {
        if (url.slice(0, 1) === '/') {
            try {
                const { origin, pathname } = new URL(`${baseURL}${url}`);
                validURLs.add(`${origin}${pathname}`);
            }
            catch (e) {
                console.log(chalk.red(`Invalid absolute url ${e.message}`));
            }
        }
        else {
            try {
                const { origin, pathname } = new URL(url);
                validURLs.add(`${origin}${pathname}`);
            }
            catch (e) {
                console.log(chalk.red(`Invalid absolute url ${e.message}`));
            }
        }
    }
    return [...validURLs].filter((url) => url.includes(baseURL));
}
export function getUnique(value) {
    return [...new Set(value)];
}
export function exportToJson(jsonData, baseURL) {
    const { hostname } = new URL(baseURL);
    const path = `./imagesFrom[${hostname}].json`;
    try {
        writeFileSync(path, JSON.stringify(jsonData, null, 2), 'utf8');
        console.log(chalk.green('Saved!'));
    }
    catch (error) {
        console.log(error);
    }
}
