const pool = require('../db');
const { Configuration, PlaidApi, PlaidEnvironments } = require('plaid');

const configuration = new Configuration({
  basePath: PlaidEnvironments[process.env.PLAID_ENV || 'sandbox'],
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
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
        i.term_days,
        i.fee_percentage,           -- We will use this if already set, otherwise calculate
        i.advance_sent,
        i.supplier_plaid_access_token,
        i.supplier_plaid_account_id
      FROM invoices i
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

    // === Calculate fee based on your exact structure ===
    let feePercentage = parseFloat(invoice.fee_percentage) || 5.0;

    // If fee_percentage was not saved at upload time, calculate it now from term_days
    if (!invoice.fee_percentage) {
      if (invoice.term_days >= 90) feePercentage = 10.0;
      else if (invoice.term_days >= 60) feePercentage = 7.5;
      else feePercentage = 5.0;
    }

    const totalAmount = parseFloat(invoice.total_amount);
    const advanceAmount = Math.round(totalAmount * 0.85 * 100) / 100;

    console.log(`Calculating 85% advance for invoice ${invoiceId}:`);
    console.log(`  Term days: ${invoice.term_days} → Fee: ${feePercentage}%`);
    console.log(`  Total: $${totalAmount} | Advance: $${advanceAmount}`);

    try {
      // 1. Create Authorization for Credit (85% to supplier)
      const authResponse = await plaidClient.transferAuthorizationCreate({
        access_token: invoice.supplier_plaid_access_token,
        account_id: invoice.supplier_plaid_account_id,
        type: 'credit',
        network: 'ach',
        amount: advanceAmount.toFixed(2),
        description: `VeloxPay - 85% Advance for Invoice ${invoiceId}`,
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
        idempotency_key: `advance_${invoiceId}`,
      });

      const transfer_id = transferResponse.data.transfer.id;

      // Update invoice
      await pool.query(`
        UPDATE invoices 
        SET 
          status = 'approved',
          advance_amount = $1,
          fee_percentage = $2,           -- Save/overwrite fee percentage
          advance_sent = TRUE,
          advance_transfer_id = $3,
          updated_at = NOW()
        WHERE id = $4
      `, [advanceAmount, feePercentage, transfer_id, invoiceId]);

      console.log(`✅ 85% advance of $${advanceAmount} sent successfully for invoice ${invoiceId}`);

      return { 
        success: true, 
        advanceAmount,
        feePercentage,
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