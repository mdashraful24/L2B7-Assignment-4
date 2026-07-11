# FixItNow Backend API

FixItNow is a robust backend API for a home services marketplace where customers can book trusted technicians, technicians can manage their profiles and bookings, and admins can oversee the platform.

## Overview

This project provides a RESTful API built with Node.js, Express, TypeScript, Prisma, and PostgreSQL. It supports role-based access for customers, technicians, and admins, along with Stripe-based payment flows and booking management.

## Roles

- Customer: browse services, book technicians, track bookings, and leave reviews
- Technician: create/update profile, manage availability, accept or decline bookings, and complete jobs
- Admin: manage users, bookings, and service categories

## Core Features

### Public
- Browse services and technicians
- Search and filter by category, location, price, and rating
- View technician profiles and reviews

### Customer
- Register and log in
- Book a technician for a service
- Make payments through Stripe
- View booking and payment history
- Leave reviews after job completion

### Technician
- Create and update service profile information
- Update skills, experience, and pricing
- Set availability slots
- View and manage incoming bookings
- Accept, decline, or complete bookings

### Admin
- View all users
- Ban or unban users
- View all bookings
- Manage service categories

## Tech Stack

- Node.js
- Express.js
- TypeScript
- Prisma ORM
- PostgreSQL
- JWT Authentication
- Stripe Payments

## Project Structure

- src/modules/auth: authentication modules
- src/modules/service: service listing and update APIs
- src/modules/technician: technician profile and availability APIs
- src/modules/booking: booking creation and management
- src/modules/payment: Stripe payment integration
- src/modules/review: customer review workflows
- src/modules/admin: admin management endpoints

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- npm or pnpm

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables in a `.env` file
4. Run Prisma migrations:
   ```bash
   npx prisma migrate dev
   ```
5. Start the development server:
   ```bash
   npm run dev
   ```

## Environment Variables

Create a `.env` file with the following values:

```env
DATABASE_URL=your_database_url
JWT_ACCESS_SECRET=your_access_secret
JWT_REFRESH_SECRET=your_refresh_secret
JWT_ACCESS_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
APP_URL=http://localhost:3000
ADMIN_EMAIL=admin@fixitnow.com
ADMIN_PASSWORD=Admin@1234
```

## API Documentation

A Postman collection is available [here](./postman/FixItNow%20(Backend).postman_collection.json), covering authentication, services, technicians, bookings, payments, reviews, and admin endpoints.

### Live deployment

Production URL:
https://fixitnow-blush.vercel.app

### Live API Documentation

Postman Documentation:
https://documenter.getpostman.com/view/54687734/2sBY4LQMTR

## API Routes

### Authentication
- `POST /api/auth/*`

### Technicians
- `GET /api/technicians`
- `POST /api/technicians`
- `PATCH /api/technicians/:id`

### Services
- `GET /api/services`
- `POST /api/services`
- `PATCH /api/services/:id`

### Categories
- `GET /api/categories`
- `POST /api/categories`
- `PATCH /api/categories/:id`

### Bookings
- `GET /api/bookings`
- `POST /api/bookings`
- `PATCH /api/bookings/:id`

### Payments
- `POST /api/payments`
- `POST /api/payments/webhook`

### Reviews
- `GET /api/reviews`
- `POST /api/reviews`

### Admin
- `GET /api/admin/users`
- `PATCH /api/admin/users/:id`
- `GET /api/admin/bookings`
- `POST /api/admin/categories`

## Default Admin Credentials

A default admin account is created automatically on startup if none exists.

- Email: `admin@fixitnow.com`
- Password: `admin123`

## Notes

- Stripe webhooks should be tested locally with:
  ```bash
  npm run stripe:webhook
  ```
- The API returns consistent JSON responses for both success and error cases.
