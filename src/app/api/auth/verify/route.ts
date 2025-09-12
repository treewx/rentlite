import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { addSecurityHeaders } from '@/lib/rate-limit'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')
  
  if (!token) {
    return addSecurityHeaders(NextResponse.json(
      { error: 'Verification token is required' }, 
      { status: 400 }
    ))
  }
  
  try {
    // Find user with this verification token
    const user = await prisma.user.findFirst({
      where: {
        emailVerificationToken: token,
        emailVerificationExpires: {
          gt: new Date() // Token hasn't expired
        }
      }
    })
    
    if (!user) {
      // Redirect to an error page or signin with error message
      return NextResponse.redirect(
        new URL('/auth/signin?error=verification-failed&message=Invalid or expired verification link', request.url)
      )
    }
    
    // Check if already verified
    if (user.emailVerified) {
      return NextResponse.redirect(
        new URL('/auth/signin?verified=already&message=Email already verified', request.url)
      )
    }
    
    // Verify the user
    await prisma.user.update({
      where: { id: user.id },
      data: { 
        emailVerified: new Date(),
        emailVerificationToken: null, // Clear the token
        emailVerificationExpires: null // Clear the expiration
      }
    })
    
    console.log(`Email verified successfully for user: ${user.email}`)
    
    return NextResponse.redirect(
      new URL('/auth/signin?verified=true', request.url)
    )
    
  } catch (error) {
    console.error('Email verification error:', error)
    return NextResponse.redirect(
      new URL('/auth/signin?error=verification-error&message=An error occurred during verification', request.url)
    )
  }
}