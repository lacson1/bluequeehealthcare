import sgMail from '@sendgrid/mail';
import { logger } from '../lib/logger';

const emailLogger = logger.child('EmailService');

/**
 * Email Service for sending notifications to patients
 * Uses SendGrid for email delivery
 */
export class EmailService {
  private static initialized = false;

  /**
   * Initialize SendGrid with API key
   */
  static initialize() {
    if (this.initialized) return;

    const apiKey = process.env.SENDGRID_API_KEY;
    if (apiKey) {
      sgMail.setApiKey(apiKey);
      this.initialized = true;
      emailLogger.info('SendGrid email service initialized');
    } else {
      emailLogger.warn('SENDGRID_API_KEY not found. Email notifications will be logged only.');
    }
  }

  /**
   * Send email notification
   */
  static async sendEmail(params: {
    to: string;
    subject: string;
    html: string;
    text?: string;
    from?: string;
  }): Promise<{ success: boolean; messageId?: string; error?: string }> {
    this.initialize();

    const fromEmail = params.from || process.env.EMAIL_FROM || 'noreply@clinicconnect.com';

    // If SendGrid is not configured, log and return success (for development)
    if (!this.initialized) {
      emailLogger.warn('Email service not configured - email would be sent', { 
        to: params.to, 
        subject: params.subject, 
        from: fromEmail 
      });
      // Return success but indicate it's logged only
      return { 
        success: true, 
        messageId: 'logged-only',
        error: 'Email service not configured (SENDGRID_API_KEY missing)'
      };
    }

    try {
      const msg = {
        to: params.to,
        from: fromEmail,
        subject: params.subject,
        text: params.text || params.html.replace(/<[^>]*>/g, ''),
        html: params.html,
      };

      const [response] = await sgMail.send(msg);
      
      return {
        success: true,
        messageId: response.headers['x-message-id'] as string,
      };
    } catch (error: any) {
      emailLogger.error('Error sending email', { error: error?.message, to: params.to });
      return {
        success: false,
        error: error.message || 'Failed to send email',
      };
    }
  }

  /**
   * Send password reset email
   */
  static async sendPasswordResetEmail(params: {
    userEmail: string;
    userName: string;
    resetUrl: string;
    resetToken: string;
  }): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Reset Request</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0;">Password Reset Request</h1>
  </div>
  
  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
    <p>Dear ${params.userName},</p>
    
    <p>We received a request to reset your password for your ClinicConnect account.</p>
    
    <div style="background: #e8f4f8; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
      <p style="margin: 0 0 15px 0;"><strong>Click the button below to reset your password:</strong></p>
      <a href="${params.resetUrl}" style="display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset Password</a>
      <p style="margin: 15px 0 0 0; font-size: 12px; color: #666;">Or copy this link: ${params.resetUrl}</p>
    </div>
    
    <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
      <p style="margin: 0;"><strong>⚠️ Important:</strong></p>
      <ul style="margin: 10px 0; padding-left: 20px;">
        <li>This link will expire in 1 hour</li>
        <li>If you didn't request this, please ignore this email</li>
        <li>Your password will not change until you click the link above</li>
      </ul>
    </div>
    
    <p>If you're having trouble clicking the button, copy and paste the URL below into your web browser:</p>
    <p style="word-break: break-all; color: #667eea;">${params.resetUrl}</p>
    
    <p>Best regards,<br>
    <strong>ClinicConnect Team</strong></p>
  </div>
  
