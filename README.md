# GST/MSME Compliance Reminder Tool

A lightweight Next.js + Supabase MVP for small Indian businesses that need one simple thing: **a clear view of their next GST filing reminder**.

## What V1 does

- Email/password signup and login with Supabase Auth.
- Captures:
  - Business name
  - GST number
  - Phone number
  - Filing frequency: monthly / quarterly
- Dashboard shows:
  - Next reminder due date
  - Days remaining / overdue
  - Green / yellow / red reminder badge
  - Past filing records
- **Mark as Filed** creates a filing record using today's date.
- The next reminder is calculated automatically from the latest filing record.
- Row Level Security keeps each business's data isolated.

## Explicitly out of scope

- GST government API integration or auto-filing
- Payment processing
- CA / multi-user accounts
- SMS/email notifications
- Invoice tracking

## Important V1 due-date assumption

This MVP is a **reminder tool, not a GST filing engine**.

For speed, V1 uses a simplified rule:

- Monthly: 20th of the following month.
- Quarterly: 22nd of the month following the quarter.

Actual GST deadlines can vary by return type, scheme, notification and other circumstances. Verify the applicable official due date before relying on a reminder for compliance.

If you later need production-grade compliance accuracy, make due dates data-driven and maintain them from official GST notifications rather than hard-coding a single rule.

## 1. Create Supabase project

Create a new project in Supabase.

Then open **SQL Editor** and run the complete contents of:

```text
schema.sql
```

The schema creates:

- `businesses`
- `filing_records`
- RLS policies
- A signup trigger that copies signup metadata into the business row

### Auth email confirmation

Supabase may require email confirmation by default.

For local MVP testing you can disable email confirmation in the Supabase Auth settings. If confirmation remains enabled, the signup page tells the user to confirm their email and then log in.

## 2. Configure environment variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Set:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

Use the Supabase project URL and anon/publishable client key from the project's API settings.

## 3. Install and run

Requirements: Node.js 20+ recommended.

```bash
npm install
npm run dev
```

Open:

```text
http://localhost:3000
```

## 4. Deploy to Vercel

1. Push this project to GitHub.
2. Import the repository in Vercel.
3. Add the same two environment variables in Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy.

No server-side secret/service-role key is required by this MVP.

## Project structure

```text
gst-msme-compliance-reminder/
├── app/
│   ├── dashboard/page.tsx
│   ├── login/page.tsx
│   ├── signup/page.tsx
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── AuthForm.tsx
│   ├── MarkFiledButton.tsx
│   └── SignOutButton.tsx
├── lib/
│   ├── gst.ts
│   └── supabase/
│       ├── client.ts
│       └── server.ts
├── middleware.ts
├── schema.sql
├── .env.example
├── next.config.ts
├── package.json
├── tsconfig.json
└── README.md
```

## Core calculation

If the latest filing record exists:

```text
latest filed date
        ↓
add 1 month (monthly) / 3 months (quarterly)
        ↓
apply V1 reminder due day
        ↓
next due date
        ↓
days remaining
        ↓
badge
```

Badge rules:

```text
> 10 days  → green
3–10 days  → yellow
< 3 days   → red
```

Overdue dates are also red.

## Security notes

- Browser code only uses the Supabase public/anon key.
- Database access is protected with Supabase RLS.
- Users can only read/write their own business and filing records.
- Never expose a Supabase service-role key to the browser.

## Production follow-ups

For a real compliance product, the first upgrade should be **data-driven due dates**. Add a return type and jurisdiction/scheme where necessary, then store the applicable due date for each tax period rather than deriving it from one generic rule.
