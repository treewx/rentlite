import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { sendVerificationEmail } from '@/lib/email'

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, password } = registerSchema.parse(body)
    
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })
    
    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 400 }
      )
    }
    
    const hashedPassword = await bcrypt.hash(password, 12)
    
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      }
    })
    
    const verificationToken = await prisma.verificationToken.create({
      data: {
        identifier: email,
        token: crypto.randomUUID(),
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      }
    })
    
    await sendVerificationEmail(email, verificationToken.token)
    
    return NextResponse.json({
      message: 'User created successfully. Please check your email to verify your account.',
      user: { id: user.id, email: user.email, name: user.name }
    })
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      )
    }
    
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}