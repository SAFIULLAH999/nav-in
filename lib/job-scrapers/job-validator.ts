import https from 'https'
import http from 'http'
import { URL } from 'url'

export interface ValidationResult {
  isValid: boolean
  statusCode?: number
  error?: string
  finalUrl?: string
}

export class JobUrlValidator {
  private cache: Map<string, { result: ValidationResult; timestamp: number }> = new Map()
  private cacheTTL = 1000 * 60 * 60 // 1 hour

  async validateJobUrl(url: string, timeout = 10000): Promise<ValidationResult> {
    if (!url || url.trim() === '') {
      return { isValid: false, error: 'Empty URL' }
    }

    const cached = this.cache.get(url)
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      return cached.result
    }

    try {
      const result = await this.checkUrl(url, timeout)
      this.cache.set(url, { result, timestamp: Date.now() })
      return result
    } catch (error) {
      return {
        isValid: false,
        error: error instanceof Error ? error.message : 'Validation failed'
      }
    }
  }

  private checkUrl(url: string, timeout: number): Promise<ValidationResult> {
    return new Promise((resolve) => {
      const parsed = new URL(url)
      const client = parsed.protocol === 'https:' ? https : http

      const request = client.get(url, {
        method: 'HEAD',
        timeout: timeout,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
        },
        rejectUnauthorized: false,
      }, (response) => {
        const statusCode = response.statusCode || 0
        const finalUrl = response.headers.location || url

        // Follow redirects manually up to 5 levels
        if (statusCode >= 300 && statusCode < 400 && response.headers.location) {
          const redirectUrl = response.headers.location.startsWith('http')
            ? response.headers.location
            : new URL(response.headers.location, url).href
          this.checkUrl(redirectUrl, timeout).then(resolve)
          return
        }

        const isValid = statusCode >= 200 && statusCode < 400

        resolve({
          isValid,
          statusCode,
          finalUrl: finalUrl !== url ? finalUrl : undefined,
        })
      })

      request.on('error', (error) => {
        resolve({
          isValid: false,
          error: error.message,
        })
      })

      request.on('timeout', () => {
        request.destroy()
        resolve({
          isValid: false,
          error: 'Request timeout',
        })
      })
    })
  }

  clearCache() {
    this.cache.clear()
  }

  getCacheSize(): number {
    return this.cache.size
  }
}

export const jobUrlValidator = new JobUrlValidator()