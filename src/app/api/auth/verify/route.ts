import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')
  
  if (!token) {
    return NextResponse.json({ error: 'Token is required' }, { status: 400 })
  }
  
  try {
    const verificationToken = await prisma.verificationToken.findUnique({
      where: { token }
    })
    
    if (!verificationToken || verificationToken.expires < new Date()) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 400 }
      )
    }
    
    await prisma.user.update({
      where: { email: verificationToken.identifier },
      data: { emailVerified: new Date() }
    })
    
    await prisma.verificationToken.delete({
      where: { token }
    })
    
    return NextResponse.redirect(new URL('/auth/signin?verified=true', request.url))
    
  } catch (error) {
    console.error('Verification error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}