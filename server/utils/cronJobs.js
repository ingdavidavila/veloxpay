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

// ====================== ACH COLLECTION + 15% FINAL PAYOUT ======================
const collectionCron = cron.schedule('0 9 * * *', async () => {
  console.log('💰 Starting Daily ACH Collection + Final Payout Job...');

  try {
    const query = `
      SELECT 
        i.id,
        i.invoice_number,
        i.total_amount,
        i.advance_amount,
        i.term_days,
        i.fee_percentage,
        i.plaid_access_token,
        i.plaid_account_id,
        i.supplier_plaid_access_token,
        i.supplier_plaid_account_id,
        i.supplier_id
      FROM invoices i
      WHERE i.status = 'paid'                    -- Only process recently collected invoices
        AND i.collected_amount IS NOT NULL
        AND i.final_payout_sent IS NOT TRUE        -- Not yet paid the remaining 15%
        AND i.supplier_plaid_access_token IS NOT NULL
        AND i.supplier_plaid_account_id IS NOT NULL;
    `;

    const { rows: invoices } = await pool.query(query);

    if (invoices.length === 0) {
      console.log('✅ No invoices ready for final 15% payout today.');
      return;
    }

    console.log(`📤 Found ${invoices.length} invoice(s) for final 15% payout.`);

    for (const invoice of invoices) {
      try {
        // Calculate fee based on term_days (your exact structure)
        let feePercentage = 5.0;
        if (invoice.term_days >= 60) feePercentage = 7.5;
        if (invoice.term_days >= 90) feePercentage = 10.0;

        const total = parseFloat(invoice.total_amount);
        const advance = parseFloat(invoice.advance_amount || 0);
        const fee = total * (feePercentage / 100);
        const remaining = total - advance;
        const supplierPayout = Math.round((remaining - fee) * 100) / 100;

        if (supplierPayout <= 0) {
          console.warn(`⚠️ Supplier payout is zero or negative for invoice ${invoice.invoice_number}`);
          continue;
        }

        console.log(`Calculating final payout for invoice ${invoice.invoice_number}:`);
        console.log(`  Total: $${total} | Advance: $${advance} | Fee (${feePercentage}%): $${fee} | Payout: $${supplierPayout}`);

        // Send final payout via Plaid ACH Credit to supplier
        const supplierAuthResponse = await plaidClient.transferAuthorizationCreate({
          access_token: invoice.supplier_plaid_access_token,
          account_id: invoice.supplier_plaid_account_id,
          type: 'credit',
          network: 'ach',
          amount: supplierPayout.toFixed(2),
          description: `VeloxPay - Final payout for Invoice ${invoice.invoice_number}`,
        });

        const supplierAuthorizationId = supplierAuthResponse.data.authorization.id;

        const supplierTransferResponse = await plaidClient.transferCreate({
          access_token: invoice.supplier_plaid_access_token,
          account_id: invoice.supplier_plaid_account_id,
          authorization_id: supplierAuthorizationId,
          type: 'credit',
          network: 'ach',
          amount: supplierPayout.toFixed(2),
          description: `VeloxPay - Final payout for Invoice ${invoice.invoice_number}`,
          idempotency_key: `final_payout_${invoice.id}`,
        });

        const supplierTransferId = supplierTransferResponse.data.transfer.id;

        // Update invoice
        await pool.query(`
          UPDATE invoices 
          SET 
            final_payout_amount = $1,
            final_payout_transfer_id = $2,
            final_payout_sent = TRUE,
            final_payout_at = NOW(),
            fee_percentage = $3
          WHERE id = $4
        `, [supplierPayout, supplierTransferId, feePercentage, invoice.id]);

        console.log(`✅ Sent final payout of $${supplierPayout} to supplier for invoice ${invoice.invoice_number}`);

      } catch (error) {
        console.error(`❌ Failed to send final payout for invoice ${invoice.invoice_number}:`, error.response?.data || error.message);
      }
    }

    console.log('✅ Daily collection + final payout job completed.');

  } catch (error) {
    console.error('❌ Error in ACH collection + final payout cron job:', error);
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