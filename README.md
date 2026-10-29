# JamBridge — Musician Community & Gig Marketplace

JamBridge is a mobile-first React + Vite musician social network and gig marketplace. This update preserves the existing prototype UI and adds the first Supabase backend foundation plus a protected administrator console at `/admin`.

## What is included in this update

- Existing JamBridge social feed, discovery, gigs, communities, messages, profile and bookings UI preserved.
- Supabase client setup using local environment variables.
- Initial SQL migration for profiles, roles, posts, comments, likes, follows, gigs, applications, bookings, conversations, messages, notifications, reports, reviews and admin audit logs.
- Row Level Security policies as a starting point for access control.
- Storage buckets and conservative upload policies for avatars and user media.
- Admin sign-in through Supabase Auth at `/admin`.
- Admin role check against `user_roles`.
- Admin dashboard with live database counts, recent profiles, account suspension/restoration controls, report review, and basic metrics.
- `.env.example` with placeholder settings only.

**Important:** This is the backend foundation and first admin dashboard pass. The existing public social feed and gig pages are still prototype/demo interactions until they are individually connected to Supabase. Payments are intentionally not included yet.

## Requirements

- Node.js 20.19+ or 22.12+ recommended
- npm
- A Supabase project

## 1. Install and run locally

Extract the ZIP, open a terminal inside the `JamBridge` folder, then run:

```bash
npm install
npm run dev
```

Open the Vite URL printed in the terminal, usually `http://localhost:5173`.

On Windows PowerShell, if `npm.ps1` is blocked by your execution policy, use the Windows command shim instead:

```powershell
npm.cmd install
npm.cmd run dev
```

## 2. Configure Supabase

1. Create a project at https://supabase.com/dashboard.
2. In the project settings, copy the Project URL and the public anon/publishable key.
3. Copy `.env.example` to `.env.local` in the same folder as `package.json`.
4. Replace the placeholders:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_PUBLISHABLE_OR_ANON_KEY
```

5. Restart the Vite development server after editing environment variables.

Only use the public anon/publishable key in this Vite frontend. **Never put a Supabase service-role key or other secret in a `VITE_*` variable or commit it to source control.**

## 3. Create the database

In the Supabase dashboard, open **SQL Editor**, create a new query, paste the contents of `supabase/migrations/001_initial_schema.sql`, and run it. The migration creates the initial tables, RLS policies, new-user profile trigger and media buckets.

For production, review the RLS policies and upload rules with your final user flows before opening registrations to the public. Keep a backup before applying future schema changes.

## 4. Create your first administrator

1. Start the site and register a normal test account using Supabase Auth once the public authentication UI has been connected, or create a test user through Supabase **Authentication → Users**.
2. Copy that user's UUID from the Authentication users table.
3. In SQL Editor, run the following query with the real UUID substituted:

```sql
insert into public.user_roles (user_id, role)
values ('PASTE-REAL-AUTH-USER-UUID-HERE', 'admin')
on conflict (user_id, role) do nothing;
```

4. Open `http://localhost:5173/admin` and sign in with that user's email and password.

The admin console checks the signed-in user's role in the database. Do not add an admin role selector to the public frontend. Grant or revoke admin access only through a trusted owner process.

## 5. Current admin console scope

- Overview: database counts for profiles, posts, gigs, bookings and reports.
- Users: newest profiles and suspend/restore controls.
- Reports: review and resolve report records.
- Gigs & bookings: initial totals; deeper operational tools are planned for the next pass.
- Analytics: current totals; historical growth charts require additional event aggregation.

The initial users screen loads the eight newest profiles, so it is not yet a complete searchable user directory. Admin actions and moderation workflows should receive an audit log entry in the next pass before production use.

## 6. Current prototype limitations

The existing public app still uses local React state for demo posts, follows, gig applications, messages, groups and bookings. These reset on refresh and are not shared across users. The SQL schema and admin console establish the foundation; they do not automatically make those screens live. The next implementation step is to connect the public UI one feature at a time, starting with authentication/profile, then posts, then gigs/applications/bookings, then messaging/notifications.

Payments are not included. Add them only after booking states, cancellation terms, disputes and the intended provider's supported Nigerian business/payout model have been tested.

## 7. Production checklist

- Connect all public screens to Supabase and remove demo-only success messages.
- Review and test every RLS policy using different user accounts.
- Add server-side validation and safe booking-state transition functions.
- Add pagination, search and audit logs to admin tools.
- Configure Auth email templates, redirect URLs and password reset URLs.
- Review privacy, copyright, moderation, retention and account deletion processes.
- Set up monitoring, backups and a tested restore procedure.
- Deploy the frontend and configure the production environment variables and domain.

