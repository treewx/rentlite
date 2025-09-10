import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Demo mode - simulate successful Akahu connection
    return NextResponse.json({
      success: true,
      message: 'Demo mode - Akahu connection simulation',
      demo: true,
      accounts: [
        {
          id: 'demo_account_1',
          name: 'ANZ Current Account',
          type: 'CURRENT',
          accountNumber: '01-1234-1234567-00'
        },
        {
          id: 'demo_account_2', 
          name: 'Savings Account',
          type: 'SAVINGS',
          accountNumber: '01-1234-1234568-00'
        }
      ]
    })

  } catch (error) {
    console.error('Demo test error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Demo mode failed'
    }, { status: 500 })
  }
}