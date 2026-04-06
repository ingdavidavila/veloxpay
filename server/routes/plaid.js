const express = require('express');
const router = express.Router();
const plaidClient = require('../utils/plaidService');   // ← Use shared service
const pool = require('../db');
const authenticateToken = require('../middleware/auth.js');

// ====================== CLIENT SIDE (Debit from client) ======================

// Create Link Token for Client
router.post('/create-link-token', async (req, res) => {
  const { invoice_id, amount } = req.body;

  if (!invoice_id || !amount) {
    return res.status(400).json({ success: false, error: 'invoice_id and amount are required' });
  }

  try {
    const linkTokenResponse = await plaidClient.linkTokenCreate({
      user: { client_user_id: `invoice_${invoice_id}` },
      client_name: 'VeloxPay',
      products: ['transfer'],
      country_codes: ['US'],
      language: 'en',
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

// Exchange Public Token for Client
router.post('/exchange-public-token', async (req, res) => {
  const { public_token, invoice_id, account_id, metadata } = req.body;

  if (!public_token || !invoice_id || !account_id) {
    return res.status(400).json({ success: false, error: 'Missing required fields' });
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
    res.status(500).json({ success: false, error: 'Failed to exchange token' });
  }
});

// ====================== SUPPLIER SIDE (Credit to supplier) ======================

// Create Link Token for Supplier
router.post('/supplier-link-token', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.userId || req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const linkTokenResponse = await plaidClient.linkTokenCreate({
      user: { client_user_id: `supplier_${userId}` },
      client_name: 'VeloxPay',
      products: ['transfer'],
      country_codes: ['US'],
      language: 'en',
    });

    res.json({ 
      success: true,
      link_token: linkTokenResponse.data.link_token 
    });
  } catch (error) {
    console.error('Supplier Link Token Error:', error.response?.data || error);
    res.status(500).json({ 
      success: false, 
      error: error.response?.data?.error_message || 'Failed to create link token' 
    });
  }
});

// Exchange Public Token for Supplier
router.post('/supplier-exchange-token', authenticateToken, async (req, res) => {
  const { public_token, account_id, metadata } = req.body;

  if (!public_token || !account_id) {
    return res.status(400).json({ success: false, error: 'public_token and account_id are required' });
  }

  try {
    const userId = req.user?.userId || req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const exchangeResponse = await plaidClient.itemPublicTokenExchange({ public_token });
    const access_token = exchangeResponse.data.access_token;

    // Save to suppliers table
    await pool.query(`
      UPDATE suppliers 
      SET 
        plaid_access_token = $1,
        plaid_account_id = $2,
        plaid_metadata = $3,
        bank_connected = true,
        bank_connected_at = NOW()
      WHERE id = $4
    `, [access_token, account_id, JSON.stringify(metadata || {}), userId]);

    // Copy to unpaid invoices
    await pool.query(`
      UPDATE invoices 
      SET 
        supplier_plaid_access_token = $1,
        supplier_plaid_account_id = $2
      WHERE supplier_id = $3 AND advance_sent = false
    `, [access_token, account_id, userId]);

    res.json({ success: true, message: 'Bank account connected successfully' });
  } catch (error) {
    console.error('Supplier Exchange Token Error:', error.response?.data || error);
    res.status(500).json({ 
      success: false, 
      error: error.response?.data?.error_message || 'Failed to save bank account' 
    });
  }
});

module.exports = router;