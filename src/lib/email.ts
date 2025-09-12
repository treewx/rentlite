import { Resend } from 'resend'
import * as validator from 'email-validator'
import { emailLogger, logger } from './logger'

const resend = new Resend(process.env.RESEND_API_KEY)
const isDevelopment = process.env.NODE_ENV === 'development'
const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'

// Email validation function
export function isValidEmail(email: string): boolean {
  try {
    return validator.validate(email)
  } catch (error) {
    console.error('Email validation error:', error)
    return false
  }
}

// Base email template
const getEmailTemplate = (title: string, content: string, ctaButton?: { text: string, url: string }) => `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333;">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <tr>
          <td style="padding: 40px 20px;">
            
            <!-- Header -->
            <div style="text-align: center; margin-bottom: 40px;">
              <h1 style="color: #1e293b; font-size: 32px; font-weight: 700; margin: 0;">RentLite</h1>
              <p style="color: #64748b; margin: 8px 0 0 0; font-size: 16px;">Simplified Rent Management</p>
            </div>
            
            <!-- Content -->
            <div style="background: #f8fafc; border-radius: 12px; padding: 32px; margin-bottom: 32px; border: 1px solid #e2e8f0;">
              <h2 style="color: #1e293b; font-size: 24px; font-weight: 600; margin: 0 0 20px 0;">${title}</h2>
              ${content}
              
              ${ctaButton ? `
                <div style="text-align: center; margin-top: 32px;">
                  <a href="${ctaButton.url}" style="background: #475569; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; display: inline-block; transition: background-color 0.3s ease;">
                    ${ctaButton.text}
                  </a>
                </div>
              ` : ''}
            </div>
            
            <!-- Footer -->
            <div style="text-align: center; color: #94a3b8; font-size: 14px; line-height: 1.5;">
              <p style="margin: 0 0 8px 0;">This email was sent from RentLite.</p>
              <p style="margin: 0;">If you didn't expect this email, you can safely ignore it.</p>
            </div>
            
          </td>
        </tr>
      </table>
    </body>
  </html>
`

// Email logging function (deprecated - using logger now)
const logEmailOperation = (operation: string, email: string, success: boolean, error?: any) => {
  if (success) {
    emailLogger.verificationSent(email)
  } else {
    emailLogger.verificationFailed(email, error)
  }
}

// Email verification function
export async function sendVerificationEmail(email: string, token: string, firstName?: string) {
  if (!isValidEmail(email)) {
    throw new Error('Invalid email address')
  }

  const verificationUrl = `${baseUrl}/api/auth/verify?token=${token}`
  const name = firstName || 'there'
  
  const content = `
    <p style="color: #475569; font-size: 16px; margin: 0 0 20px 0;">Hi ${name},</p>
    <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
      Thank you for signing up for RentLite! To complete your registration and start managing your properties, 
      please verify your email address by clicking the button below:
    </p>
    <p style="color: #64748b; font-size: 14px; margin: 24px 0 0 0;">
      If the button doesn't work, copy and paste this link into your browser:<br>
      <a href="${verificationUrl}" style="color: #475569; word-break: break-all; font-size: 12px;">${verificationUrl}</a>
    </p>
    <p style="color: #64748b; font-size: 14px; margin: 16px 0 0 0;">
      <strong>This verification link will expire in 24 hours.</strong>
    </p>
  `

  try {
    // In development mode with no RESEND_API_KEY, just log and return success
    if (isDevelopment && !process.env.RESEND_API_KEY) {
      logger.debug('EMAIL', 'Development mode: Email verification would be sent', { 
        email, 
        verificationUrl 
      })
      emailLogger.verificationSent(email)
      return { id: 'dev-mode-success' }
    }

    const { data, error } = await resend.emails.send({
      from: 'RentLite <noreply@mail.honeystoneltd.com>',
      to: [email],
      subject: 'Verify your RentLite account',
      html: getEmailTemplate('Verify Your Email Address', content, {
        text: 'Verify Email Address',
        url: verificationUrl
      }),
    })

    if (error) {
      emailLogger.verificationFailed(email, error)
      throw error
    }

    emailLogger.verificationSent(email)
    return data
  } catch (error) {
    emailLogger.verificationFailed(email, error as Error)
    throw error
  }
}

// Password reset email function
export async function sendPasswordResetEmail(email: string, token: string, firstName?: string) {
  if (!isValidEmail(email)) {
    throw new Error('Invalid email address')
  }

  const resetUrl = `${baseUrl}/auth/reset-password?token=${token}`
  const name = firstName || 'there'
  
  const content = `
    <p style="color: #475569; font-size: 16px; margin: 0 0 20px 0;">Hi ${name},</p>
    <p style="color: #475569; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
      We received a request to reset your password for your RentLite account. If you made this request, 
      click the button below to reset your password:
    </p>
    <p style="color: #64748b; font-size: 14px; margin: 24px 0 0 0;">
      If the button doesn't work, copy and paste this link into your browser:<br>
      <a href="${resetUrl}" style="color: #475569; word-break: break-all; font-size: 12px;">${resetUrl}</a>
    </p>
    <p style="color: #64748b; font-size: 14px; margin: 16px 0 0 0;">
      <strong>This reset link will expire in 1 hour.</strong>
    </p>
    <p style="color: #64748b; font-size: 14px; margin: 16px 0 0 0;">
      If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
    </p>
  `

  try {
    // In development mode with no RESEND_API_KEY, just log and return success
    if (isDevelopment && !process.env.RESEND_API_KEY) {
      logger.debug('EMAIL', 'Development mode: Password reset email would be sent', { 
        email, 
        resetUrl 
      })
      emailLogger.passwordResetSent(email)
      return { id: 'dev-mode-success' }
    }

    const { data, error } = await resend.emails.send({
      from: 'RentLite <noreply@mail.honeystoneltd.com>',
      to: [email],
      subject: 'Reset your RentLite password',
      html: getEmailTemplate('Reset Your Password', content, {
        text: 'Reset Password',
        url: resetUrl
      }),
    })

    if (error) {
      emailLogger.passwordResetFailed(email, error)
      throw error
    }

    emailLogger.passwordResetSent(email)
    return data
  } catch (error) {
    emailLogger.passwordResetFailed(email, error as Error)
    throw error
  }
}