  <div style="text-align: center; margin-top: 20px; padding: 20px; color: #999; font-size: 12px;">
    <p>This is an automated email. Please do not reply to this message.</p>
    <p>If you didn't request a password reset, you can safely ignore this email.</p>
  </div>
</body>
</html>
    `;

    return this.sendEmail({
      to: params.userEmail,
      subject: 'Password Reset Request - ClinicConnect',
      html: html
    });
  }

  /**
   * Send telemedicine session notification
   */
  static async sendTelemedicineNotification(params: {
    patientEmail: string;
    patientName: string;
    doctorName: string;
    sessionType: 'video' | 'audio' | 'chat';
    scheduledTime: Date;
    sessionUrl?: string;
    clinicName?: string;
  }): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const formattedDate = params.scheduledTime.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const formattedTime = params.scheduledTime.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    const sessionTypeLabel = {
      video: 'Video Call',
      audio: 'Audio Call',
      chat: 'Text Chat',
    }[params.sessionType];

    const clinicName = params.clinicName || 'Your Healthcare Provider';

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Telemedicine Session Scheduled</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0;">Telemedicine Session Scheduled</h1>
  </div>
  
  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
    <p>Dear ${params.patientName},</p>
    
    <p>Your telemedicine consultation has been scheduled with <strong>${params.doctorName}</strong>.</p>
    
    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
      <h2 style="margin-top: 0; color: #667eea;">Session Details</h2>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; font-weight: bold; width: 40%;">Session Type:</td>
          <td style="padding: 8px 0;">${sessionTypeLabel}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: bold;">Date:</td>
          <td style="padding: 8px 0;">${formattedDate}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: bold;">Time:</td>
          <td style="padding: 8px 0;">${formattedTime}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: bold;">Provider:</td>
          <td style="padding: 8px 0;">${params.doctorName}</td>
        </tr>
      </table>
    </div>

    ${params.sessionUrl ? `
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 25px; border-radius: 8px; margin: 25px 0; text-align: center; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
      <p style="margin: 0 0 20px 0; color: white; font-size: 18px; font-weight: bold;">🔗 Join Your Session</p>
      <a href="${params.sessionUrl}" style="display: inline-block; background: white; color: #667eea; padding: 15px 40px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 16px; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">Click Here to Join Session</a>
      <p style="margin: 20px 0 0 0; font-size: 13px; color: rgba(255,255,255,0.9);">Or copy and paste this link into your browser:</p>
      <p style="margin: 10px 0 0 0; font-size: 12px; color: rgba(255,255,255,0.8); word-break: break-all; font-family: monospace; background: rgba(255,255,255,0.2); padding: 8px; border-radius: 4px;">${params.sessionUrl}</p>
    </div>
    ` : `
    <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
      <p style="margin: 0;"><strong>Note:</strong> Your session link will be provided closer to your appointment time.</p>
    </div>
    `}

    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3 style="margin-top: 0; color: #667eea;">What to Expect:</h3>
      <ul style="padding-left: 20px;">
        <li>Please be ready 5 minutes before your scheduled time</li>
        <li>Ensure you have a stable internet connection</li>
        ${params.sessionType === 'video' ? '<li>Test your camera and microphone beforehand</li>' : ''}
        <li>Find a quiet, private location for your consultation</li>
        <li>Have your ID and insurance card ready if needed</li>
      </ul>
    </div>

    <div style="background: #f0f0f0; padding: 15px; border-radius: 8px; margin: 20px 0; font-size: 14px;">
      <p style="margin: 0;"><strong>Need to reschedule?</strong> Please contact us at least 24 hours before your appointment.</p>
    </div>

    <p>We look forward to seeing you!</p>
    
    <p>Best regards,<br>
    <strong>${clinicName}</strong></p>
  </div>
  
  <div style="text-align: center; margin-top: 20px; padding: 20px; color: #999; font-size: 12px;">
    <p>This is an automated notification. Please do not reply to this email.</p>
  </div>
</body>
</html>
    `;

