require('dotenv').config();
require('./utils/cronJobs');
const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/auth");

const app = express();

// FIXED CORS CONFIGURATION
app.use(cors({
  origin: "http://localhost:3000",        // Your React frontend
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
  optionsSuccessStatus: 200               // Important - prevents 204 issues
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", authRoutes);

app.listen(5000, () => {
  console.log("Server running on port 5000");
  console.log("🕒 Reminder cron job is active (daily at 8:00 AM)");
});