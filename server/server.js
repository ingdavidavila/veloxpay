require('dotenv').config();

const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth");
const plaidRoutes = require('./routes/plaid');
const invoiceRoutes = require('./routes/invoices'); 

// Import cron jobs (this will start them automatically)
const { reminderCron, collectionCron } = require('./utils/cronJobs');

const app = express();

// CORS Configuration
app.use(cors({
  origin: "http://localhost:3000",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
  optionsSuccessStatus: 200
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api", authRoutes);
app.use('/api/plaid', plaidRoutes);
app.use('/api/invoices', invoiceRoutes); 

// ====================== CRON JOBS STATUS ======================
console.log('🚀 Server starting...');
console.log('🕒 Reminder cron job scheduled → 8:00 AM Mexico City');
console.log('💰 ACH Collection cron job scheduled → 9:00 AM Mexico City');

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});