    return this.sendEmail({
      to: params.patientEmail,
      subject: `Telemedicine Session Scheduled - ${formattedDate} at ${formattedTime}`,
      html,
    });
  }

  /**
   * Send SMS notification (placeholder - would need Twilio or similar)
   */
  static async sendSMS(params: {
    to: string;
    message: string;
  }): Promise<{ success: boolean; messageId?: string; error?: string }> {
    // For now, just log SMS notifications
    // In production, integrate with Twilio, AWS SNS, or similar service
    emailLogger.debug('SMS would be sent', { to: params.to, messageLength: params.message.length });
    
    return {
      success: true,
      messageId: 'logged-only',
    };
  }

  /**
   * Send WhatsApp notification
   * Supports multiple providers:
   * 1. Green API (FREE) - Recommended for free tier
   * 2. Twilio WhatsApp API - Paid service
   * 3. Falls back to logging if no provider configured
   */
  static async sendWhatsApp(params: {
    to: string;
    message: string;
  }): Promise<{ success: boolean; messageId?: string; error?: string }> {
    // Check for Green API (FREE) first
    const greenApiId = process.env.GREEN_API_ID;
    const greenApiToken = process.env.GREEN_API_TOKEN;
    
    // Check for Twilio (paid) as fallback
    const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
    const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioWhatsAppFrom = process.env.TWILIO_WHATSAPP_FROM;

    // Try Green API first (FREE)
    if (greenApiId && greenApiToken) {
      return this.sendWhatsAppViaGreenAPI(params, greenApiId, greenApiToken);
    }

    // Fallback to Twilio if configured
    if (twilioAccountSid && twilioAuthToken) {
      return this.sendWhatsAppViaTwilio(params, twilioAccountSid, twilioAuthToken, twilioWhatsAppFrom);
    }

    // No provider configured - log only (for development)
    emailLogger.debug('WhatsApp would be sent (no provider configured)', { 
      to: params.to, 
      messageLength: params.message.length,
      suggestion: 'Configure GREEN_API_ID and GREEN_API_TOKEN for free WhatsApp messaging'
    });
    return { success: true, messageId: 'logged-only' };
  }

  /**
   * Send WhatsApp via Green API (FREE)
   * Green API provides free WhatsApp messaging via WhatsApp Web protocol
   * Free tier: 100 messages/day
   * Sign up at: https://green-api.com
   */
  private static async sendWhatsAppViaGreenAPI(
    params: { to: string; message: string },
    apiId: string,
    apiToken: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      // Format phone number for Green API (just needs country code, no whatsapp: prefix)
      let phoneNumber = params.to.trim();
      
      // Remove whatsapp: prefix if present
      if (phoneNumber.startsWith('whatsapp:')) {
        phoneNumber = phoneNumber.replace('whatsapp:', '');
      }
      
      // Ensure phone number starts with + (country code)
      if (!phoneNumber.startsWith('+')) {
        phoneNumber = '+' + phoneNumber.replace(/^0+/, '').replace(/\D/g, '');
      } else {
        // Remove any non-digit characters except +
        phoneNumber = '+' + phoneNumber.substring(1).replace(/\D/g, '');
      }

      // Green API endpoint
      const apiUrl = `https://api.green-api.com/waInstance${apiId}/sendMessage/${apiToken}`;
      
      emailLogger.debug('Sending WhatsApp via Green API', {
        to: phoneNumber,
        messageLength: params.message.length
      });

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chatId: `${phoneNumber}@c.us`, // Green API format
          message: params.message,
        }),
      });

      const data = await response.json();

      if (response.ok && data.idMessage) {
        emailLogger.info('WhatsApp sent via Green API', {
          messageId: data.idMessage,
          to: phoneNumber
        });
        
        return {
          success: true,
          messageId: data.idMessage,
        };
      } else {
        const errorMessage = data.error || data.message || 'Failed to send WhatsApp message via Green API';
        const errorCode = data.errorCode || 'UNKNOWN_ERROR';
        
        emailLogger.error('Green API Error', {
          status: response.status,
          code: errorCode,
          message: errorMessage,
          details: data
        });
        
        return {
          success: false,
          error: `${errorMessage} (Code: ${errorCode})`,
        };
      }
    } catch (error: any) {
      emailLogger.error('Error sending WhatsApp via Green API', {
        error: error?.message,
        to: params.to
      });
      
      let errorMessage = 'Failed to send WhatsApp message via Green API';
      if (error.message) {
        errorMessage = error.message;
      }
      
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Send WhatsApp via Twilio (PAID)
   * Original Twilio implementation
   */
  private static async sendWhatsAppViaTwilio(
    params: { to: string; message: string },
    accountSid: string,
    authToken: string,
    whatsAppFrom?: string
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      // Format phone number for WhatsApp (ensure it starts with whatsapp: and includes +)
      let formattedTo = params.to.trim();
      
      // Remove whatsapp: prefix if present to normalize
      if (formattedTo.startsWith('whatsapp:')) {
        formattedTo = formattedTo.replace('whatsapp:', '');
      }
      
      // Ensure phone number starts with + (country code)
      if (!formattedTo.startsWith('+')) {
        formattedTo = '+' + formattedTo.replace(/^0+/, ''); // Remove leading zeros
      }
      
      // Add whatsapp: prefix
      formattedTo = `whatsapp:${formattedTo}`;

      const fromNumber = whatsAppFrom || 'whatsapp:+14155238886'; // Twilio sandbox number
      
      emailLogger.debug('Sending WhatsApp via Twilio', { 
        to: formattedTo, 
        from: fromNumber
      });

      // Use Twilio SDK if available, otherwise use REST API
      try {
        const twilio = await import('twilio');
        const client = twilio.default(accountSid, authToken);

        const message = await client.messages.create({
          from: fromNumber,
          to: formattedTo,
          body: params.message,
        });

        return {
          success: true,
          messageId: message.sid,
        };
      } catch (importError: any) {
        // Twilio SDK not installed, use REST API
        emailLogger.debug('Twilio SDK not available, using REST API');
        
        if (importError.code !== 'MODULE_NOT_FOUND') {
          throw importError;
        }
        
        const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
        const response = await fetch(
          `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Basic ${auth}`,
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
              From: fromNumber,
              To: formattedTo,
              Body: params.message,
            }),
          }
        );

        const data = await response.json();

        if (response.ok) {
          return {
            success: true,
            messageId: data.sid,
          };
        } else {
          const errorMessage = data.message || data.error || 'Failed to send WhatsApp message';
          const errorCode = data.code || 'UNKNOWN_ERROR';
          
          emailLogger.error('Twilio API Error', {
            status: response.status,
            code: errorCode,
            message: errorMessage,
            details: data
          });
          
          return {
            success: false,
            error: `${errorMessage} (Code: ${errorCode})`,
          };
        }
      }
    } catch (error: any) {
      emailLogger.error('Error sending WhatsApp via Twilio', { error: error?.message, to: params.to });
      
      let errorMessage = 'Failed to send WhatsApp message';
      
      if (error.message) {
        errorMessage = error.message;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      // Add helpful context for common issues
      if (errorMessage.includes('not found') || errorMessage.includes('invalid')) {
        errorMessage += '. Please check that the phone number is correct and includes country code (e.g., +1234567890)';
      } else if (errorMessage.includes('unauthorized') || errorMessage.includes('authentication')) {
        errorMessage += '. Please check your Twilio credentials (TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN)';
      } else if (errorMessage.includes('sandbox')) {
        errorMessage += '. For Twilio sandbox, the recipient must first join the sandbox by sending the join code to the Twilio WhatsApp number';
      }
      
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Send referral notification email
   */
  static async sendReferralNotification(params: {
    recipientEmail: string;
    recipientName?: string;
    patientName: string;
    patientDOB?: string;
    patientMRN?: string;
    specialty: string;
    reason: string;
    urgency: string;
    referringDoctorName: string;
    referringFacility?: string;
    appointmentDate?: string;
    notes?: string;
    clinicName?: string;
    clinicPhone?: string;
    clinicEmail?: string;
  }): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const clinicName = params.clinicName || 'ClinicConnect';
    const urgencyColors: Record<string, string> = {
      'urgent': '#dc2626',
      'routine': '#16a34a',
      'non-urgent': '#2563eb',
    };
    const urgencyColor = urgencyColors[params.urgency.toLowerCase()] || '#6b7280';
    const urgencyLabel = params.urgency.charAt(0).toUpperCase() + params.urgency.slice(1);

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Patient Referral</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 650px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
  <div style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Patient Referral</h1>
    <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 14px;">From ${clinicName}</p>
  </div>
  
  <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    ${params.recipientName ? `<p style="margin-bottom: 20px;">Dear ${params.recipientName},</p>` : ''}
    
    <p>We are referring the following patient to your care for <strong>${params.specialty}</strong> consultation.</p>
    
    <!-- Urgency Badge -->
    <div style="margin: 20px 0;">
      <span style="background: ${urgencyColor}; color: white; padding: 6px 16px; border-radius: 20px; font-size: 14px; font-weight: bold;">
        ${urgencyLabel} Referral
      </span>
    </div>

    <!-- Patient Information -->
    <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6;">
      <h2 style="margin: 0 0 15px 0; color: #1e40af; font-size: 18px;">Patient Information</h2>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; font-weight: bold; width: 35%; color: #64748b;">Name:</td>
          <td style="padding: 8px 0; font-weight: bold; color: #1e293b;">${params.patientName}</td>
        </tr>
        ${params.patientDOB ? `
        <tr>
          <td style="padding: 8px 0; font-weight: bold; color: #64748b;">Date of Birth:</td>
          <td style="padding: 8px 0; color: #1e293b;">${params.patientDOB}</td>
        </tr>
        ` : ''}
        ${params.patientMRN ? `
        <tr>
          <td style="padding: 8px 0; font-weight: bold; color: #64748b;">MRN:</td>
          <td style="padding: 8px 0; color: #1e293b;">${params.patientMRN}</td>
        </tr>
        ` : ''}
      </table>
    </div>

    <!-- Referral Details -->
    <div style="background: #fffbeb; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
      <h2 style="margin: 0 0 15px 0; color: #92400e; font-size: 18px;">Referral Details</h2>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; font-weight: bold; width: 35%; color: #78716c;">Specialty:</td>
          <td style="padding: 8px 0; color: #1e293b;">${params.specialty}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-weight: bold; color: #78716c;">Referring Doctor:</td>
          <td style="padding: 8px 0; color: #1e293b;">${params.referringDoctorName}</td>
        </tr>
        ${params.referringFacility ? `
        <tr>
          <td style="padding: 8px 0; font-weight: bold; color: #78716c;">Referring Facility:</td>
          <td style="padding: 8px 0; color: #1e293b;">${params.referringFacility}</td>
        </tr>
        ` : ''}
        ${params.appointmentDate ? `
        <tr>
          <td style="padding: 8px 0; font-weight: bold; color: #78716c;">Requested Date:</td>
          <td style="padding: 8px 0; color: #1e293b;">${params.appointmentDate}</td>
        </tr>
        ` : ''}
      </table>
    </div>

    <!-- Reason for Referral -->
    <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #22c55e;">
      <h2 style="margin: 0 0 15px 0; color: #166534; font-size: 18px;">Reason for Referral</h2>
      <p style="margin: 0; color: #1e293b; white-space: pre-wrap;">${params.reason}</p>
    </div>

    ${params.notes ? `
    <!-- Additional Notes -->
    <div style="background: #faf5ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #a855f7;">
      <h2 style="margin: 0 0 15px 0; color: #7e22ce; font-size: 18px;">Additional Notes</h2>
      <p style="margin: 0; color: #1e293b; white-space: pre-wrap;">${params.notes}</p>
    </div>
    ` : ''}

    <!-- Contact Information -->
    <div style="background: #f1f5f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3 style="margin: 0 0 10px 0; color: #475569; font-size: 16px;">For Questions or Updates</h3>
      <p style="margin: 0; color: #64748b; font-size: 14px;">
        Please contact ${clinicName}
        ${params.clinicPhone ? `<br>📞 ${params.clinicPhone}` : ''}
        ${params.clinicEmail ? `<br>📧 ${params.clinicEmail}` : ''}
      </p>
    </div>

    <p style="margin-top: 25px;">Thank you for your attention to this referral.</p>
    
    <p>Best regards,<br>
    <strong>${params.referringDoctorName}</strong><br>
    <span style="color: #64748b;">${clinicName}</span></p>
  </div>
  
  <div style="text-align: center; margin-top: 20px; padding: 20px; color: #999; font-size: 12px;">
    <p>This referral was sent via ClinicConnect Healthcare Management System.</p>
    <p style="margin-top: 5px;">This email contains confidential patient information. Please handle accordingly.</p>
  </div>
</body>
</html>
    `;

    const subject = `${urgencyLabel} Referral: ${params.patientName} - ${params.specialty}`;

    return this.sendEmail({
      to: params.recipientEmail,
      subject,
      html,
    });
  }

  /**
   * Send telemedicine session notification via WhatsApp
   */
  static async sendTelemedicineWhatsApp(params: {
    patientPhone: string;
    patientName: string;
    doctorName: string;
    sessionType: 'video' | 'audio' | 'chat';
    scheduledTime: Date;
    sessionUrl?: string;
    clinicName?: string;
  }): Promise<{ success: boolean; messageId?: string; error?: string }> {
    const formattedDate = params.scheduledTime.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const formattedTime = params.scheduledTime.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    const sessionTypeLabel = {
      video: 'Video Call',
      audio: 'Audio Call',
      chat: 'Text Chat',
    }[params.sessionType];

    const clinicName = params.clinicName || 'Your Healthcare Provider';

    let message = `🏥 *Telemedicine Session Scheduled*\n\n`;
    message += `Dear ${params.patientName},\n\n`;
    message += `Your telemedicine consultation has been scheduled with *${params.doctorName}*.\n\n`;
    message += `*Session Details:*\n`;
    message += `📅 Date: ${formattedDate}\n`;
    message += `⏰ Time: ${formattedTime}\n`;
    message += `📞 Type: ${sessionTypeLabel}\n`;
    message += `👨‍⚕️ Provider: ${params.doctorName}\n\n`;

    if (params.sessionUrl) {
      message += `🔗 *Join Your Session Now:*\n${params.sessionUrl}\n\n`;
      message += `Click the link above to join your ${sessionTypeLabel.toLowerCase()} session.\n\n`;
    } else {
      message += `ℹ️ Your session link will be provided closer to your appointment time.\n\n`;
    }

    message += `*What to Expect:*\n`;
    message += `• Please be ready 5 minutes before your scheduled time\n`;
    message += `• Ensure you have a stable internet connection\n`;
    if (params.sessionType === 'video') {
      message += `• Test your camera and microphone beforehand\n`;
    }
    message += `• Find a quiet, private location for your consultation\n`;
    message += `• Have your ID and insurance card ready if needed\n\n`;

    message += `Need to reschedule? Please contact us at least 24 hours before your appointment.\n\n`;
    message += `Best regards,\n${clinicName}`;

    return this.sendWhatsApp({
      to: params.patientPhone,
      message,
    });
  }
}

// Initialize on module load
EmailService.initialize();

