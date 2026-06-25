import * as cheerio from 'cheerio'
import type { Cheerio } from 'cheerio'

export function selectText(
  root: cheerio.CheerioAPI | Cheerio<any>,
  selectors: string[]
): string {
  for (const sel of selectors) {
    if ((root as any).find) {
      const found = (root as cheerio.CheerioAPI).find(sel).first()
      if (found.length) return found.text().trim()
    }
  }
  return ''
}

export function selectAttr(
  root: cheerio.CheerioAPI | Cheerio<any>,
  selectors: string[],
  attr: string
): string | undefined {
  for (const sel of selectors) {
    if ((root as any).find) {
      const found = (root as cheerio.CheerioAPI).find(sel).first()
      const val = found.attr(attr)
      if (val) return val
    }
  }
  return undefined
}