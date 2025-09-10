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

    const rawAppToken = process.env.AKAHU_APP_TOKEN
    const rawUserToken = process.env.AKAHU_USER_TOKEN

    // Clean tokens exactly as our service does
    const cleanAppToken = (rawAppToken || '').trim().replace(/[\r\n\t]/g, '')
    const cleanUserToken = (rawUserToken || '').trim().replace(/[\r\n\t]/g, '')

    const diagnosis = {
      tokenInfo: {
        hasRawAppToken: !!rawAppToken,
        hasRawUserToken: !!rawUserToken,
        rawAppTokenLength: rawAppToken?.length || 0,
        rawUserTokenLength: rawUserToken?.length || 0,
        cleanAppTokenLength: cleanAppToken.length,
        cleanUserTokenLength: cleanUserToken.length,
        appTokenFirstChars: cleanAppToken.substring(0, 8) + '...',
        userTokenFirstChars: cleanUserToken.substring(0, 8) + '...',
        appTokenFormat: {
          startsWithApp: cleanAppToken.startsWith('app_'),
          hasValidChars: /^[a-zA-Z0-9_-]+$/.test(cleanAppToken),
          length: cleanAppToken.length,
        },
        userTokenFormat: {
          startsWithUser: cleanUserToken.startsWith('user_'),
          hasValidChars: /^[a-zA-Z0-9_-]+$/.test(cleanUserToken),
          length: cleanUserToken.length,
        }
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        railwayEnv: process.env.RAILWAY_ENVIRONMENT,
      }
    }

    if (!cleanAppToken || !cleanUserToken) {
      return NextResponse.json({
        success: false,
        error: 'Missing tokens',
        diagnosis
      })
    }

    // Test the exact request that's failing
    const headers = {
      'Authorization': `Bearer ${cleanUserToken}`,
      'X-Akahu-Id': cleanAppToken,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'User-Agent': 'RentLite/1.0'
    }

    try {
      console.log('Making diagnostic Akahu request...')
      const response = await axios.get('https://api.akahu.io/v1/accounts', {
        headers,
        timeout: 15000,
      })

      return NextResponse.json({
        success: true,
        diagnosis,
        akahuResponse: {
          status: response.status,
          statusText: response.statusText,
          accountCount: response.data?.items?.length || 0,
          hasItems: !!response.data?.items,
          successFlag: response.data?.success
        }
      })

    } catch (error: any) {
      console.error('Akahu diagnostic request failed:', error)
      
      const errorDetails = {
        message: error.message,
        code: error.code,
        status: error.response?.status,
        statusText: error.response?.statusText,
        responseData: error.response?.data,
        responseHeaders: error.response?.headers,
        isAxiosError: axios.isAxiosError(error),
      }

      return NextResponse.json({
        success: false,
        error: 'Akahu API request failed',
        diagnosis,
        errorDetails
      })
    }

  } catch (error) {
    console.error('Diagnostic endpoint error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}