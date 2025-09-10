import { NextRequest, NextResponse } from 'next/server'
import { checkAllRentPayments } from '@/lib/rentChecker'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('Starting daily rent check...')
    const results = await checkAllRentPayments()
    
    console.log(`Rent check completed. Checked ${results.length} properties.`)
    
    return NextResponse.json({
      success: true,
      message: `Checked ${results.length} properties`,
      results: results.map(r => ({
        propertyId: r.propertyId,
        address: r.address,
        tenantName: r.tenantName,
        rentReceived: r.rentReceived,
        error: r.error
      }))
    })

  } catch (error) {
    console.error('Error in rent check cron job:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  return GET(request)
}