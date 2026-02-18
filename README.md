## Pilates Studio Management System

This repository contains a Next.js application for a boutique Pilates studio.  
It combines a marketing website (for new and existing clients) with a management system that helps the studio team handle trainees and classes.

### What the project does

- **Public website**:  
  - Home, About, Pricing, Contact and Accessibility pages that present the studio, pricing options and how to get in touch.  
  - Designed to be clear, mobile‑friendly, and focused on conversion.

- **Trainee management**:  
  - Admins can manage trainee profiles (name, email, phone).  
  - Tracks membership type (weekly subscription) and punch‑card credits, including automatic handling of expiry dates.

- **Class scheduling and registration**:  
  - Admins build a weekly schedule of classes (machines/mat, different levels).  
  - Classes can be created as one‑off or recurring (weekly series).  
  - Shows how many trainees are registered vs. class capacity.  
  - Allows admins to manually register or remove trainees from classes with guardrails (e.g. weekly quota checks).

- **Admin dashboard**:  
  - A protected `/admin` area where studio owners can:  
    - Create and manage classes in a visual weekly timetable (desktop and mobile views).  
    - Maintain the trainee list and update memberships/punch cards.  
    - See who is registered for each class and cancel single classes or whole series.

- **Trainee area**:  
  - Authenticated trainees access `/users` to see their information and interact with the studio (e.g. class bookings, depending on current design).

- **Authentication and security**:  
  - Clerk is used for authentication and user management.  
  - Middleware protects admin and user routes so only logged‑in users (and only admins) see the right areas.  
  - Clerk webhooks are handled in an API route to keep auth data in sync.

---

## Project structure

High‑level file and folder overview:

```bash
pilates-studio/
├── app/                         # App Router pages and layouts
│   ├── about/                   # “About the studio” page
│   │   └── page.tsx
│   ├── accessibility/           # Accessibility statement
│   │   └── page.tsx
│   ├── admin/                   # Admin dashboard for schedule & trainees
│   │   └── page.tsx
│   ├── classes/                 # Classes overview / booking entry point
│   │   └── page.tsx
│   ├── contact/                 # Contact details and form
│   │   └── page.tsx
│   ├── home/                    # Custom home/landing page
│   │   └── page.tsx
│   ├── pricing/                 # Pricing and membership options
│   │   └── page.tsx
│   ├── users/                   # Authenticated trainee area
│   │   └── page.tsx
│   ├── api/
│   │   └── webhook/
│   │       └── clerk/
│   │           └── route.ts     # Clerk webhook handler
│   ├── globals.css              # Global styles (Tailwind, base styles)
│   ├── layout.tsx               # Root layout, fonts, Navbar, Footer
│   └── page.tsx                 # Root route (`/`)
│
├── public/                      # Static assets (logo, images, icons, manifest)
│   └── ...                      # e.g. `logo.png`, `favicon.ico`, `manifest.json`
│
├── src/
│   └── components/
│       └── Footer.tsx           # Global footer (contact info, back-to-top)
│
├── Navbar.tsx                   # Main navigation bar (top of every page)
├── middleware.ts                # Route protection and auth logic (Clerk)
├── eslint.config.mjs            # ESLint configuration
├── next.config.ts               # Next.js configuration
├── next-env.d.ts                # Next.js TypeScript types
├── postcss.config.mjs           # PostCSS configuration
├── tsconfig.json                # TypeScript configuration
├── package.json                 # Dependencies and scripts
├── package-lock.json            # Locked dependency versions
└── .env.local                   # Local environment variables (not committed)
```

---

## Tech stack

- **Framework**: Next.js (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Authentication**: Clerk (with webhook integration)
- **Data layer**: Supabase (classes, profiles, bookings) accessed from client components
- **Runtime**: Node.js, using Next.js API routes and middleware

---

## Getting started (development)

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Then open [Click here to visit the site](https://pilates-site-live-eosin.vercel.app) in your browser.
