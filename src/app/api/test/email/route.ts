import { NextResponse } from 'next/server'
import { 
  sendRentNotification, 
  sendVerificationEmail, 
  sendPasswordResetEmail, 
  sendNotificationEmail,
  isValidEmail 
} from '@/lib/email'
import { logger } from '@/lib/logger'
import crypto from 'crypto'

export async function GET() {
  try {
    const testEmail = 'test@example.com'
    const testResults = []
    
    logger.info('EMAIL_TEST', 'Starting comprehensive email system test')
    
    // Test 1: Email validation
    try {
      const validEmails = ['test@example.com', 'user+tag@domain.co.uk']
      const invalidEmails = ['invalid', 'test@', '@domain.com', '']
      
      const validationResults = {
        valid: validEmails.map(email => ({ email, valid: isValidEmail(email) })),
        invalid: invalidEmails.map(email => ({ email, valid: isValidEmail(email) })),
      }
      
      testResults.push({
        test: 'Email Validation',
        status: 'passed',
        results: validationResults
      })
    } catch (error) {
      testResults.push({
        test: 'Email Validation',
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }

    // Test 2: Verification email
    try {
      const token = crypto.randomBytes(32).toString('hex')
      await sendVerificationEmail(testEmail, token, 'Test User')
      testResults.push({
        test: 'Verification Email',
        status: 'passed',
        message: 'Verification email sent successfully'
      })
    } catch (error) {
      testResults.push({
        test: 'Verification Email',
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }

    // Test 3: Password reset email
    try {
      const token = crypto.randomBytes(32).toString('hex')
      await sendPasswordResetEmail(testEmail, token, 'Test User')
      testResults.push({
        test: 'Password Reset Email',
        status: 'passed',
        message: 'Password reset email sent successfully'
      })
    } catch (error) {
      testResults.push({
        test: 'Password Reset Email',
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }

    // Test 4: Generic notification email
    try {
      await sendNotificationEmail(
        testEmail,
        'Test Notification',
        '<p>This is a test notification email with <strong>HTML content</strong>.</p>',
        'Test User'
      )
      testResults.push({
        test: 'Notification Email',
        status: 'passed',
        message: 'Notification email sent successfully'
      })
    } catch (error) {
      testResults.push({
        test: 'Notification Email',
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }

    // Test 5: Rent notification (existing test)
    try {
      await sendRentNotification(
        'landlord@example.com',
        'tenant@example.com',
        '123 Test Street',
        'John Doe',
        false, // rent not received
        new Date('2024-01-01'),
        true // notify tenant
      )
      testResults.push({
        test: 'Rent Notification',
        status: 'passed',
        message: 'Rent notification sent successfully'
      })
    } catch (error) {
      testResults.push({
        test: 'Rent Notification',
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    }

    // Calculate overall status
    const passed = testResults.filter(t => t.status === 'passed').length
    const failed = testResults.filter(t => t.status === 'failed').length
    const total = testResults.length

    const summary = {
      total,
      passed,
      failed,
      success_rate: `${Math.round((passed / total) * 100)}%`
    }

    logger.info('EMAIL_TEST', 'Email system test completed', { summary, results: testResults })
    
    return NextResponse.json({ 
      message: 'Email system test completed',
      summary,
      results: testResults,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      has_resend_key: !!process.env.RESEND_API_KEY
    })
    
  } catch (error) {
    logger.error('EMAIL_TEST', 'Email system test failed', error as Error)
    return NextResponse.json(
      { 
        error: 'Email system test failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}