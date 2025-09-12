// Comprehensive logging utility for the email system

export enum LogLevel {
  ERROR = 'ERROR',
  WARN = 'WARN',
  INFO = 'INFO',
  DEBUG = 'DEBUG',
}

export interface LogEntry {
  timestamp: string
  level: LogLevel
  category: string
  message: string
  data?: any
  error?: Error
  userId?: string
  email?: string
  ip?: string
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development'
  
  private formatTimestamp(): string {
    return new Date().toISOString()
  }

  private log(entry: LogEntry): void {
    const logLine = this.formatLogEntry(entry)
    
    // Always log to console in development
    if (this.isDevelopment || entry.level === LogLevel.ERROR) {
      switch (entry.level) {
        case LogLevel.ERROR:
          console.error(logLine, entry.error || entry.data)
          break
        case LogLevel.WARN:
          console.warn(logLine, entry.data)
          break
        case LogLevel.DEBUG:
          console.debug(logLine, entry.data)
          break
        default:
          console.log(logLine, entry.data)
      }
    }
    
    // In production, you might want to send logs to an external service
    // like LogRocket, Sentry, or CloudWatch
    if (!this.isDevelopment && entry.level === LogLevel.ERROR) {
      this.sendToExternalLogging(entry)
    }
  }

  private formatLogEntry(entry: LogEntry): string {
    const parts = [
      entry.timestamp,
      `[${entry.level}]`,
      `[${entry.category}]`,
    ]
    
    if (entry.userId) {
      parts.push(`[User:${entry.userId}]`)
    }
    
    if (entry.email) {
      parts.push(`[Email:${entry.email}]`)
    }
    
    if (entry.ip) {
      parts.push(`[IP:${entry.ip}]`)
    }
    
    parts.push(entry.message)
    
    return parts.join(' ')
  }

  private sendToExternalLogging(entry: LogEntry): void {
    // Placeholder for external logging service integration
    // In a real application, you'd integrate with services like:
    // - Sentry for error tracking
    // - LogRocket for user session recording
    // - AWS CloudWatch for server logs
    // - DataDog for application monitoring
    
    if (this.isDevelopment) {
      console.log('🚀 Would send to external logging:', entry)
    }
  }

  // Public logging methods
  error(category: string, message: string, error?: Error, data?: any, context?: { userId?: string, email?: string, ip?: string }): void {
    this.log({
      timestamp: this.formatTimestamp(),
      level: LogLevel.ERROR,
      category,
      message,
      error,
      data,
      ...context,
    })
  }

  warn(category: string, message: string, data?: any, context?: { userId?: string, email?: string, ip?: string }): void {
    this.log({
      timestamp: this.formatTimestamp(),
      level: LogLevel.WARN,
      category,
      message,
      data,
      ...context,
    })
  }

  info(category: string, message: string, data?: any, context?: { userId?: string, email?: string, ip?: string }): void {
    this.log({
      timestamp: this.formatTimestamp(),
      level: LogLevel.INFO,
      category,
      message,
      data,
      ...context,
    })
  }

  debug(category: string, message: string, data?: any, context?: { userId?: string, email?: string, ip?: string }): void {
    if (this.isDevelopment) {
      this.log({
        timestamp: this.formatTimestamp(),
        level: LogLevel.DEBUG,
        category,
        message,
        data,
        ...context,
      })
    }
  }

  // Specialized email logging methods
  emailSent(operation: string, email: string, data?: any): void {
    this.info('EMAIL', `${operation} email sent successfully to ${email}`, data, { email })
  }

  emailFailed(operation: string, email: string, error: Error, data?: any): void {
    this.error('EMAIL', `${operation} email failed for ${email}`, error, data, { email })
  }

  authEvent(event: string, userId?: string, email?: string, ip?: string, data?: any): void {
    this.info('AUTH', event, data, { userId, email, ip })
  }

  authError(event: string, error: Error, email?: string, ip?: string, data?: any): void {
    this.error('AUTH', event, error, data, { email, ip })
  }

  securityEvent(event: string, severity: 'low' | 'medium' | 'high', data?: any, context?: { userId?: string, email?: string, ip?: string }): void {
    const level = severity === 'high' ? LogLevel.ERROR : severity === 'medium' ? LogLevel.WARN : LogLevel.INFO
    this.log({
      timestamp: this.formatTimestamp(),
      level,
      category: 'SECURITY',
      message: `${severity.toUpperCase()} SECURITY EVENT: ${event}`,
      data,
      ...context,
    })
  }

  performanceMetric(operation: string, duration: number, success: boolean, data?: any): void {
    const message = `${operation} completed in ${duration}ms - ${success ? 'SUCCESS' : 'FAILED'}`
    this.info('PERFORMANCE', message, { duration, success, ...data })
  }
}

// Export a singleton logger instance
export const logger = new Logger()

// Email-specific logging helpers
export const emailLogger = {
  verificationSent: (email: string) => logger.emailSent('VERIFICATION', email),
  verificationFailed: (email: string, error: Error) => logger.emailFailed('VERIFICATION', email, error),
  passwordResetSent: (email: string) => logger.emailSent('PASSWORD_RESET', email),
  passwordResetFailed: (email: string, error: Error) => logger.emailFailed('PASSWORD_RESET', email, error),
  notificationSent: (email: string, subject: string) => logger.emailSent('NOTIFICATION', email, { subject }),
  notificationFailed: (email: string, error: Error, subject: string) => logger.emailFailed('NOTIFICATION', email, error, { subject }),
}

// Auth-specific logging helpers
export const authLogger = {
  registrationAttempt: (email: string, ip?: string) => logger.authEvent('Registration attempt', undefined, email, ip),
  registrationSuccess: (userId: string, email: string, ip?: string) => logger.authEvent('Registration successful', userId, email, ip),
  registrationFailed: (error: Error, email: string, ip?: string) => logger.authError('Registration failed', error, email, ip),
  loginAttempt: (email: string, ip?: string) => logger.authEvent('Login attempt', undefined, email, ip),
  loginSuccess: (userId: string, email: string, ip?: string) => logger.authEvent('Login successful', userId, email, ip),
  loginFailed: (error: Error, email: string, ip?: string) => logger.authError('Login failed', error, email, ip),
  emailVerified: (userId: string, email: string) => logger.authEvent('Email verified', userId, email),
  passwordReset: (userId: string, email: string, ip?: string) => logger.authEvent('Password reset', userId, email, ip),
}

// Security-specific logging helpers
export const securityLogger = {
  rateLimitExceeded: (operation: string, ip?: string, email?: string) => 
    logger.securityEvent(`Rate limit exceeded for ${operation}`, 'medium', { operation }, { email, ip }),
  invalidToken: (tokenType: string, email?: string, ip?: string) => 
    logger.securityEvent(`Invalid ${tokenType} token used`, 'medium', { tokenType }, { email, ip }),
  suspiciousActivity: (activity: string, data?: any, context?: { userId?: string, email?: string, ip?: string }) => 
    logger.securityEvent(`Suspicious activity: ${activity}`, 'high', data, context),
  tokenCleanup: (tokensDeleted: number) => 
    logger.info('TOKEN_CLEANUP', `Cleaned up ${tokensDeleted} expired tokens`),
}