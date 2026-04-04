const fetch = require('node-fetch');
global.fetch = fetch;
global.Headers = fetch.Headers;
global.Request = fetch.Request;
global.Response = fetch.Response;

const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// ==================== PASSWORD RESET ====================
const sendPasswordResetEmail = async (toEmail, resetToken) => {
  try {
    const resetLink = `${FRONTEND_URL}/reset-password?token=${resetToken}`;

    const { data, error } = await resend.emails.send({
      from: 'Velox Pay <no-reply@veloxpay.com>',
      to: toEmail,
      subject: 'Reset Your Velox Pay Password',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2>Reset Your Password</h2>
          <p>Hello,</p>
          <p>You requested to reset your password for Velox Pay.</p>
          <a href="${resetLink}" style="display:inline-block;padding:14px 28px;background:#22c55e;color:white;text-decoration:none;border-radius:6px;font-weight:bold;">
            Reset Password
          </a>
          <p>This link expires in 1 hour.</p>
          <p>If you didn't request this, please ignore this email.</p>
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
    console.error('Password reset failed:', err.message);
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
          <h2>Payment Reminder - Velox Pay</h2>
          <p>Dear ${invoice.client_name},</p>
          <p>Invoice <strong>${invoice.invoice_number}</strong> for <strong>$${parseFloat(invoice.total_amount).toLocaleString()}</strong> 
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

    console.log(`✅ Reminder sent for invoice ${invoice.invoice_number}`);
    return true;
  } catch (err) {
    console.error('Invoice reminder failed:', err.message);
    return false;
  }
};

const sendPasswordResetConfirmation = async (toEmail) => {
  try {
    const { data, error } = await resend.emails.send({
      from: 'Velox Pay <no-reply@veloxpay.com>',
      to: toEmail,
      subject: 'Your Velox Pay Password Has Been Reset',
      html: `<p>Your password has been successfully reset.</p>`
    });

    return !error;
  } catch (err) {
    console.error('Confirmation email failed:', err.message);
    return false;
  }
};

// ==================== INVOICE REJECTION ====================
const sendRejectionNotificationToSupplier = async (supplierEmail, invoice) => {
  try {
    const { data, error } = await resend.emails.send({
      from: 'Velox Pay <no-reply@veloxpay.com>',
      to: supplierEmail,
      subject: `Invoice ${invoice.invoice_number} Was Rejected`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2>Invoice Rejection Notice</h2>
          <p>Dear Supplier,</p>
          <p>Your invoice <strong>${invoice.invoice_number}</strong> for $${parseFloat(invoice.total_amount).toLocaleString()} was rejected by the client.</p>
          ${invoice.rejection_reason ? `<p><strong>Rejection Reason:</strong> ${invoice.rejection_reason}</p>` : ''}
          <p>Please review the invoice and re-upload it with any necessary corrections.</p>
          <p>Best regards,<br>Velox Pay Team</p>
        </div>
      `,
    });

    if (error) {
      console.error('Rejection notification error:', error);
      return false;
    }

    console.log(`✅ Rejection notification sent to supplier: ${supplierEmail}`);
    return true;
  } catch (err) {
    console.error('Failed to send rejection notification:', err.message);
    return false;
  }
};

// ==================== INVOICE SENT FOR APPROVAL ====================
const sendApprovalRequestEmail = async (clientEmail, invoice, supplierBusiness) => {
  try {
    const approvalLink = `${FRONTEND_URL}/approve/${invoice.invoice_number}`;

    const { data, error } = await resend.emails.send({
      from: 'Velox Pay <no-reply@veloxpay.com>',
      to: clientEmail,
      subject: `Action Required: Approve Invoice ${invoice.invoice_number}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2>Invoice Approval Request</h2>
          <p>Dear Client,</p>
          <p>You have received an invoice from <strong>${supplierBusiness}</strong> through Velox Pay.</p>
          
          <div style="background:#f8f9fa; padding:15px; border-radius:8px; margin:20px 0;">
            <p><strong>Invoice Number:</strong> ${invoice.invoice_number}</p>
            <p><strong>Amount:</strong> $${parseFloat(invoice.total_amount).toLocaleString()}</p>
            <p><strong>Due Date:</strong> ${new Date(invoice.due_date).toLocaleDateString()}</p>
          </div>

          <p>Please review and take action:</p>
          
          <a href="${approvalLink}" 
             style="display:inline-block;padding:14px 28px;background:#22c55e;color:white;text-decoration:none;border-radius:6px;font-weight:bold;">
            Review & Approve / Reject Invoice
          </a>

          <p style="margin-top:30px; color:#666;">
            This link is secure and will expire in 30 days.
          </p>
          <p>Thank you,<br>Velox Pay Team</p>
        </div>
      `,
    });

    if (error) {
      console.error('Approval email error:', error);
      return false;
    }

    console.log(`✅ Approval request email sent to client: ${clientEmail}`);
    return true;

  } catch (err) {
    console.error('Failed to send approval request email:', err.message);
    return false;
  }
};

module.exports = {
  sendPasswordResetEmail,
  sendPasswordResetConfirmation,
  sendInvoiceReminder,
  sendRejectionNotificationToSupplier,
  sendApprovalRequestEmail
};