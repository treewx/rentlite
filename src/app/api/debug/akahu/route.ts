import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import axios from 'axios'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const appToken = process.env.AKAHU_APP_TOKEN
    const userToken = process.env.AKAHU_USER_TOKEN

    // Debug info
    const debugInfo = {
      hasAppToken: !!appToken,
      hasUserToken: !!userToken,
      appTokenLength: appToken?.length || 0,
      userTokenLength: userToken?.length || 0,
      appTokenPrefix: appToken?.substring(0, 10) + '...',
      userTokenPrefix: userToken?.substring(0, 10) + '...',
      nodeEnv: process.env.NODE_ENV,
      platform: process.platform,
    }

    if (!appToken || !userToken) {
      return NextResponse.json({
        success: false,
        error: 'Missing tokens',
        debug: debugInfo
      })
    }

    // Try different approaches
    const results = []

    // Approach 1: Basic axios request
    try {
      const response1 = await axios.get('https://api.akahu.io/v1/accounts', {
        headers: {
          'Authorization': `Bearer ${userToken}`,
          'X-Akahu-ID': appToken,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      })
      results.push({
        approach: 'basic_axios',
        success: true,
        status: response1.status,
        accountCount: response1.data?.items?.length || 0
      })
    } catch (error: any) {
      results.push({
        approach: 'basic_axios',
        success: false,
        error: error.message,
        code: error.code,
        status: error.response?.status,
        statusText: error.response?.statusText,
      })
    }

    // Approach 2: Different headers order
    try {
      const response2 = await axios.get('https://api.akahu.io/v1/accounts', {
        headers: {
          'X-Akahu-ID': appToken,
          'Authorization': `Bearer ${userToken}`,
        },
        timeout: 10000,
      })
      results.push({
        approach: 'reordered_headers',
        success: true,
        status: response2.status,
        accountCount: response2.data?.items?.length || 0
      })
    } catch (error: any) {
      results.push({
        approach: 'reordered_headers',
        success: false,
        error: error.message,
        code: error.code,
        status: error.response?.status,
      })
    }

    // Approach 3: Using fetch instead of axios
    try {
      const response3 = await fetch('https://api.akahu.io/v1/accounts', {
        headers: {
          'Authorization': `Bearer ${userToken}`,
          'X-Akahu-ID': appToken,
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(10000),
      })
      
      if (response3.ok) {
        const data = await response3.json()
        results.push({
          approach: 'fetch_api',
          success: true,
          status: response3.status,
          accountCount: data?.items?.length || 0
        })
      } else {
        results.push({
          approach: 'fetch_api',
          success: false,
          status: response3.status,
          statusText: response3.statusText,
        })
      }
    } catch (error: any) {
      results.push({
        approach: 'fetch_api',
        success: false,
        error: error.message,
        name: error.name,
      })
    }

    return NextResponse.json({
      debug: debugInfo,
      results,
      summary: {
        totalAttempts: results.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
      }
    })

  } catch (error) {
    console.error('Debug error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}