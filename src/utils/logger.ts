// utils/logger.ts
export function useLogger() {
  const isDevelopment = process.env.NODE_ENV === 'development'

  return {
    debug: (message: string, data?: unknown) => {
      if (isDevelopment) {
        console.log(`[DEBUG] ${message}`, data)
      }
    },
    error: (message: string, error?: unknown) => {
      console.error(`[ERROR] ${message}`, error)
    },
    warn: (message: string, data?: unknown) => {
      console.warn(`[WARN] ${message}`, data)
    },
    info: (message: string, data?: unknown) => {
      console.info(`[INFO] ${message}`, data)
    },
  }
}
