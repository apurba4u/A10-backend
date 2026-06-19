# Fable Backend

A production-ready REST API for the Fable ebook sharing platform.

## Tech Stack

- **Runtime:** Node.js 18+
- **Framework:** Express 5
- **Database:** MongoDB Atlas with Mongoose 9
- **Auth:** Better Auth (email/password + Google OAuth)
- **Payments:** Stripe (Checkout + Webhooks)
- **Validation:** Zod
- **Language:** JavaScript (ES Modules)

## Features

- Email/password registration and login
- Google OAuth authentication
- Role-based access control (User, Writer, Admin)
- Ebook CRUD with search, filter, sort, pagination
- Stripe checkout for ebook purchases and writer verification
- Stripe webhook handler for payment fulfillment
- Bookmark and wishlist systems
- Admin analytics (revenue, genre distribution, user management)
- Admin seed account (admin@fable.com / Admin@123)

## Setup

```bash
# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Configure your .env with:
# - MongoDB URI
# - Stripe keys
# - Google OAuth credentials
# - Better Auth secret

# Seed sample data (optional)
npm run seed

# Start development server
npm run dev
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| PORT | Server port (default: 5000) | No |
| MONGO_DB_URI | MongoDB connection string | Yes |
| JWT_SECRET | JWT secret key | Yes |
| CLIENT_URL | Frontend URL (default: http://localhost:3000) | Yes |
| STRIPE_SECRET_KEY | Stripe secret key | Yes |
| STRIPE_WEBHOOK_SECRET | Stripe webhook secret | Yes |
| GOOGLE_CLIENT_ID | Google OAuth client ID | No |
| GOOGLE_CLIENT_SECRET | Google OAuth client secret | No |
| BETTER_AUTH_SECRET | Better Auth secret | Yes |
| BETTER_AUTH_URL | Backend URL for Better Auth | Yes |

## API Endpoints

### Auth
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login
- `GET /api/auth/session` - Get session
- `POST /api/auth/logout` - Logout

### Users
- `GET /api/v1/users/me` - Get profile
- `PUT /api/v1/users/me` - Update profile

### Ebooks
- `GET /api/v1/ebooks` - List ebooks (public)
- `GET /api/v1/ebooks/featured` - Featured ebooks
- `GET /api/v1/ebooks/top-writers` - Top writers
- `GET /api/v1/ebooks/genre/:genre` - Ebooks by genre
- `GET /api/v1/ebooks/:id` - Get ebook
- `POST /api/v1/ebooks` - Create ebook (writer/admin)
- `PUT /api/v1/ebooks/:id` - Update ebook (owner/admin)
- `DELETE /api/v1/ebooks/:id` - Delete ebook (owner/admin)
- `PATCH /api/v1/ebooks/:id/publish` - Toggle publish (owner/admin)

### Bookmarks
- `GET /api/v1/bookmarks` - List bookmarks
- `POST /api/v1/bookmarks` - Add bookmark
- `DELETE /api/v1/bookmarks/:ebookId` - Remove bookmark

### Wishlist
- `GET /api/v1/wishlist` - List wishlist
- `POST /api/v1/wishlist` - Add to wishlist
- `DELETE /api/v1/wishlist/:ebookId` - Remove from wishlist

### Transactions
- `GET /api/v1/transactions/user` - User purchase history
- `GET /api/v1/transactions/writer` - Writer sales history

### Stripe
- `POST /api/v1/stripe/create-checkout` - Create checkout session
- `GET /api/v1/stripe/check/:ebookId` - Check if purchased
- `POST /api/stripe/webhook` - Stripe webhook

### Admin
- `GET /api/v1/admin/users` - List users
- `PUT /api/v1/admin/users/:id/role` - Update user role
- `DELETE /api/v1/admin/users/:id` - Delete user
- `GET /api/v1/admin/ebooks` - List all ebooks
- `DELETE /api/v1/admin/ebooks/:id` - Delete ebook
- `PATCH /api/v1/admin/ebooks/:id/publish` - Toggle publish
- `GET /api/v1/admin/transactions` - All transactions
- `GET /api/v1/admin/analytics/overview` - Analytics overview
- `GET /api/v1/admin/analytics/revenue` - Monthly revenue data

## Seed Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@fable.com | Admin@123 |
| Writer | jane@fable.com | Writer@123 |
| User | john@fable.com | User@123 |

## Deployment

- **Platform:** Render or Railway
- **Database:** MongoDB Atlas
- **Environment:** Set all env vars in deployment platform
- **CORS:** Configure CLIENT_URL to your frontend domain
- **Webhooks:** Ensure /api/stripe/webhook uses raw body parsing
