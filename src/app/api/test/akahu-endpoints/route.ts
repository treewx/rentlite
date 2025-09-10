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

    // Try different Akahu endpoints
    const endpoints = [
      'https://api.akahu.nz/v1/accounts',
      'https://api.akahu.io/v1/accounts', 
      'https://www.api.akahu.nz/v1/accounts',
      'https://prod-api.akahu.nz/v1/accounts',
      'https://api.akahu.nz/v2/accounts',
      'https://api.akahu.nz/accounts',
      'http://api.akahu.nz/v1/accounts', // HTTP (not recommended)
    ]

    const results = []

    for (const endpoint of endpoints) {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 8000)

        const response = await fetch(endpoint, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${userToken}`,
            'X-Akahu-ID': appToken,
            'Content-Type': 'application/json',
          },
          signal: controller.signal,
        })

        clearTimeout(timeoutId)

        if (response.ok) {
          const data = await response.json()
          results.push({
            endpoint,
            success: true,
            status: response.status,
            accountCount: data?.items?.length || 0,
            message: '✅ SUCCESS - This endpoint works!'
          })
        } else {
          results.push({
            endpoint,
            success: false,
            status: response.status,
            statusText: response.statusText,
            message: `❌ HTTP error: ${response.status}`
          })
        }
      } catch (error: any) {
        results.push({
          endpoint,
          success: false,
          error: error.message,
          code: error.name,
          message: error.message.includes('ENOTFOUND') 
            ? '❌ DNS resolution failed' 
            : `❌ Network error: ${error.message}`
        })
      }
    }

    return NextResponse.json({
      tested_endpoints: endpoints.length,
      results,
      working_endpoints: results.filter(r => r.success),
      summary: {
        total: results.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
      },
      recommendation: results.find(r => r.success) 
        ? `Use: ${results.find(r => r.success)?.endpoint}`
        : 'No working endpoints found - check network connectivity'
    })

  } catch (error) {
    console.error('Endpoint test error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}