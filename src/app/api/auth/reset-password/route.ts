import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { applyRateLimit, createRateLimitResponse, addSecurityHeaders } from '@/lib/rate-limit'
import bcrypt from 'bcryptjs'

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters long')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one uppercase letter, one lowercase letter, and one number'),
})

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await applyRateLimit(request, 'passwordReset')
    if (!rateLimitResult.success) {
      return createRateLimitResponse(rateLimitResult.error!)
    }

    const body = await request.json()
    const { token, password } = resetPasswordSchema.parse(body)
    
    // Find the password reset token
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true }
    })
    
    if (!resetToken || resetToken.used || resetToken.expiresAt < new Date()) {
      return addSecurityHeaders(NextResponse.json(
        { error: 'Invalid or expired reset token' },
        { status: 400 }
      ))
    }
    
    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 12)
    
    // Update user password and mark token as used
    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetToken.userId },
        data: { password: hashedPassword }
      }),
      prisma.passwordResetToken.update({
        where: { token },
        data: { used: true }
      })
    ])
    
    // Clean up all password reset tokens for this user
    await prisma.passwordResetToken.deleteMany({
      where: { 
        userId: resetToken.userId,
        used: true
      }
    })
    
    return addSecurityHeaders(NextResponse.json({
      message: 'Password has been reset successfully. You can now sign in with your new password.'
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
    
    console.error('Reset password error:', error)
    return addSecurityHeaders(NextResponse.json(
      { error: 'An error occurred while resetting your password' },
      { status: 500 }
    ))
  }
}