const cron = require('node-cron');
const pool = require('../db');
const plaidClient = require('./plaidService');        // ← Use shared service
const { sendInvoiceReminder } = require('./mailService');

// ====================== DAILY REMINDER JOB ======================
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
          i.due_date = CURRENT_DATE + INTERVAL '3 days'
          OR 
          i.due_date = CURRENT_DATE
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

// ====================== ACH COLLECTION JOB ======================
const collectionCron = cron.schedule('0 9 * * *', async () => {
  console.log('🔄 Starting Daily ACH Collection Job...');

  try {
    const query = `
      SELECT 
        i.id,
        i.invoice_number,
        i.total_amount,
        i.plaid_access_token,
        i.plaid_account_id,
        c.name AS client_name,
        c.email AS client_email
      FROM invoices i
      JOIN customers c ON c.id = i.customer_id
      WHERE i.ach_authorized = true
        AND i.plaid_access_token IS NOT NULL
        AND i.plaid_account_id IS NOT NULL
        AND i.due_date = CURRENT_DATE
        AND i.collected_amount IS NULL
        AND i.status NOT IN ('paid', 'cancelled', 'rejected');
    `;

    const { rows: invoices } = await pool.query(query);

    if (invoices.length === 0) {
      console.log('✅ No invoices to collect today.');
      return;
    }

    console.log(`📥 Found ${invoices.length} invoice(s) for ACH collection.`);

    for (const invoice of invoices) {
      const amount = Number(invoice.total_amount).toFixed(2);

      try {
        const authResponse = await plaidClient.transferAuthorizationCreate({
          access_token: invoice.plaid_access_token,
          account_id: invoice.plaid_account_id,
          type: 'debit',
          network: 'ach',
          amount: amount,
          ach_class: 'web',
          user: { legal_name: invoice.client_name },
          idempotency_key: `auth_${invoice.id}_${Date.now()}`,
        });

        const authorization_id = authResponse.data.authorization.id;

        const transferResponse = await plaidClient.transferCreate({
          access_token: invoice.plaid_access_token,
          account_id: invoice.plaid_account_id,
          authorization_id,
          type: 'debit',
          network: 'ach',
          amount: amount,
          description: `VeloxPay - Invoice ${invoice.invoice_number}`,
          idempotency_key: `debit_${invoice.id}`,
        });

        const transfer_id = transferResponse.data.transfer.id;

        await pool.query(`
          UPDATE invoices 
          SET 
            collected_amount = $1,
            collection_transfer_id = $2,
            collected_at = NOW()
          WHERE id = $3
        `, [invoice.total_amount, transfer_id, invoice.id]);

        console.log(`✅ Successfully collected $${amount} for invoice ${invoice.invoice_number}`);

        // TODO: Trigger remaining 15% payout to supplier here

      } catch (error) {
        console.error(`❌ Failed to collect invoice ${invoice.invoice_number}:`, error.response?.data || error.message);
      }
    }

  } catch (error) {
    console.error('❌ Error in ACH collection cron job:', error);
  }
}, {
  timezone: "America/Mexico_City"
});

// Graceful shutdown
process.on('SIGTERM', () => {
  reminderCron.stop();
  collectionCron.stop();
  console.log('All cron jobs stopped.');
});

module.exports = { 
  reminderCron, 
  collectionCron 
};