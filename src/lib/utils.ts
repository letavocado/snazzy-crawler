import chalk from 'chalk'
import { writeFileSync } from 'fs'
import { type CrawlerResult } from './core.js'

export const DEPTH_LIMIT = 100

export function normalizeURL (url: string): string {
  try {
    const urlObj = url.includes('http')
      ? new URL(url)
      : new URL(`https://${url}`)
    const path: string = `${urlObj.origin}${urlObj.pathname}`

    if (path.length > 0 && path.slice(-1) === '/') {
      return path.slice(0, -1)
    }
    return path
  } catch (e) {
    throw new Error(chalk.red(`${(e as Error).message}`))
  }
}

export function getOnlyHostURLs (urls: string[], baseURL: string): string[] {
  const validURLs = new Set<string>()
  for (const url of urls) {
    if (url.slice(0, 1) === '/') {
      try {
        const { origin, pathname } = new URL(`${baseURL}${url}`)
        validURLs.add(`${origin}${pathname}`)
      } catch (e) {
        console.log(chalk.red(`Invalid absolute url ${(e as Error).message}`))
      }
    } else {
      try {
        const { origin, pathname } = new URL(url)
        validURLs.add(`${origin}${pathname}`)
      } catch (e) {
        console.log(chalk.red(`Invalid absolute url ${(e as Error).message}`))
      }
    }
  }
  return [...validURLs].filter((url) => url.includes(baseURL))
}

export function getUnique (value: any[]): any[] {
  return [...new Set(value)]
}

export function exportToJson (jsonData: CrawlerResult, baseURL: string): void {
  const { hostname } = new URL(baseURL)
  const path = `./imagesFrom[${hostname}].json`
  try {
    writeFileSync(path, JSON.stringify(jsonData, null, 2), 'utf8')
    console.log(chalk.green('Saved!'))
  } catch (error) {
    console.log(error)
  }
}
