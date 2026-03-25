# Jaxfr (TyWebAppV4)

A modern, pragmatic Content and Admin Management System built with Angular 20 and Supabase. Designed from the ground up with a relentless focus on clean UX, responsive layouts, and maintainable code architecture.


## Tech Stack

* **Frontend:** Angular 20 (Strict Mode, Standalone Components, Signals)
* **UI Framework:** Angular Material 16+ (MDC-based)
* **Backend & Auth:** Supabase (PostgreSQL)
* **Styling:** SCSS (CSS Variables, Flexbox, Edge-to-Edge Mobile UI)

## Core Features

### 1. Modern Article Feed
* **Immersive Reading:** A Threads/Facebook-style dynamic feed optimized for both desktop and mobile.
* **Smart Edge-to-Edge UI:** Mobile views automatically strip unnecessary margins to maximize content space.
* **Stateful Navigation:** Smooth scroll restoration and session memory when returning from the Edit page.

### 2. Enterprise-Grade Admin Panel
* **Pragmatic Layout:** Fixed sticky top-navbar with a high-priority Z-index sidebar for intuitive, non-obstructive navigation.
* **High-Performance Data Tables:** Client-side pagination, real-time keyword filtering, and instant CSV exporting.
* **Optimistic UI:** Forms instantly load cached data for zero-latency display while fetching fresh updates in the background.
* **Smart Auto-fill:** Custom text extraction tool that automatically parses raw article text into structured forms.

### 3. System Modules
* `Articles` (Feed display, CRUD, Export)
* `Users` (Role-based data, Display Name Pipes)
* `App Logs` (Versioning, Datepicker integrations, strict Autocomplete)
* `Categories & Functions` (System settings mapping)

## Local Development Setup

### 1. Prerequisites
* Node.js (v18 or higher recommended)
* Angular CLI (`npm install -g @angular/cli`)

### 2. Installation
Clone the repository and install dependencies:

bash
npm install

### 3. Environment Configuration
Create an environment.development.ts (and environment.ts for production) in src/environments/ and add your Supabase credentials:

export const environment = {
  supabaseUrl: 'YOUR_SUPABASE_URL',
  supabaseKey: 'YOUR_SUPABASE_ANON_KEY'
};

### 4. Serve
Start the local development server:

Bash
ng serve
Navigate to http://localhost:4200/. The app will automatically reload if you change any of the source files.

## Deployment
This project is fully optimized for production. To build the artifacts:

Bash
ng build

The compiled files will be generated in the dist/ directory, ready to be hosted on platforms like Vercel, Firebase Hosting, or Cloudflare Pages.