import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updatePropertySchema = z.object({
  address: z.string().min(5),
  tenantName: z.string().min(2),
  tenantEmail: z.string().email(),
  rentDueDay: z.number().min(1).max(31),
  rentFrequency: z.enum(['WEEKLY', 'FORTNIGHTLY', 'MONTHLY']),
  keywordMatch: z.string().min(2),
  notifyTenantOnMissed: z.boolean().default(false),
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const property = await prisma.property.findFirst({
      where: { 
        id: params.id,
        userId: session.user.id 
      }
    })
    
    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 })
    }
    
    return NextResponse.json(property)
    
  } catch (error) {
    console.error('Error fetching property:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const body = await request.json()
    const data = updatePropertySchema.parse(body)
    
    const property = await prisma.property.findFirst({
      where: { 
        id: params.id,
        userId: session.user.id 
      }
    })
    
    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 })
    }
    
    const updatedProperty = await prisma.property.update({
      where: { id: params.id },
      data
    })
    
    return NextResponse.json(updatedProperty)
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    
    console.error('Error updating property:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const property = await prisma.property.findFirst({
      where: { 
        id: params.id,
        userId: session.user.id 
      }
    })
    
    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 })
    }
    
    await prisma.property.delete({
      where: { id: params.id }
    })
    
    return NextResponse.json({ message: 'Property deleted successfully' })
    
  } catch (error) {
    console.error('Error deleting property:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}