# FinConnect Backend

This is the backend API for the FinConnect application, built with Node.js and Express.

## Features

- JWT Authentication
- Role-based access control (Admin, Developer)
- Subscription Management
- Core API Endpoints
- Rate Limiting
- SQLite Database

## Prerequisites

- Node.js (v14 or higher)
- npm

## Installation

1. Clone the repository
2. Navigate to the backend directory:
   ```bash
   cd backend
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Create a `.env` file in the root directory with the following variables:
   ```
   PORT=5000
   JWT_SECRET=your_jwt_secret_key_here
   JWT_EXPIRES_IN=24h
   RATE_LIMIT_WINDOW_MS=60000
   RATE_LIMIT_MAX=10
   ```

## Running the Application

1. Start the development server:
   ```bash
   npm run dev
   ```
2. Seed the database with initial data:
   ```bash
   npm run seed
   ```

## API Endpoints

### Authentication
- POST `/api/auth/register` - Register a new user
- POST `/api/auth/login` - Login user

### Core API (Requires Authentication)
- GET `/api/balance` - Get user balance
- POST `/api/transfer` - Make a transfer
- GET `/api/transactions` - Get transaction history
- GET `/api/invoice` - Get invoice details

### Admin API (Requires Admin Role)
- GET `/api/admin/users` - Get all users
- POST `/api/admin/subscriptions/cancel` - Cancel subscription
- GET `/api/admin/logs` - Get system logs

## Development

- The server runs on port 5000 by default
- Uses SQLite for database
- Implements rate limiting (10 requests per minute per user)
- JWT tokens are required for authenticated routes 