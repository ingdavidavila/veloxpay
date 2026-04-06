// utils/invoiceService.js
const pool = require('../db');
const { Configuration, PlaidApi, PlaidEnvironments } = require('plaid');

const configuration = new Configuration({
  basePath: PlaidEnvironments[process.env.PLAID_ENV || 'sandbox'],
  baseOptions: {
    headers: {
      'PLAID_CLIENT-ID': process.env.PLAID_CLIENT_ID,
      'PLAID-SECRET': process.env.PLAID_SECRET,
    },
  },
});

const plaidClient = new PlaidApi(configuration);

const triggerAdvanceAfterApproval = async (invoiceId) => {
  try {
    const { rows } = await pool.query(`
      SELECT 
        i.total_amount,
        i.advance_sent,
        i.supplier_plaid_access_token,
        i.supplier_plaid_account_id,
        s.business_name AS supplier_name
      FROM invoices i
      JOIN suppliers s ON s.id = i.supplier_id
      WHERE i.id = $1
    `, [invoiceId]);

    const invoice = rows[0];

    if (!invoice) {
      return { success: false, message: "Invoice not found" };
    }

    if (invoice.advance_sent) {
      return { success: false, message: "Advance already sent for this invoice" };
    }

    if (!invoice.supplier_plaid_access_token || !invoice.supplier_plaid_account_id) {
      return { 
        success: false, 
        message: "Supplier has not connected their bank account for receiving advance" 
      };
    }

    const advanceAmount = Math.round(invoice.total_amount * 0.85 * 100) / 100;

    try {
      // 1. Create Authorization for Credit Transfer
      const authResponse = await plaidClient.transferAuthorizationCreate({
        access_token: invoice.supplier_plaid_access_token,
        account_id: invoice.supplier_plaid_account_id,
        type: 'credit',                       // Sending money TO supplier
        network: 'ach',
        amount: advanceAmount.toFixed(2),
        ach_class: 'ccd',                     // CCD = Corporate Credit
        user: { 
          legal_name: invoice.supplier_name 
        },
        idempotency_key: `advance_${invoiceId}_${Date.now()}`,
      });

      const authorization_id = authResponse.data.authorization.id;

      // 2. Execute the Credit Transfer
      const transferResponse = await plaidClient.transferCreate({
        access_token: invoice.supplier_plaid_access_token,
        account_id: invoice.supplier_plaid_account_id,
        authorization_id,
        type: 'credit',
        network: 'ach',
        amount: advanceAmount.toFixed(2),
        description: `VeloxPay - 85% Advance for Invoice ${invoiceId}`,
        idempotency_key: `adv_${invoiceId}`,
      });

      const transfer_id = transferResponse.data.transfer.id;

      // Update invoice
      await pool.query(`
        UPDATE invoices 
        SET 
          status = 'approved',
          advance_amount = $1,
          advance_sent = TRUE,
          advance_transfer_id = $2,
          updated_at = NOW()
        WHERE id = $3
      `, [advanceAmount, transfer_id, invoiceId]);

      console.log(`✅ 85% advance $${advanceAmount} sent to supplier via ACH for invoice ${invoiceId}`);

      return { 
        success: true, 
        advanceAmount,
        transfer_id,
        message: "85% advance sent successfully via ACH Credit" 
      };

    } catch (plaidError) {
      console.error("Plaid Credit Transfer Error:", plaidError.response?.data || plaidError);
      return { 
        success: false, 
        error: plaidError.response?.data?.error_message || "Failed to send advance" 
      };
    }

  } catch (error) {
    console.error("Error in triggerAdvanceAfterApproval:", error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  triggerAdvanceAfterApproval
};