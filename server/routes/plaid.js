// routes/plaid.js
const express = require('express');
const router = express.Router();
const { Configuration, PlaidApi, PlaidEnvironments } = require('plaid');
const pool = require('../db');   // This matches your db.js in root

// Initialize Plaid Client
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

// ====================== CREATE LINK TOKEN ======================
router.post('/create-link-token', async (req, res) => {
  const { invoice_id, amount, due_date } = req.body;

  if (!invoice_id || !amount) {
    return res.status(400).json({ 
      success: false, 
      error: 'invoice_id and amount are required' 
    });
  }

  try {
    const linkTokenResponse = await plaidClient.linkTokenCreate({
      user: { 
        client_user_id: `invoice_${invoice_id}` 
      },
      client_name: 'VeloxPay',
      products: ['transfer'],                    // This is the important one
      country_codes: ['US'],
      language: 'en',
      // Remove the problematic transfer.type and account_filters for now
      // We can add more options later if needed
    });

    res.json({ 
      success: true,
      link_token: linkTokenResponse.data.link_token 
    });
  } catch (error) {
    console.error('Plaid Link Token Error:', error.response?.data || error);
    res.status(500).json({ 
      success: false, 
      error: error.response?.data?.error_message || 'Failed to create link token' 
    });
  }
});

// ====================== EXCHANGE PUBLIC TOKEN ======================
router.post('/exchange-public-token', async (req, res) => {
  const { public_token, invoice_id, account_id, metadata } = req.body;

  if (!public_token || !invoice_id || !account_id) {
    return res.status(400).json({ error: 'public_token, invoice_id and account_id are required' });
  }

  try {
    const exchangeResponse = await plaidClient.itemPublicTokenExchange({ public_token });
    const access_token = exchangeResponse.data.access_token;

    await pool.query(`
      UPDATE invoices 
      SET 
        plaid_access_token = $1,
        plaid_account_id = $2,
        ach_authorized = true,
        ach_authorized_at = NOW(),
        ach_authorized_metadata = $3
      WHERE id = $4
    `, [access_token, account_id, JSON.stringify(metadata || {}), invoice_id]);

    res.json({ success: true });
  } catch (error) {
    console.error('Plaid Exchange Token Error:', error.response?.data || error);
    res.status(500).json({ 
      success: false,
      error: error.response?.data?.error_message || 'Failed to exchange token' 
    });
  }
});

module.exports = router;