# Pilates Studio Management System

A comprehensive web application built with Next.js, designed for a professional Pilates studio. This platform serves as both a public-facing website for potential clients and a robust management system for studio owners and trainees.

---

## 🧘‍♂️ About the Project

This project provides an end-to-end solution for a Pilates studio:

**- Marketing & Branding:** Public pages for pricing, studio information, and contact.
**- Trainee Management:** A dedicated system to manage user profiles and trainee data.
**- Class Registration:** A dynamic system for viewing and booking Pilates classes.
**- Admin Dashboard:** A private area for studio owners to oversee the business.
**- Secure Authentication:** Integrated with Clerk for robust user management and webhooks.

---

## 📂 Project Structure

```
pilates-studio/
├── app/                        # Main Application Logic & Routes
│   ├── (public pages)/         # Marketing and Info pages:
│   │   ├── home/               # Custom landing page layout
│   │   ├── about/              # Studio story and instructor bios
│   │   ├── pricing/            # Membership plans and class packages
│   │   ├── contact/            # Inquiry form and location details
│   │   ├── accessibility/      # Accessibility statement (Legal requirement)
│   │   ├── admin/              # Studio Owner Dashboard (Management tools)
│   │   ├── classes/            # Class Catalog & Registration system
│   │   └── users/               # Trainee profiles and personal dashboards
│   │
│   ├── api/webhook/clerk/      # Backend logic for Clerk Auth synchronization
│   │
│   ├── layout.tsx              # Root layout (Navigation, Footer, Providers)
│   ├── page.tsx                # Application entry page (Redirects or Hero)
│   └── globals.css             # Global styling and Tailwind directives
│
├── public/                     # Static assets (Logos, Icons, Images)
├── src/                        # Shared resources and logic
│   └── footer.tsx              # Global footer component (Contact info, Links)
│
├── Navbar.tsx                  # Main navigation component (Root level)
├── middleware.ts               # Route protection & Auth logic
├── .env.local                  # Environment variables
└── package.json                # Project dependencies

```
---

## 🛠 Tech Stack

***- Framework:** Next.js (App Router)
**- Authentication:** Clerk (User management & Webhooks)
**- Language:** TypeScript
**- Styling:** Tailwind CSS
**- Backend:** Next.js API Routes (Serverless)
