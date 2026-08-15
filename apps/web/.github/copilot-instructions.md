# VeloxPay AI Coding Guidelines

## Project Overview
VeloxPay is a React single-page application built with Create React App, serving as a landing page for a fast payment service. The app allows users to upload invoices, get approvals, and receive payments quickly. It includes routing for a login page.

## Architecture
- **PERN Stack**: Full-stack application with React frontend, Node.js/Express backend, and PostgreSQL database

Frontend:
* React (Create React App)
* React Router DOM for routing
* Bootstrap 5 for styling
* Bootstrap Icons

Backend:
* Node.js with Express inside a `/server` directory

Database:
* PostgreSQL

Backend Folder Structure:
server/
server.js
db.js
routes/
auth.js

Data Flow:
Signup.js / Login.js (React)
→ Fetch request
→ Express API endpoint
→ PostgreSQL database

PostgreSQL User Schema:
Table: users
Columns:
* id UUID primary key
* name text
* business_name text
* email text unique not null
* phone_number text
* bank_account text
* password_hash text not null
* created_at timestamp default current_timestamp

Passwords must be hashed using bcrypt before storing.

Signup.js will POST to: POST /api/signup

Login.js will POST to: POST /api/login

## Key Patterns
- **Component Structure**: Functional components with JSX return statements
- **Routing**: Wrap app in `BrowserRouter`, use `Routes` and `Route` for paths, `Link` for navigation
- **Styling Approach**: Use Bootstrap classes for layout (e.g., `container text-center`) and buttons (e.g., `btn btn-success`), supplemented by custom classes in `App.css`
- **Forms**: Use controlled components with `useState` for form inputs
- **File Organization**: Keep components, styles, and tests in `src/` directory

## Development Workflow
- **Start Development**: `npm start` launches dev server on http://localhost:3000
- **Testing**: `npm test` runs Jest with React Testing Library
- **Build**: `npm run build` creates optimized production bundle in `build/` folder

## Conventions
- Import CSS files directly in component files (e.g., `import './App.css'`)
- Use `className` for styling attributes in JSX
- Follow React 19 patterns for functional components
- Use Bootstrap Icons by importing `'bootstrap-icons/font/bootstrap-icons.css'`

## Example Code Structure
```jsx
// src/App.js - Router setup
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './Home';
import Login from './Login';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    </BrowserRouter>
  );
}
```

Reference: [src/App.js](src/App.js), [src/Home.js](src/Home.js), [src/Login.js](src/Login.js), [src/App.css](src/App.css), [package.json](package.json)</content>
<parameter name="filePath">c:\Users\Acade\Documents\Codeacademy\VeloxPay\veloxpay\.github\copilot-instructions.md