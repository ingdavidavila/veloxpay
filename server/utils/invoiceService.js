// utils/invoiceService.js
const pool = require('../db');

const triggerAdvanceAfterApproval = async (invoiceId) => {
  try {
    const { rows } = await pool.query(`
      SELECT total_amount, term_days, advance_sent 
      FROM invoices 
      WHERE id = $1
    `, [invoiceId]);

    const invoice = rows[0];

    if (!invoice) {
      return { success: false, message: "Invoice not found" };
    }

    if (invoice.advance_sent) {
      return { success: false, message: "Advance already sent for this invoice" };
    }

    // Calculate 85% advance
    const advanceAmount = Math.round(invoice.total_amount * 0.85 * 100) / 100;

    // Update invoice
    await pool.query(`
      UPDATE invoices 
      SET 
        status = 'approved',
        advance_amount = $1,
        advance_sent = TRUE,
        updated_at = NOW()
      WHERE id = $2
    `, [advanceAmount, invoiceId]);

    console.log(`✅ 85% advance of $${advanceAmount} triggered for invoice ${invoiceId}`);

    // TODO: Later integrate Plaid ACH Credit to actually send money to supplier

    return { 
      success: true, 
      advanceAmount,
      message: "85% advance recorded successfully" 
    };

  } catch (error) {
    console.error("Error triggering advance:", error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  triggerAdvanceAfterApproval
};