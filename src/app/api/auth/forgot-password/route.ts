import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { sendPasswordResetEmail, isValidEmail } from '@/lib/email'
import { applyRateLimit, createRateLimitResponse, addSecurityHeaders } from '@/lib/rate-limit'
import crypto from 'crypto'

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
})

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await applyRateLimit(request, 'passwordReset')
    if (!rateLimitResult.success) {
      return createRateLimitResponse(rateLimitResult.error!)
    }

    const body = await request.json()
    const { email } = forgotPasswordSchema.parse(body)
    
    // Additional email validation
    if (!isValidEmail(email)) {
      return addSecurityHeaders(NextResponse.json(
        { error: 'Please enter a valid email address' },
        { status: 400 }
      ))
    }
    
    // Check if user exists (but don't reveal if they don't for security)
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true, name: true, email: true }
    })
    
    // Always respond with success to prevent email enumeration
    const successMessage = 'If an account with that email exists, you will receive a password reset link shortly.'
    
    if (user) {
      // Delete any existing password reset tokens for this user
      await prisma.passwordResetToken.deleteMany({
        where: { userId: user.id }
      })
      
      // Create new password reset token (expires in 1 hour)
      const token = crypto.randomBytes(32).toString('hex')
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour
      
      await prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          token,
          expiresAt,
        }
      })
      
      // Send password reset email
      try {
        await sendPasswordResetEmail(user.email, token, user.name || undefined)
      } catch (emailError) {
        console.error('Failed to send password reset email:', emailError)
        // Don't fail the request if email fails - user might have invalid email
        // but we still want to clean up the token
        await prisma.passwordResetToken.delete({
          where: { token }
        })
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
    
    console.error('Forgot password error:', error)
    return addSecurityHeaders(NextResponse.json(
      { error: 'An error occurred while processing your request' },
      { status: 500 }
    ))
  }
}