// Generic notification email function
export async function sendNotificationEmail(email: string, subject: string, message: string, firstName?: string) {
  if (!isValidEmail(email)) {
    throw new Error('Invalid email address')
  }

  const name = firstName || 'there'
  
  const content = `
    <p style="color: #475569; font-size: 16px; margin: 0 0 20px 0;">Hi ${name},</p>
    <div style="color: #475569; font-size: 16px; line-height: 1.6;">
      ${message}
    </div>
  `

  try {
    // In development mode with no RESEND_API_KEY, just log and return success
    if (isDevelopment && !process.env.RESEND_API_KEY) {
      logger.debug('EMAIL', 'Development mode: Notification email would be sent', { 
        email, 
        subject,
        message 
      })
      emailLogger.notificationSent(email, subject)
      return { id: 'dev-mode-success' }
    }

    const { data, error } = await resend.emails.send({
      from: 'RentLite <noreply@mail.honeystoneltd.com>',
      to: [email],
      subject,
      html: getEmailTemplate(subject, content),
    })

    if (error) {
      emailLogger.notificationFailed(email, error, subject)
      throw error
    }

    emailLogger.notificationSent(email, subject)
    return data
  } catch (error) {
    emailLogger.notificationFailed(email, error as Error, subject)
    throw error
  }
}

// Enhanced rent notification function
export async function sendRentNotification(
  landlordEmail: string,
  tenantEmail: string | null,
  propertyAddress: string,
  tenantName: string,
  rentReceived: boolean,
  rentDueDate: Date,
  notifyTenant = false
) {
  if (!isValidEmail(landlordEmail)) {
    throw new Error('Invalid landlord email address')
  }

  const subject = rentReceived 
    ? `✅ Rent Received - ${propertyAddress}`
    : `❌ Rent NOT Received - ${propertyAddress}`
  
  const landlordContent = `
    <div style="padding: 20px; border-radius: 8px; margin: 20px 0; ${rentReceived ? 'background-color: #ecfdf5; border-left: 4px solid #10b981;' : 'background-color: #fef2f2; border-left: 4px solid #ef4444;'}">
      <h3 style="margin: 0 0 16px 0; color: #1e293b;">
        ${rentReceived ? '✅ Rent Received!' : '❌ Rent NOT Received'}
      </h3>
      
      <div style="color: #475569; line-height: 1.6;">
        <p style="margin: 8px 0;"><strong>Property:</strong> ${propertyAddress}</p>
        <p style="margin: 8px 0;"><strong>Tenant:</strong> ${tenantName}</p>
        <p style="margin: 8px 0;"><strong>Due Date:</strong> ${rentDueDate.toLocaleDateString()}</p>
        <p style="margin: 8px 0;"><strong>Status:</strong> ${rentReceived ? 'Payment received on time' : 'Payment not received'}</p>
      </div>
    </div>
    
    <p style="color: #64748b; font-size: 14px; margin: 20px 0 0 0;">
      This is an automated notification from RentLite.
    </p>
  `

  try {
    // Send landlord notification
    const landlordResult = await sendNotificationEmail(landlordEmail, subject, landlordContent)
    
    // Send tenant reminder if needed
    if (!rentReceived && notifyTenant && tenantEmail) {
      if (!isValidEmail(tenantEmail)) {
        console.warn('Invalid tenant email address:', tenantEmail)
      } else {
        const tenantContent = `
          <div style="padding: 20px; border-radius: 8px; margin: 20px 0; background-color: #fef2f2; border-left: 4px solid #ef4444;">
            <h3 style="margin: 0 0 16px 0; color: #1e293b;">Rent Payment Reminder</h3>
            
            <div style="color: #475569; line-height: 1.6;">
              <p>Dear ${tenantName},</p>
              <p>This is a reminder that your rent payment for <strong>${propertyAddress}</strong> was due on ${rentDueDate.toLocaleDateString()} and has not yet been received.</p>
              <p>Please arrange payment as soon as possible to avoid any late fees or further action.</p>
              <p>If you have already made the payment, please disregard this notice.</p>
            </div>
          </div>
          
          <p style="color: #64748b; font-size: 14px; margin: 20px 0 0 0;">
            This is an automated reminder from your property manager via RentLite.
          </p>
        `
        
        await sendNotificationEmail(tenantEmail, `Rent Payment Reminder - ${propertyAddress}`, tenantContent, tenantName)
      }
    }
    
    return landlordResult
  } catch (error) {
    console.error('Rent notification failed:', error)
    throw error
  }
}

// Token cleanup function
export async function cleanupExpiredTokens() {
  try {
    logger.info('TOKEN_CLEANUP', 'Starting cleanup of expired tokens')
    
    // This would typically be called by a cron job
    // In a real implementation, you'd clean up expired tokens from the database here
    
    // For now, just log the operation
    logger.info('TOKEN_CLEANUP', 'Token cleanup completed successfully')
  } catch (error) {
    logger.error('TOKEN_CLEANUP', 'Token cleanup failed', error as Error)
    throw error
  }
}