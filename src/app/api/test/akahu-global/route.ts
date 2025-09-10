import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { akahuGlobal } from '@/lib/akahuGlobal'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!akahuGlobal.isConfigured()) {
      return NextResponse.json({
        success: false,
        error: 'Akahu tokens not configured in environment variables',
        message: 'Please set AKAHU_APP_TOKEN and AKAHU_USER_TOKEN environment variables'
      })
    }

    // Test the connection
    const isConnected = await akahuGlobal.testConnection()
    
    if (isConnected) {
      // Get basic account info to verify access
      const accounts = await akahuGlobal.getAccounts()
      
      return NextResponse.json({
        success: true,
        message: 'Akahu connection successful using environment variables!',
        method: 'environment_variables',
        accounts: accounts.map(acc => ({
          id: acc._id,
          name: acc.name,
          type: acc.type,
          accountNumber: acc.attributes?.account_number || 'N/A'
        }))
      })
    } else {
      return NextResponse.json({
        success: false,
        error: 'Connection failed',
        message: 'Could not connect to Akahu using environment variables. Please check your tokens.'
      })
    }

  } catch (error) {
    console.error('Akahu global test error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to test Akahu connection with environment variables'
    }, { status: 500 })
  }
}