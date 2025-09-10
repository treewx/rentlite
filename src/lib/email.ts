import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransporter({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
})

export async function sendVerificationEmail(email: string, token: string) {
  const verificationUrl = `${process.env.NEXTAUTH_URL}/api/auth/verify?token=${token}`
  
  const mailOptions = {
    from: process.env.GMAIL_USER,
    to: email,
    subject: 'Verify your RentLite account',
    html: `
      <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 40px;">
          <h1 style="color: #1e293b; font-size: 28px; font-weight: 700; margin: 0;">RentLite</h1>
          <p style="color: #64748b; margin: 8px 0 0 0;">Simplified Rent Management</p>
        </div>
        
        <div style="background: #f8fafc; border-radius: 12px; padding: 32px; margin-bottom: 32px;">
          <h2 style="color: #1e293b; font-size: 20px; font-weight: 600; margin: 0 0 16px 0;">Verify Your Email Address</h2>
          <p style="color: #475569; line-height: 1.6; margin: 0 0 24px 0;">
            Thank you for signing up for RentLite. To complete your registration and start managing your properties, 
            please verify your email address by clicking the button below:
          </p>
          
          <div style="text-align: center;">
            <a href="${verificationUrl}" style="background: #475569; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 500; display: inline-block;">
              Verify Email Address
            </a>
          </div>
          
          <p style="color: #64748b; font-size: 14px; margin: 24px 0 0 0;">
            If the button doesn't work, copy and paste this link into your browser:<br>
            <a href="${verificationUrl}" style="color: #475569; word-break: break-all;">${verificationUrl}</a>
          </p>
        </div>
        
        <div style="text-align: center; color: #94a3b8; font-size: 14px;">
          <p>This verification link will expire in 24 hours.</p>
          <p>If you didn't create an account with RentLite, you can safely ignore this email.</p>
        </div>
      </div>
    `,
  }
  
  await transporter.sendMail(mailOptions)
}

export async function sendRentNotification(
  landlordEmail: string,
  tenantEmail: string | null,
  propertyAddress: string,
  tenantName: string,
  rentReceived: boolean,
  rentDueDate: Date,
  notifyTenant = false
) {
  const subject = rentReceived 
    ? `✅ Rent Received - ${propertyAddress}`
    : `❌ Rent NOT Received - ${propertyAddress}`
  
  const landlordMailOptions = {
    from: process.env.GMAIL_USER,
    to: landlordEmail,
    subject,
    html: `
      <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 40px;">
          <h1 style="color: #1e293b; font-size: 28px; font-weight: 700; margin: 0;">RentLite</h1>
          <p style="color: #64748b; margin: 8px 0 0 0;">Rent Payment Notification</p>
        </div>
        
        <div style="background: ${rentReceived ? '#ecfdf5' : '#fef2f2'}; border-radius: 12px; padding: 32px; margin-bottom: 32px; border-left: 4px solid ${rentReceived ? '#10b981' : '#ef4444'};">
          <h2 style="color: #1e293b; font-size: 20px; font-weight: 600; margin: 0 0 16px 0;">
            ${rentReceived ? '✅ Rent Received!' : '❌ Rent NOT Received'}
          </h2>
          
          <div style="color: #475569; line-height: 1.6;">
            <p><strong>Property:</strong> ${propertyAddress}</p>
            <p><strong>Tenant:</strong> ${tenantName}</p>
            <p><strong>Due Date:</strong> ${rentDueDate.toLocaleDateString()}</p>
            <p><strong>Status:</strong> ${rentReceived ? 'Payment received on time' : 'Payment not received'}</p>
          </div>
        </div>
        
        <div style="text-align: center; color: #94a3b8; font-size: 14px;">
          <p>This is an automated notification from RentLite.</p>
        </div>
      </div>
    `,
  }
  
  await transporter.sendMail(landlordMailOptions)
  
  if (!rentReceived && notifyTenant && tenantEmail) {
    const tenantMailOptions = {
      from: process.env.GMAIL_USER,
      to: tenantEmail,
      subject: `Rent Payment Reminder - ${propertyAddress}`,
      html: `
        <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 40px;">
            <h1 style="color: #1e293b; font-size: 28px; font-weight: 700; margin: 0;">RentLite</h1>
            <p style="color: #64748b; margin: 8px 0 0 0;">Rent Payment Reminder</p>
          </div>
          
          <div style="background: #fef2f2; border-radius: 12px; padding: 32px; margin-bottom: 32px; border-left: 4px solid #ef4444;">
            <h2 style="color: #1e293b; font-size: 20px; font-weight: 600; margin: 0 0 16px 0;">
              Rent Payment Reminder
            </h2>
            
            <div style="color: #475569; line-height: 1.6;">
              <p>Dear ${tenantName},</p>
              <p>This is a reminder that your rent payment for <strong>${propertyAddress}</strong> was due on ${rentDueDate.toLocaleDateString()} and has not yet been received.</p>
              <p>Please arrange payment as soon as possible to avoid any late fees or further action.</p>
              <p>If you have already made the payment, please disregard this notice.</p>
            </div>
          </div>
          
          <div style="text-align: center; color: #94a3b8; font-size: 14px;">
            <p>This is an automated reminder from your property manager via RentLite.</p>
          </div>
        </div>
      `,
    }
    
    await transporter.sendMail(tenantMailOptions)
  }
}