// utils/cronJobs.js
const cron = require('node-cron');
const pool = require('../db');
const { sendPasswordResetEmail } = require('./mailService'); // We'll create a new function later

// Daily Reminder Job - Runs every day at 8:00 AM
const reminderCron = cron.schedule('0 8 * * *', async () => {
  console.log('🔄 Starting Daily Invoice Reminder Job...');

  try {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    // Find invoices that need reminders
    const query = `
      SELECT 
        i.id,
        i.invoice_number,
        i.total_amount,
        i.due_date,
        i.description,
        c.name AS client_name,
        c.email AS client_email,
        s.business_name AS supplier_business
      FROM invoices i
      JOIN customers c ON c.id = i.customer_id
      JOIN suppliers s ON s.id = i.supplier_id
      WHERE i.status NOT IN ('paid', 'cancelled')
        AND (
          (i.due_date = CURRENT_DATE - INTERVAL '3 days')     -- 3 days before
          OR 
          (i.due_date = CURRENT_DATE)                         -- on due date
        )
      ORDER BY i.due_date ASC;
    `;

    const { rows: invoices } = await pool.query(query);

    if (invoices.length === 0) {
      console.log('✅ No invoices need reminders today.');
      return;
    }

    console.log(`📧 Found ${invoices.length} invoice(s) for reminders.`);

    for (const invoice of invoices) {
      try {
        const daysUntilDue = Math.ceil((new Date(invoice.due_date) - new Date(today)) / (1000 * 3600 * 24));

        const subject = daysUntilDue <= 0 
          ? `Velox Pay - Invoice ${invoice.invoice_number} is Due Today`
          : `Velox Pay - Invoice ${invoice.invoice_number} Due in ${daysUntilDue} Days`;

        await resend.emails.send({   // We'll update this with your mailService later
          from: 'Velox Pay <no-reply@veloxpay.com>',
          to: invoice.client_email,
          subject: subject,
          html: `
            <h2>Payment Reminder</h2>
            <p>Dear ${invoice.client_name},</p>
            <p>This is a reminder that invoice <strong>${invoice.invoice_number}</strong> 
            for <strong>$${parseFloat(invoice.total_amount).toLocaleString()}</strong> 
            is due ${daysUntilDue <= 0 ? 'today' : `in ${daysUntilDue} days`}.</p>
            
            <p><strong>Supplier:</strong> ${invoice.supplier_business}</p>
            ${invoice.description ? `<p><strong>Description:</strong> ${invoice.description}</p>` : ''}
            
            <p>Please make the payment at your earliest convenience.</p>
            <p>Thank you,<br>Velox Pay Team</p>
          `
        });

        console.log(`✅ Reminder sent for invoice ${invoice.invoice_number} to ${invoice.client_email}`);
      } catch (err) {
        console.error(`Failed to send reminder for invoice ${invoice.invoice_number}:`, err);
      }
    }

    console.log('✅ Daily reminder job completed.');

  } catch (error) {
    console.error('❌ Error in reminder cron job:', error);
  }
}, {
  timezone: "America/Mexico_City"
});

// Graceful shutdown
process.on('SIGTERM', () => {
  reminderCron.stop();
  console.log('Reminder cron job stopped.');
});

module.exports = { reminderCron };