# VeloxPay 💰

**Get paid faster.** Invoice factoring platform that lets suppliers upload invoices, get **85% advance instantly**, and receive the remaining **15% (minus fee)** after the client pays.

Built with **React + Node.js + PostgreSQL + Plaid ACH**.

---

## ✨ Features

- **Supplier Dashboard** – View pending, approved, and paid invoices
- **Invoice Upload** – Drag & drop PDF/image invoices with term selection (30/60/90 days)
- **Client Approval Flow** – Automatic approval request email to client
- **85% Early Advance** – Instant ACH credit to supplier via Plaid (on approval)
- **Automatic Collection** – ACH debit from client on due date (via Plaid)
- **Final Payout** – Remaining 15% (minus fee) sent to supplier immediately after collection
- **Fee Structure**:
  - 30 days → 5%
  - 60 days → 7.5%
  - 90 days → 10%
- **Daily Reminders** – Email reminders 3 days before and on due date
- **Secure Authentication** – Email/password + Google + Apple Sign In
- **Bank Account Connection** – Plaid Link for both suppliers (receiving) and clients (paying)

---

## 🛠 Tech Stack

**Frontend:**
- React 18
- React Router
- react-plaid-link
- Context API (Auth)

**Backend:**
- Node.js + Express
- PostgreSQL
- Plaid API (ACH Transfers)
- Node-cron (daily jobs)
- Multer (file uploads)
- JWT Authentication
- Resend (email)

---

## 🚀 Quick Start

### 1. Clone the repository
```bash
git clone https://github.com/ingdavidavila/veloxpay.git
cd veloxpay

2. Backend Setupbash

cd server
npm install

Create .env file in /server:env

JWT_SECRET=your_super_secret_jwt_key_here
PLAID_CLIENT_ID=your_plaid_client_id
PLAID_SECRET=your_plaid_sandbox_secret
PLAID_ENV=sandbox
RESEND_API_KEY=your_resend_api_key
DATABASE_URL=postgres://user:password@localhost:5432/veloxpay

Run migrations and start server:bash

node server.js

Server runs on http://localhost:50003. Frontend Setupbash

cd veloxpay   # or the frontend folder
npm install
npm start

Frontend runs on http://localhost:3000 Project Structure

veloxpay/
├── server/                  # Backend
│   ├── routes/             # auth.js, invoices.js, plaid.js
│   ├── utils/              # cronJobs.js, invoiceService.js, mailService.js
│   ├── middleware/         # authenticateToken.js
│   ├── uploads/invoices/   # Uploaded invoice files
│   └── server.js
│
├── veloxpay/                # Frontend (React)
│   ├── src/
│   │   ├── components/     # DashboardHome, Upload, Invoices, Profile, etc.
│   │   ├── AuthContext.js
│   │   ├── useAuth.js
│   │   └── App.css
│   └── package.json
│
├── README.md
└── .gitignore

 Important NotesCurrently using Plaid Sandbox mode. You need to request Transfer product access in Plaid Dashboard for production.
Make sure your PostgreSQL database has the tables: users, suppliers, customers, invoices, supplier_customers, etc.
Supplier ID linking is still being refined — some hardcoded values may exist during development.
Email sending uses Resend — verify your domain or use your own email for testing.

 RoadmapFull supplier-customer relationship management
Improve dashboard stats accuracy (supplier_id filtering)
Add invoice detail view + approval UI for clients
Production Plaid deployment
Better error handling and loading states
Tests
Deploy to production (Render / Vercel + Railway / AWS)

 ContributingPull requests are welcome! Please open an issue first for major changes. LicenseMIT License — feel free to use for learning or commercial projects.Made with  by David Avila

