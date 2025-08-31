// API endpoint to send OTP via email
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and OTP are required' });
    }

    // Using a simple email service (you can replace with your preferred service)
    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #7C3AED 0%, #F97316 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="margin: 0; font-size: 24px;">Yuvapreneur</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Password Reset Code</p>
        </div>
        
        <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #333; margin-bottom: 20px;">Your Password Reset Code</h2>
          
          <div style="background: white; border: 2px solid #7C3AED; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
            <h3 style="color: #7C3AED; font-size: 32px; margin: 0; letter-spacing: 5px;">${otp}</h3>
            <p style="color: #666; margin: 10px 0 0 0; font-size: 14px;">Enter this code in the password reset form</p>
          </div>
          
          <p style="color: #666; line-height: 1.6;">
            This code will expire in 10 minutes. If you didn't request this password reset, 
            please ignore this email.
          </p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
            <p style="color: #999; font-size: 12px; margin: 0;">
              This email was sent from Yuvapreneur Course Platform.<br>
              If you need help, contact support@learnabhi.com
            </p>
          </div>
        </div>
      </div>
    `;

    // For now, we'll use a simple approach with a free email service
    // You can integrate with services like SendGrid, Mailgun, or AWS SES
    
    // Option 1: Using EmailJS (client-side, but more reliable than alert)
    // Option 2: Using a serverless email service
    
    // For demonstration, we'll return success and log the email details
    console.log('Email would be sent to:', email);
    console.log('OTP:', otp);
    console.log('Email content:', emailContent);

    // In production, you would send the actual email here
    // Example with a service like SendGrid:
    /*
    const sgMail = require('@sendgrid/mail');
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    
    const msg = {
      to: email,
      from: 'noreply@yuvapreneur.in',
      subject: 'Your Password Reset Code - Yuvapreneur',
      html: emailContent,
    };
    
    await sgMail.send(msg);
    */

    res.status(200).json({ 
      success: true, 
      message: 'OTP sent successfully',
      email: email,
      otp: otp // Remove this in production
    });

  } catch (error) {
    console.error('Error sending OTP:', error);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
}
