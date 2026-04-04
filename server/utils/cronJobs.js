const cron = require('node-cron');
const pool = require('../db');
const { sendInvoiceReminder } = require('./mailService');

// Daily Reminder Job - Runs every day at 8:00 AM
const reminderCron = cron.schedule('0 8 * * *', async () => {
  console.log('🔄 Starting Daily Invoice Reminder Job...');

  try {
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
          i.due_date = CURRENT_DATE - INTERVAL '3 days'   -- 3 days before
          OR 
          i.due_date = CURRENT_DATE                        -- on due date
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
      const success = await sendInvoiceReminder(invoice);
      if (!success) {
        console.warn(`⚠️ Failed to send reminder for invoice ${invoice.invoice_number}`);
      }
    }

    console.log(`✅ Daily reminder job completed. Processed ${invoices.length} invoices.`);

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