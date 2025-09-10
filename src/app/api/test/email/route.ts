import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

export async function GET(request: NextRequest) {
  try {
    // Basic environment check
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      return NextResponse.json({
        success: false,
        error: 'Email environment variables not configured',
        config: {
          GMAIL_USER: !!process.env.GMAIL_USER,
          GMAIL_APP_PASSWORD: !!process.env.GMAIL_APP_PASSWORD,
        }
      })
    }

    // Test SMTP connection
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
      connectionTimeout: 10000,
      socketTimeout: 10000,
    })

    // Verify connection
    const verified = await transporter.verify()
    
    return NextResponse.json({
      success: true,
      message: 'Email service is working',
      verified,
      config: {
        service: 'gmail',
        user: process.env.GMAIL_USER,
      }
    })

  } catch (error) {
    console.error('Email test error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}