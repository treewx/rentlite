import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { sendVerificationEmail, isValidEmail } from '@/lib/email'
import { applyRateLimit, createRateLimitResponse, addSecurityHeaders } from '@/lib/rate-limit'
import crypto from 'crypto'

const resendVerificationSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
})

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await applyRateLimit(request, 'emailVerification')
    if (!rateLimitResult.success) {
      return createRateLimitResponse(rateLimitResult.error!)
    }

    const body = await request.json()
    const { email } = resendVerificationSchema.parse(body)
    
    // Additional email validation
    if (!isValidEmail(email)) {
      return addSecurityHeaders(NextResponse.json(
        { error: 'Please enter a valid email address' },
        { status: 400 }
      ))
    }
    
    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    })
    
    // Always respond with success to prevent email enumeration
    const successMessage = 'If an unverified account with that email exists, you will receive a verification email shortly.'
    
    if (user && !user.emailVerified) {
      // Generate new verification token
      const verificationToken = crypto.randomBytes(32).toString('hex')
      const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
      
      // Update user with new verification token
      await prisma.user.update({
        where: { id: user.id },
        data: {
          emailVerificationToken: verificationToken,
          emailVerificationExpires: verificationExpires,
        }
      })
      
      // Send verification email
      try {
        await sendVerificationEmail(user.email, verificationToken, user.name || undefined)
      } catch (emailError) {
        console.error('Failed to resend verification email:', emailError)
        // Don't fail the request if email fails
      }
    }
    
    return addSecurityHeaders(NextResponse.json({
      message: successMessage
    }))
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return addSecurityHeaders(NextResponse.json(
        { 
          error: 'Invalid input',
          details: error.errors.map(e => e.message)
        },
        { status: 400 }
      ))
    }
    
    console.error('Resend verification error:', error)
    return addSecurityHeaders(NextResponse.json(
      { error: 'An error occurred while processing your request' },
      { status: 500 }
    ))
  }
}