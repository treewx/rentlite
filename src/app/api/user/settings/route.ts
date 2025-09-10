import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateSettingsSchema = z.object({
  akahuAppToken: z.string().optional(),
  akahuUserToken: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        akahuAppToken: true,
        akahuUserToken: true,
      }
    })
    
    return NextResponse.json(user || {})
    
  } catch (error) {
    console.error('Error fetching user settings:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const body = await request.json()
    const data = updateSettingsSchema.parse(body)
    
    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        akahuAppToken: data.akahuAppToken || null,
        akahuUserToken: data.akahuUserToken || null,
      },
      select: {
        akahuAppToken: true,
        akahuUserToken: true,
      }
    })
    
    return NextResponse.json(user)
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    
    console.error('Error updating user settings:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}