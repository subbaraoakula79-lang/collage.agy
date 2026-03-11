# National Level Admission Portal - AP Testing Phase

A comprehensive web-based platform for managing student admissions, connecting students, faculties, and administrators. 

## 🚀 Features
- **Student Portal**: Profile management, document upload, college/course applications, fee payments, and seat allotment tracking.
- **Faculty/Admin Portal**: College management, admission rounds, seat allocation, refund processing.
- **AI Chatbot**: Integrated Generative AI (OpenAI/Gemini) to assist students with queries.
- **DigiLocker Integration**: Verified document fetching using DigiLocker session models.
- **Payment Gateway**: Seamless application and admission fee payments via external gateways (e.g., Razorpay/Stripe).

## 💻 Tech Stack
### Frontend (Client)
- React 18 & Vite
- React Router DOM
- Firebase (for Hosting/Config)
- Axios & TypeScript

### Backend (Server)
- Node.js & Express.js
- Prisma ORM with SQLite (Supports PostgreSQL out of the box)
- TypeScript
- Authentication (JWT & Bcrypt)
- AI Integrations (`@google/generative-ai`, `openai`)
- Helpers: `multer` (file uploads), `pdfkit` (receipt generation), `qrcode`

## 📂 Project Structure
```text
national-admission-portal/
├── client/          # Vite + React Frontend
│   ├── src/         # UI Components, Pages, Firebase Config
│   └── package.json
├── server/          # Express + Prisma Backend
│   ├── prisma/      # Database Schema and Migrations
│   ├── src/         # API Routes, Controllers, AI Services
│   └── package.json
└── package.json     # Root workspace configuration
```

## ⚙️ Prerequisites
- Node.js (v18 or higher recommended)
- npm or yarn

## 🛠️ Installation & Setup

1. **Clone the repository and install dependencies:**
   ```bash
   # Installs dependencies for root, client, and server
   npm run install:all
   ```

2. **Set up Environment Variables:**
   - Create a `.env` file in the `server` directory. Use the `server/.env` format or any existing `.env.example`.
   - Ensure you define your `DATABASE_URL` for Prisma, along with any AI or Payment API keys required.

3. **Database Setup:**
   ```bash
   # Push schema to database
   npm run db:push
   
   # Generate Prisma Client
   npm run db:generate
   
   # Optional: Seed the database with initial data
   npm run seed
   ```

4. **Run the Application Locally:**
   ```bash
   # Starts both frontend and backend concurrently
   npm run dev
   ```
   - **Client** typically runs on `http://localhost:5173`
   - **Server** typically runs on `http://localhost:5001` or as specified in your `.env`.

## 🗄️ Database Models Overview
The core entities governed by Prisma ORM:
- **User**: Base authentication and role management (`STUDENT`, `FACULTY`, `ADMIN`).
- **StudentProfile**: Detailed profile mapping SSC, Inter, UG academic details, category, and document URLs.
- **College & Course**: Institution offerings, reservations, and fee structures.
- **Application & Allotment**: Student course applications and seat allotment status per admission phase/round.
- **Payment & Refund**: Tracking transactions, gateways, and installment capabilities.
- **DigiLockerSession**: Managing OTP and verification status for student documents.
- **ChatHistory**: Audit of AI assistant interactions (ChatGPT/Gemini).

## 📜 Available Scripts (Root Level)
| Command | Description |
|---|---|
| `npm run dev` | Runs both client and server in development mode. |
| `npm run dev:client` | Runs only the client application. |
| `npm run dev:server` | Runs only the backend server. |
| `npm run install:all`| Installs `node_modules` for root, server, and client. |
| `npm run seed` | Runs the database seeder script. |
| `npm run db:push` | Pushes Prisma schema state to the database. |
| `npm run db:generate`| Generates Prisma client types for TypeScript. |
