# CERTI-VAULT Frontend

Academic Certificate Authenticity Validator platform built with React, Vite, and Supabase.

## Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase project

## Environment Setup

1. Copy the example environment file:
   ```bash
   cp .env.example .env.local
   ```

2. Fill in your Supabase credentials in `.env.local`:
   - `VITE_SUPABASE_URL`: Your Supabase project URL
   - `VITE_SUPABASE_PUBLISHABLE_KEY`: Your Supabase anon/publishable key

   Find these at: https://supabase.com/dashboard → Project Settings → API

   **IMPORTANT:** Use the anon/publishable key, NOT the service_role key.

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run linter
npm run lint

# Preview production build
npm run preview
```

## Deployment

### Vercel Deployment

The project is configured for Vercel deployment with:
- `vercel.json` for SPA routing configuration
- Vite build output in `dist/` directory
- Client-side routing with React Router

**To deploy:**

1. Push your code to GitHub
2. Import project in Vercel
3. Set environment variables in Vercel dashboard:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
4. Deploy

**After deployment, configure Supabase redirects:**

Add your production domain to Supabase Dashboard → Authentication → URL Configuration:
- `https://your-domain.com/*`
- `https://your-domain.com/reset-password`

## Project Structure

- `src/pages/` - Page components
- `src/components/` - Reusable components
- `src/layouts/` - Layout components
- `src/services/` - API service functions
- `src/context/` - React context providers
- `src/routes/` - Route configuration
- `src/lib/` - Utility libraries
- `supabase/migrations/` - Database migrations

## Features

- User authentication (signup, login, logout, password reset)
- Role-based access control (student, issuer, admin)
- Certificate creation and verification
- Document upload verification
- Audit logs and fraud detection lab
- Responsive design with Tailwind CSS

## Security

- Row Level Security (RLS) enabled on all Supabase tables
- Service role key never exposed to frontend
- Role-based route protection
- Environment variables for sensitive configuration
