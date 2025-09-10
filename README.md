# RentLite - Simplified Rent Management

A streamlined web application for property managers to automatically track rent payments and get notifications when payments are received or missed.

## Features

- **Multi-User Support**: Secure user registration and authentication with email verification
- **Property Management**: Add and manage multiple properties with tenant details
- **Akahu Integration**: Connect your bank account to automatically verify rent payments
- **Smart Notifications**: Get email alerts the day after rent is due
- **Tenant Notifications**: Optional automated reminders to tenants when rent is missed
- **Flexible Schedules**: Support for weekly, fortnightly, and monthly rent cycles
- **Minimal Design**: Clean, trustworthy interface focused on financial reliability

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, NextAuth.js
- **Database**: PostgreSQL with Prisma ORM
- **Email**: Gmail SMTP via Nodemailer
- **Bank Integration**: Akahu API
- **Scheduling**: Cron jobs for automated rent checking

## Setup

### Prerequisites

- Node.js 18+
- PostgreSQL database
- Gmail account with app password
- Akahu developer account

### Environment Variables

Create a `.env` file with the following variables:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/rentlite"

# NextAuth
NEXTAUTH_SECRET="your-secret-here"
NEXTAUTH_URL="http://localhost:3000"

# Gmail SMTP
GMAIL_USER="your-email@gmail.com"
GMAIL_APP_PASSWORD="your-app-password"

# Cron Job Security
CRON_SECRET="your-cron-secret"
```

### Installation

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up the database: `npx prisma migrate dev`
4. Start the development server: `npm run dev`

### Database Setup

The application uses PostgreSQL with Prisma. To set up the database:

1. Ensure PostgreSQL is running
2. Update the `DATABASE_URL` in your `.env` file
3. Run migrations: `npx prisma migrate dev`
4. (Optional) Seed the database: `npx prisma db seed`

### Email Configuration

To set up Gmail SMTP:

1. Enable 2-factor authentication on your Gmail account
2. Generate an app password in your Google Account settings
3. Use your Gmail address as `GMAIL_USER`
4. Use the app password as `GMAIL_APP_PASSWORD`

### Akahu Integration

Users need to provide their own Akahu tokens:

1. Visit [Akahu Developer Portal](https://developers.akahu.nz)
2. Create an application to get an App Token
3. Complete OAuth flow to get a User Token
4. Enter both tokens in the application settings

### Automated Rent Checking

The application includes a cron endpoint at `/api/cron/check-rent` that should be called daily to check for rent payments. You can use a service like Vercel Cron or external cron job services.

Example cron job configuration:
```bash
# Check rent daily at 9 AM
0 9 * * * curl -X POST https://your-domain.com/api/cron/check-rent -H "Authorization: Bearer your-cron-secret"
```

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript type checking

### Database Commands

- `npx prisma migrate dev` - Run database migrations
- `npx prisma generate` - Generate Prisma client
- `npx prisma studio` - Open Prisma Studio
- `npx prisma db reset` - Reset database

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `GET /api/auth/verify` - Email verification
- NextAuth endpoints at `/api/auth/*`

### Properties
- `GET /api/properties` - List user's properties
- `POST /api/properties` - Create new property
- `GET /api/properties/[id]` - Get property details
- `PUT /api/properties/[id]` - Update property
- `DELETE /api/properties/[id]` - Delete property
- `POST /api/properties/[id]/check-rent` - Manual rent check

### User Settings
- `GET /api/user/settings` - Get user settings
- `PUT /api/user/settings` - Update user settings

### Cron Jobs
- `GET|POST /api/cron/check-rent` - Daily rent checking

## Security

- All routes are protected with authentication
- Akahu tokens are securely stored and encrypted
- Email verification required for new accounts
- CSRF protection via NextAuth
- Input validation with Zod schemas

## License

This project is licensed under the MIT License.