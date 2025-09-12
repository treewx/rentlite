// Simple in-memory rate limiting implementation
interface RateLimitStore {
  [key: string]: {
    count: number
    resetTime: number
  }
}

const store: RateLimitStore = {}

// Clean up expired entries every minute
setInterval(() => {
  const now = Date.now()
  Object.keys(store).forEach(key => {
    if (store[key].resetTime < now) {
      delete store[key]
    }
  })
}, 60 * 1000)

// Different rate limits for different operations
export const rateLimits = {
  // Auth operations - more restrictive
  login: {
    max: 10, // 10 attempts per minute
    message: 'Too many login attempts. Please try again in a minute.',
  },
  register: {
    max: 3, // 3 registrations per minute
    message: 'Too many registration attempts. Please try again in a minute.',
  },
  passwordReset: {
    max: 5, // 5 password reset requests per minute
    message: 'Too many password reset requests. Please try again in a minute.',
  },
  emailVerification: {
    max: 3, // 3 verification email requests per minute
    message: 'Too many verification email requests. Please try again in a minute.',
  },
  
  // General API operations - less restrictive
  api: {
    max: 100, // 100 API requests per minute
    message: 'Too many API requests. Please slow down.',
  },
}

// Rate limiting middleware function
export async function applyRateLimit(
  request: Request,
  operation: keyof typeof rateLimits
): Promise<{ success: boolean; error?: string; remaining?: number }> {
  try {
    const identifier = getClientId(request)
    const limit = rateLimits[operation]
    const key = `${operation}:${identifier}`
    const now = Date.now()
    const resetTime = Math.floor(now / 60000) * 60000 + 60000 // Next minute boundary
    
    // Get or create rate limit entry
    let entry = store[key]
    if (!entry || entry.resetTime < now) {
      entry = { count: 0, resetTime }
      store[key] = entry
    }
    
    // Check if limit exceeded
    if (entry.count >= limit.max) {
      console.warn(`Rate limit exceeded for ${operation}: ${identifier}`)
      return {
        success: false,
        error: limit.message,
      }
    }
    
    // Increment counter
    entry.count++
    
    return {
      success: true,
      remaining: limit.max - entry.count,
    }
  } catch (error) {
    console.error('Rate limiting error:', error)
    // In case of rate limiting service failure, allow the request through
    // but log the error for monitoring
    return { success: true }
  }
}

// Get client identifier (IP address with fallbacks)
function getClientId(request: Request): string {
  // Try to get real IP address from various headers
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const clientIp = request.headers.get('x-client-ip')
  
  if (forwarded) {
    // x-forwarded-for can contain multiple IPs, get the first one
    return forwarded.split(',')[0].trim()
  }
  
  if (realIp) {
    return realIp
  }
  
  if (clientIp) {
    return clientIp
  }
  
  // Fallback to a default identifier
  return 'unknown-client'
}

// Rate limit response helper
export function createRateLimitResponse(error: string) {
  return new Response(
    JSON.stringify({ 
      error,
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter: 60 // seconds
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': '60',
      },
    }
  )
}

// Security headers helper
export function addSecurityHeaders(response: Response): Response {
  // Clone the response to add headers
  const secureResponse = new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  })
  
  // Add security headers
  secureResponse.headers.set('X-Content-Type-Options', 'nosniff')
  secureResponse.headers.set('X-Frame-Options', 'DENY')
  secureResponse.headers.set('X-XSS-Protection', '1; mode=block')
  secureResponse.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  
  return secureResponse
}