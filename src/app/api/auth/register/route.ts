import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { sendVerificationEmail, isValidEmail } from '@/lib/email'
import { applyRateLimit, createRateLimitResponse, addSecurityHeaders } from '@/lib/rate-limit'
import { authLogger, securityLogger } from '@/lib/logger'
import crypto from 'crypto'

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters long'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters long')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one uppercase letter, one lowercase letter, and one number'),
})

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await applyRateLimit(request, 'register')
    if (!rateLimitResult.success) {
      return createRateLimitResponse(rateLimitResult.error!)
    }

    const body = await request.json()
    const { name, email, password } = registerSchema.parse(body)
    
    // Additional email validation
    if (!isValidEmail(email)) {
      return addSecurityHeaders(NextResponse.json(
        { error: 'Please enter a valid email address' },
        { status: 400 }
      ))
    }
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    })
    
    if (existingUser) {
      return addSecurityHeaders(NextResponse.json(
        { error: 'An account with this email address already exists' },
        { status: 400 }
      ))
    }
    
    // Hash password with high cost factor
    const hashedPassword = await bcrypt.hash(password, 12)
    
    // Generate secure verification token
    const verificationToken = crypto.randomBytes(32).toString('hex')
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    
    // Create user with verification token
    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase(),
        password: hashedPassword,
        emailVerificationToken: verificationToken,
        emailVerificationExpires: verificationExpires,
      }
    })
    
    // Send verification email
    let emailSent = false
    try {
      await sendVerificationEmail(email.toLowerCase(), verificationToken, name.trim())
      emailSent = true
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError)
      // Don't fail registration if email fails - user can request resend later
    }
    
    const responseMessage = emailSent 
      ? 'Account created successfully! Please check your email to verify your account.'
      : 'Account created successfully! However, we couldn\'t send the verification email. You can request a new one later.'

    return addSecurityHeaders(NextResponse.json({
      message: responseMessage,
      user: { 
        id: user.id, 
        email: user.email, 
        name: user.name,
        emailVerified: false
      }
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
    
    console.error('Registration error:', error)
    return addSecurityHeaders(NextResponse.json(
      { error: 'An error occurred while creating your account. Please try again.' },
      { status: 500 }
    ))
  }
}