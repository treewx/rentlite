import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createAkahuService } from '@/lib/akahu'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const akahuService = await createAkahuService(session.user.id)
    
    if (!akahuService) {
      return NextResponse.json({
        success: false,
        error: 'Akahu tokens not configured',
        message: 'Please enter your Akahu App Token and User Token in settings'
      })
    }

    // Test the connection
    const isConnected = await akahuService.testConnection()
    
    if (isConnected) {
      // Get basic account info to verify access
      const accounts = await akahuService.getAccounts()
      
      return NextResponse.json({
        success: true,
        message: 'Akahu connection successful!',
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
        message: 'Could not connect to Akahu. Please check your tokens.'
      })
    }

  } catch (error) {
    console.error('Akahu test error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to test Akahu connection'
    }, { status: 500 })
  }
}