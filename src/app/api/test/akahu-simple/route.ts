import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const appToken = process.env.AKAHU_APP_TOKEN
    const userToken = process.env.AKAHU_USER_TOKEN

    if (!appToken || !userToken) {
      return NextResponse.json({
        success: false,
        error: 'Missing Akahu tokens in environment variables'
      })
    }

    const results = []

    // Approach 1: Use built-in fetch with Railway-specific settings
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000)

      const response = await fetch('https://api.akahu.io/v1/accounts', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${userToken}`,
          'X-Akahu-ID': appToken,
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (compatible; RentLite/1.0)',
        },
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (response.ok) {
        const data = await response.json()
        results.push({
          approach: 'fetch_with_useragent',
          success: true,
          status: response.status,
          accountCount: data?.items?.length || 0,
          data: data
        })
      } else {
        results.push({
          approach: 'fetch_with_useragent',
          success: false,
          status: response.status,
          statusText: response.statusText,
        })
      }
    } catch (error: any) {
      results.push({
        approach: 'fetch_with_useragent',
        success: false,
        error: error.message,
        name: error.name,
      })
    }

    // Approach 2: Try direct IP if available (resolve api.akahu.nz first)
    try {
      // Try with a different subdomain or path
      const response = await fetch('https://api.akahu.io/ping', {
        method: 'GET',
        headers: {
          'User-Agent': 'RentLite-Test/1.0',
        },
        signal: AbortSignal.timeout(8000),
      })

      results.push({
        approach: 'ping_endpoint',
        success: response.ok,
        status: response.status,
        message: response.ok ? 'Akahu API is reachable' : 'Akahu API returned error'
      })
    } catch (error: any) {
      results.push({
        approach: 'ping_endpoint',
        success: false,
        error: error.message,
        message: 'Cannot reach Akahu API at all'
      })
    }

    // Environment debugging
    const envDebug = {
      NODE_ENV: process.env.NODE_ENV,
      RAILWAY_ENVIRONMENT: process.env.RAILWAY_ENVIRONMENT,
      RAILWAY_PROJECT_ID: process.env.RAILWAY_PROJECT_ID,
      RAILWAY_SERVICE_ID: process.env.RAILWAY_SERVICE_ID,
      hasAkahuTokens: !!(appToken && userToken),
      appTokenLength: appToken?.length,
      userTokenLength: userToken?.length,
    }

    return NextResponse.json({
      environment: envDebug,
      results,
      diagnosis: results.length > 0 && results.every(r => !r.success) 
        ? 'Complete network connectivity failure to api.akahu.nz'
        : results.some(r => r.success) 
        ? 'Partial connectivity - check specific approach'
        : 'Mixed results - need investigation'
    })

  } catch (error) {
    console.error('Simple Akahu test error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}