## File map

- `src/main.jsx` — existing public app; `/admin` route selection is added at the bottom.
- `src/AdminDashboard.jsx` — protected admin console.
- `src/admin.css` — admin styling.
- `src/lib_supabase.js` — Supabase client setup.
- `supabase/migrations/001_initial_schema.sql` — initial database schema and policies.
- `.env.example` — safe environment variable template.


## Theme update
The main JamBridge user interface now opens in light mode by default, using white surfaces with purple gradients. The moon/sun control in the top bar switches between light mode and a deep purple dark mode. The selection is saved in the browser for future visits. The separate admin console keeps its dark admin styling.


## Connected gig marketplace update

The Find Gigs flow now uses the existing Supabase `gigs` and `gig_applications` tables instead of local-only sample listings. Sign-in/sign-up uses Supabase Auth. A signed-in client can publish a gig; signed-in musicians can apply, and applications are stored in Supabase. Existing RLS policies in `supabase/migrations/001_initial_schema.sql` are expected to be installed in your existing Supabase project. Do not rerun the initial schema on an already configured project.

### Required local configuration

1. Copy `.env.example` to `.env.local` beside `package.json`.
2. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to your project's URL and publishable/anon key. Never use a service-role or secret key in frontend environment variables.
3. Run `npm.cmd install` and `npm.cmd run dev`.
4. Create/sign in to a user account from the **Sign in** button. If email confirmation is enabled, confirm the address first.
5. Open **Find gigs** to publish a listing or apply. Test with two separate accounts to verify the client can see applications for their own gigs.

### Current scope and limitations

This update connects gig listings and gig applications. It does not yet make every other section live: feed posts, stories, profile editing, real messaging, likes/comments, notifications, and booking confirmation still require their own Supabase integrations. The public gig list currently requires sign-in because the existing database RLS policy allows authenticated reads. Application counts may be incomplete for viewers who are not the gig owner because row-level security intentionally hides other clients' applications.


## Post photo, video, and location update

This update adds post publishing with optional photo/video uploads and optional manually entered location. After extracting this ZIP and copying your existing `.env.local`, run this additional migration **once** in the existing Supabase project's SQL Editor: `supabase/migrations/002_post_media_location.sql`. Do not rerun the original migration. The migration makes the `jambridge-media` bucket public for community post media; uploaded files are limited by client-side checks to images up to 10 MB and MP4/WebM videos up to 50 MB, and uploads are placed in the signed-in user's folder. Review bucket and storage policies before production.

The post feed now loads posts from Supabase for signed-in users and publishes posts to the `posts` table. Location is manually entered, not precise GPS. This update does not yet connect stories, profile editing, likes/comments persistence, or messaging.

## User experience follow-up (October 2026)
- Feed photo media can now be opened in a new tab for a larger view.
- Share actions now attempt to copy a profile/post link to the clipboard.
- User-facing placeholder wording was softened so the interface does not expose unnecessary implementation jargon.

Important: this is not a claim that all social features are complete. Profile editing, live direct messages, database-backed comments/likes, stories, and community creation still require full feature implementation and testing against your Supabase project. Clipboard sharing creates a URL with an ID query parameter; resolving those URLs to a dedicated profile/post view remains a follow-up task.

## October 2026 fix: post publishing, media detail and communities

If publishing previously showed `Could not find the 'location_text' column of 'posts' in the schema cache`, run `supabase/migrations/003_post_comments_groups.sql` in the **same existing Supabase project's SQL Editor**. The migration adds the missing column safely and creates the `groups` and `group_members` tables with row-level security. Refresh the browser after the SQL succeeds; if Supabase still reports a schema-cache error, wait briefly and reload the app.

Photos and videos in the feed now open inside a JamBridge post-detail modal rather than opening a new browser tab. The modal includes the post text and comments; comments are read from and written to Supabase for real published posts. Community creation now opens a form and saves a group plus its owner membership to Supabase. Creating groups requires a signed-in account and the migration above. The popular community cards are still curated sample cards; listing newly created groups and implementing full member management are remaining work.

PowerShell commands from the folder containing `package.json`:

```powershell
npm.cmd install
npm.cmd run dev
```

After applying the migration, restart Vite if it was already running and test publishing a text-only post, a photo post, opening its detail modal, adding a comment, and creating a community while signed in.
