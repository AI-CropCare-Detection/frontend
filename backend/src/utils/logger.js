/**
 * Simple logger that respects LOG_LEVEL and always prints to the backend terminal.
 * Levels: error, warn, info, debug (debug is most verbose).
 */

const LEVELS = { error: 0, warn: 1, info: 2, debug: 3 }
const levelName = (process.env.LOG_LEVEL || 'info').toLowerCase()
const currentLevel = LEVELS[levelName] ?? LEVELS.info

function shouldLog(level) {
  return LEVELS[level] !== undefined && LEVELS[level] <= currentLevel
}

function formatMessage(level, ...args) {
  const timestamp = new Date().toISOString()
  const prefix = `[${timestamp}] [${level.toUpperCase()}]`
  return [prefix, ...args]
}

export const logger = {
  error(...args) {
    if (shouldLog('error')) {
      console.error(...formatMessage('error', ...args))
    }
  },
  warn(...args) {
    if (shouldLog('warn')) {
      console.warn(...formatMessage('warn', ...args))
    }
  },
  info(...args) {
    if (shouldLog('info')) {
      console.log(...formatMessage('info', ...args))
    }
  },
  debug(...args) {
    if (shouldLog('debug')) {
      console.log(...formatMessage('debug', ...args))
    }
  },
}
