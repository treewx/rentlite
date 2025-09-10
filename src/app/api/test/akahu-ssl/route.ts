import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import axios from 'axios'
import https from 'https'

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

    // Test 1: Standard HTTPS request
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
        approach: 'standard_https',
        success: true,
        status: response1.status,
        accountCount: response1.data?.items?.length || 0
      })
    } catch (error: any) {
      results.push({
        approach: 'standard_https',
        success: false,
        error: error.message,
        code: error.code,
        status: error.response?.status,
      })
    }

    // Test 2: With SSL verification disabled (for testing only)
    try {
      const httpsAgent = new https.Agent({
        rejectUnauthorized: false, // WARNING: Only for testing
      })

      const response2 = await axios.get('https://api.akahu.io/v1/accounts', {
        headers: {
          'Authorization': `Bearer ${userToken}`,
          'X-Akahu-ID': appToken,
          'Content-Type': 'application/json',
        },
        httpsAgent,
        timeout: 10000,
      })
      results.push({
        approach: 'ssl_disabled',
        success: true,
        status: response2.status,
        accountCount: response2.data?.items?.length || 0,
        warning: 'SSL verification disabled - not for production'
      })
    } catch (error: any) {
      results.push({
        approach: 'ssl_disabled',
        success: false,
        error: error.message,
        code: error.code,
        status: error.response?.status,
      })
    }

    // Test 3: Using IP address instead of domain (if we can resolve it)
    try {
      // Try with different user agent
      const response3 = await axios.get('https://api.akahu.io/v1/accounts', {
        headers: {
          'Authorization': `Bearer ${userToken}`,
          'X-Akahu-ID': appToken,
          'Content-Type': 'application/json',
          'User-Agent': 'RentLite/1.0 (Railway deployment)',
        },
        timeout: 10000,
      })
      results.push({
        approach: 'custom_user_agent',
        success: true,
        status: response3.status,
        accountCount: response3.data?.items?.length || 0
      })
    } catch (error: any) {
      results.push({
        approach: 'custom_user_agent',
        success: false,
        error: error.message,
        code: error.code,
        status: error.response?.status,
      })
    }

    return NextResponse.json({
      results,
      ssl_warning: 'SSL certificate issues detected in Railway deployment',
      note: 'If ssl_disabled approach works, this confirms SSL certificate issue',
      summary: {
        total: results.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
      }
    })

  } catch (error) {
    console.error('SSL test error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}