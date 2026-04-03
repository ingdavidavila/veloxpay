
// utils/mailService.js
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// ==================== PASSWORD RESET ====================
const sendPasswordResetEmail = async (toEmail, resetToken) => {
  try {
    const resetLink = `${FRONTEND_URL}/reset-password?token=${resetToken}`;

    const { data, error } = await resend.emails.send({
      from: 'Velox Pay <no-reply@veloxpay.com>',     // Change to your verified domain
      to: toEmail,
      subject: 'Reset Your Velox Pay Password',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2>Reset Your Password</h2>
          <p>Hello,</p>
          <p>You requested to reset your password for Velox Pay.</p>
          
          <a href="${resetLink}" 
             style="display: inline-block; padding: 14px 28px; background-color: #22c55e; color: white; 
                    text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0;">
            Reset Password
          </a>
          
          <p><strong>This link expires in 1 hour.</strong></p>
          <p>If you didn't request this, please ignore this email.</p>
          <hr style="margin: 30px 0 20px;">
          <p style="color: #666; font-size: 14px;">Best regards,<br>The Velox Pay Team</p>
        </div>
      `,
    });

    if (error) {
      console.error('Resend Error:', error);
      return false;
    }

    console.log(`✅ Password reset email sent to: ${toEmail}`);
    return true;

  } catch (err) {
    console.error('Failed to send password reset email:', err.message);
    return false;
  }
};

const sendPasswordResetConfirmation = async (toEmail) => {
  try {
    const { data, error } = await resend.emails.send({
      from: 'Velox Pay <no-reply@veloxpay.com>',
      to: toEmail,
      subject: 'Your Velox Pay Password Has Been Reset',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Password Reset Successful ✅</h2>
          <p>Your password has been successfully reset.</p>
          <p>If you did not make this change, please contact support immediately.</p>
          <p>Best regards,<br>The Velox Pay Team</p>
        </div>
      `,
    });

    if (error) {
      console.error('Resend confirmation error:', error);
      return false;
    }

    console.log(`✅ Confirmation email sent to: ${toEmail}`);
    return true;

  } catch (err) {
    console.error('Failed to send confirmation email:', err.message);
    return false;
  }
};

// ==================== INVOICE REMINDER ====================
const sendInvoiceReminder = async (invoice) => {
  try {
    const daysUntilDue = Math.ceil((new Date(invoice.due_date) - new Date()) / (1000 * 3600 * 24));

    const subject = daysUntilDue <= 0 
      ? `Velox Pay - Invoice ${invoice.invoice_number} is Due Today`
      : `Velox Pay - Invoice ${invoice.invoice_number} Due in ${daysUntilDue} Days`;

    const { data, error } = await resend.emails.send({
      from: 'Velox Pay <no-reply@veloxpay.com>',
      to: invoice.client_email,
      subject: subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2>Payment Reminder</h2>
          <p>Dear ${invoice.client_name},</p>
          <p>This is a friendly reminder from <strong>Velox Pay</strong>.</p>
          
          <p>Invoice <strong>${invoice.invoice_number}</strong> for 
          <strong>$${parseFloat(invoice.total_amount).toLocaleString()}</strong> 
          is due ${daysUntilDue <= 0 ? 'today' : `in ${daysUntilDue} days`}.</p>
          
          <p><strong>Supplier:</strong> ${invoice.supplier_business}</p>
          ${invoice.description ? `<p><strong>Description:</strong> ${invoice.description}</p>` : ''}
          
          <p>Please make the payment at your earliest convenience.</p>
          <p>Thank you,<br>Velox Pay Team</p>
        </div>
      `,
    });

    if (error) {
      console.error('Resend reminder error:', error);
      return false;
    }

    console.log(`✅ Invoice reminder sent for ${invoice.invoice_number} to ${invoice.client_email}`);
    return true;

  } catch (err) {
    console.error('Failed to send invoice reminder:', err.message);
    return false;
  }
};

module.exports = {
  sendPasswordResetEmail,
  sendPasswordResetConfirmation,
  sendInvoiceReminder
};