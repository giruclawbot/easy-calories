/**
 * Logger centralizado para Easy Calories
 *
 * - En desarrollo: loguea a consola con prefijo y contexto completo
 * - En producción: loguea errores/warnings a consola (minimal) + Firebase Analytics (errores)
 *
 * Uso:
 *   import { logger } from '@/lib/logger'
 *   logger.info('firestore', 'getDayData', 'Loaded meals', { date, uid })
 *   logger.warn('recipes', 'createRecipe', 'Missing description field')
 *   logger.error('recipes', 'createRecipe', 'Firestore write failed', error)
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

const isDev = process.env.NODE_ENV === 'development'

const COLORS: Record<LogLevel, string> = {
  debug: '#6b7280',
  info:  '#10b981',
  warn:  '#f59e0b',
  error: '#ef4444',
}

function formatMessage(level: LogLevel, module: string, fn: string, msg: string): string {
  return `[${level.toUpperCase()}] [${module}::${fn}] ${msg}`
}

function sendToAnalytics(level: LogLevel, module: string, fn: string, msg: string, extra?: unknown) {
  // Only send errors/warns to analytics in production
  if (typeof window === 'undefined') return
  try {
    // Dynamic import to avoid SSR issues
    import('firebase/analytics').then(({ getAnalytics, logEvent }) => {
      import('./firebase').then(({ getFirebaseApp }) => {
        const app = getFirebaseApp()
        if (!app) return
        const analytics = getAnalytics(app)
        logEvent(analytics, level === 'error' ? 'app_error' : 'app_warning', {
          module,
          function: fn,
          message: msg.slice(0, 100),
          extra: extra ? String(extra).slice(0, 200) : undefined,
        })
      })
    }).catch(() => {/* analytics not available, no-op */})
  } catch {
    // Never let logger crash the app
  }
}

export const logger = {
  debug(module: string, fn: string, msg: string, extra?: unknown) {
    if (!isDev) return  // debug only in dev
    console.debug(
      `%c${formatMessage('debug', module, fn, msg)}`,
      `color: ${COLORS.debug}`,
      extra ?? ''
    )
  },

  info(module: string, fn: string, msg: string, extra?: unknown) {
    if (isDev) {
      console.info(
        `%c${formatMessage('info', module, fn, msg)}`,
        `color: ${COLORS.info}`,
        extra ?? ''
      )
    }
    // info not sent to analytics — too noisy
  },

  warn(module: string, fn: string, msg: string, extra?: unknown) {
    const formatted = formatMessage('warn', module, fn, msg)
    if (isDev) {
      console.warn(`%c${formatted}`, `color: ${COLORS.warn}`, extra ?? '')
    } else {
      console.warn(formatted, extra ?? '')
    }
    sendToAnalytics('warn', module, fn, msg, extra)
  },

  error(module: string, fn: string, msg: string, extra?: unknown) {
    const formatted = formatMessage('error', module, fn, msg)
    if (isDev) {
      console.error(`%c${formatted}`, `color: ${COLORS.error}`, extra ?? '')
    } else {
      console.error(formatted, extra ?? '')
    }
    sendToAnalytics('error', module, fn, msg, extra)
  },
}

/**
 * Convenience: wrap an async function with automatic error logging
 *
 * Usage:
 *   const result = await withLog('recipes', 'createRecipe', async () => { ... })
 */
export async function withLog<T>(
  module: string,
  fn: string,
  operation: () => Promise<T>
): Promise<T> {
  logger.debug(module, fn, 'start')
  try {
    const result = await operation()
    logger.debug(module, fn, 'success')
    return result
  } catch (e) {
    logger.error(module, fn, 'failed', e)
    throw e
  }
}
