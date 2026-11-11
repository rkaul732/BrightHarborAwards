# Bright Harbor Recognition

A staff recognition app for Bright Harbor Healthcare. It runs on Netlify with Next.js, uses Supabase Auth and Postgres for the staff directory and feed, and sends recognition emails through Resend. The source is hosted in `rkaul732/BrightHarborAwards`.

## What it does

- Password sign-in; new staff create a password, then confirm their account by email before signing in
- Existing passwordless accounts can use an email link to create a password; a saved passwordless session opens the login page until they use that link
- Account creation and directory entries require an `@brightharbor.org` email address; a database trigger also rejects direct Supabase signups from other domains
- Staff shout-outs, feed likes, comments, and comment likes
- Full-history feed search by shout-out text or the nominator's or recipient's name, with more results loaded in pages
- Point calculation based on the nominator's role and program relative to an employee recipient
- Admin-managed staff directory and personal dashboard
- Optional Resend email when someone receives a shout-out

Supervisors and directors can receive shout-outs, but earn zero points because the supplied point rules address employee recipients. Directors use the Admin tier when nominating an employee.

## Set up Supabase

1. The recognition schema, search function, and Auth email-domain trigger are applied to the `BrightHarborAwards` Supabase project. Matching source migrations are in `supabase/migrations/`.
2. Keep **Email** sign-in, **Allow new users to sign up**, and **Confirm Email** enabled in Supabase Auth. Creating a password calls Supabase `signUp`, which sends the account confirmation email. Set `https://brightharborawards.netlify.app` as the Site URL and allow `https://brightharborawards.netlify.app/auth/callback` as a redirect URL. Allow `http://localhost:3000/auth/callback` for local development. Confirmation and sign-in links must return to `/auth/callback` so the server can exchange the one-time code for a cookie session.
3. Copy `.env.example` to `.env.local` for local development. Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, and `BOOTSTRAP_ADMIN_EMAIL`. The bootstrap address is the only person allowed to create the initial administrator profile.
4. Keep the secret key server-side. It must never be exposed with `NEXT_PUBLIC_`.

The database tables have row level security enabled and direct access from browser keys revoked. The Next.js proxy refreshes cookie sessions, `/` verifies the session before rendering, and `/login` is public. The API separately validates the Supabase access token and directory membership before using its server-only database credential.

## Set up Resend

Verify a sending domain in Resend, then connect Resend to Supabase Auth as its custom SMTP provider so staff can receive email sign-in links. Set `RESEND_API_KEY` and `RESEND_FROM` in Netlify for shout-out notifications. Resend is optional during local development; shout-outs still save if notification email is not configured or a send fails.

## Deploy to Netlify via GitHub

1. Push this folder to a GitHub repository.
2. Import that repository in Netlify. The build command is `npm run build`; `netlify.toml` sets Node 22.
3. Add all variables from `.env.example` in Netlify's environment settings. The public Supabase values are needed at build time; the secret and Resend values are server-only.
4. Deploy, then add the resulting URL to Supabase Auth's Site URL and redirect allow list.
5. Sign in with `BOOTSTRAP_ADMIN_EMAIL`, complete the administrator profile, and add staff emails, programs, and roles in **Manage directory**. Existing passwordless accounts should choose **Need a sign-in link?** and open the emailed link to create a password. New staff should choose **First time? Create account**, create a password, then open their confirmation email.

## Development

```bash
npm install
npm run dev
npm run typecheck
npm run build
```
