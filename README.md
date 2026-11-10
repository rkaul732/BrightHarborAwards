# Bright Harbor Recognition

A staff recognition app for Bright Harbor Healthcare. It runs on Netlify with Next.js, uses Supabase Auth and Postgres for the staff directory and feed, and sends recognition emails through Resend. The source is ready for a GitHub repository.

## What it does

- Email link sign-in, with directory membership required for app access
- Staff shout-outs, feed likes, comments, and comment likes
- Point calculation based on the nominator's role and program relative to an employee recipient
- Admin-managed staff directory and personal dashboard
- Optional Resend email when someone receives a shout-out

Supervisors and directors can receive shout-outs, but earn zero points because the supplied point rules address employee recipients. Directors use the Admin tier when nominating an employee.

## Set up Supabase

1. Create a Supabase project and run `supabase/migrations/20261110170000_recognition.sql` in its SQL editor (or apply it with the Supabase CLI).
2. Enable email link sign-in in Supabase Auth. Add the production Netlify URL to the Auth URL configuration, including the allowed redirect URLs.
3. Copy `.env.example` to `.env.local` for local development. Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, and `BOOTSTRAP_ADMIN_EMAIL`. The bootstrap address is the only person allowed to create the initial administrator profile.
4. Keep the secret key server-side. It must never be exposed with `NEXT_PUBLIC_`.

The database tables have row level security enabled and direct access from browser keys revoked. The Next.js API validates the Supabase access token and directory membership before using its server-only database credential.

## Set up Resend

Verify a sending domain in Resend, then set `RESEND_API_KEY` and `RESEND_FROM` in Netlify. Resend is optional during local development; shout-outs still save if email is not configured or a send fails.

## Deploy to Netlify via GitHub

1. Push this folder to a GitHub repository.
2. Import that repository in Netlify. The build command is `npm run build`; `netlify.toml` sets Node 22.
3. Add all variables from `.env.example` in Netlify's environment settings. The public Supabase values are needed at build time; the secret and Resend values are server-only.
4. Deploy, then add the resulting URL to Supabase Auth's Site URL and redirect allow list.
5. Sign in with `BOOTSTRAP_ADMIN_EMAIL`, complete the administrator profile, and add staff emails, programs, and roles in **Manage directory**.

## Development

```bash
npm install
npm run dev
npm run typecheck
npm run build
```
