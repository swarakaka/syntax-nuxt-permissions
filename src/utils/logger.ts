// utils/logger.ts
export function useLogger() {
    const isDevelopment = process.env.NODE_ENV === 'development'
  
    return {
      debug: (message: string, data?: any) => {
        if (isDevelopment) {
          console.log(`[DEBUG] ${message}`, data)
        }
      },
      error: (message: string, error?: any) => {
        console.error(`[ERROR] ${message}`, error)
      },
      warn: (message: string, data?: any) => {
        console.warn(`[WARN] ${message}`, data)
      },
      info: (message: string, data?: any) => {
        console.info(`[INFO] ${message}`, data)
      }
    }
  }