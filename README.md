# WE the Leader - Membership Registration Application

Official mobile-first web application for **WE the Leader**, Kinathukadavu, Coimbatore, Tamil Nadu, India.

> **Official Tagline:** LEAD THE CHANGE  
> **Brand Palette:** Primary Navy `#20223E` | Primary Green `#91BD32` | Secondary Orange `#E98A32` | Secondary Blue `#2878B9` | Background `#F5F7FA` | White `#FFFFFF`

---

## 🌟 Key Features

1. **Mobile-First PWA (Progressive Web App):**
   - Installable on Android phones, iPhones, tablets, and desktops.
   - Fast, touch-friendly inputs, zero lag.

2. **Full Bilingual Support (English & தமிழ்):**
   - Instant header language switcher.
   - Comprehensive translation for all pages, buttons, form validations, confirmation cards, and admin dashboard.
   - Uses **Noto Sans Tamil** for crisp Tamil rendering on all devices.
   - Remembers user's language choice.

3. **Public 1-Minute Member Registration:**
   - No login, no OTP, no payment gateway required.
   - **Mandatory Fields:** Full Name, Mobile Number (10 digits).
   - **Optional Fields:** Date of Birth, Gender, Residential Address, Village Name, Ward Number, Occupation, Voter ID, Aadhaar Number, Profile Photo.
   - **Location:** District defaults to and displays as **Coimbatore**. Village Name and Ward Number are direct free-text fields (supports Tamil and English names, no rigid dropdowns or master data needed).
   - Voluntary consent checkbox and duplicate submission prevention.

4. **Atomic Membership Sequence Number:**
   - Format: `WTL-YYYY-XXXXX` (e.g., `WTL-2026-00001`, `WTL-2026-00002`).
   - Increments sequence per calendar year.
   - Generated via atomic PostgreSQL transaction/function `generate_next_membership_number()` with persistent fallback.

5. **Official Registration Confirmation & ID Card:**
   - Displays official logo, full name, membership number, village, ward, district, and date.
   - **Download Confirmation PDF** button (generates print-ready PDF certificate).
   - **Print Confirmation** button (formatted for printing).
   - **Copy Membership Number** button with instant feedback.
   - Sensitive identification (Aadhaar, Voter ID) strictly excluded from confirmation card.

6. **Single Admin Portal:**
   - Secure login using email and password (`admin@wetheleader.org` / `admin123` or cloud Supabase Auth).
   - Exactly one admin account — no complex permissions or unnecessary roles.

7. **Admin Dashboard (Dynamic Statistics):**
   - 1. Total Registered Members
   - 2. Today's Registrations
   - 3. This Month's Registrations
   - 4. Total Unique Villages (calculated dynamically from member records)
   - 5. Total Unique Wards (calculated dynamically from member records)
   - Recent registrations list.

8. **Member Management (Responsive Table & Mobile Cards):**
   - Desktop wide table and mobile-friendly card layout.
   - Global search by Name, Mobile, or Membership ID (bilingual Tamil & English).
   - Filters by Village, Ward, District, Date, and Year.
   - Full Profile Modal (with protected view for Voter ID & masked Aadhaar).
   - Add new member manually.
   - Edit member details.
   - Delete member with confirmation.

9. **Excel Export & Reports:**
   - Downloads official `.xlsx` files using SheetJS with full UTF-8 Unicode support for Tamil characters.
   - Options: All Members, Village-wise Summary, Ward-wise Summary, Monthly Report, Yearly Report.
   - Aadhaar numbers strictly excluded from exports to protect member privacy.

10. **Supabase PostgreSQL & Dual Storage:**
    - Complete SQL schema in `supabase/schema.sql` with Row Level Security (RLS) policies.
    - Connects directly to Supabase when environment variables are supplied.
    - Built-in persistent fallback guarantees the application works immediately out-of-the-box.

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js (v18+)

### 2. Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Production Build
```bash
npm run build
npm run preview
```

---

## 🔐 Admin Credentials

- **Email:** `admin@wetheleader.org`
- **Password:** `admin123`

---

## 🗄️ Supabase PostgreSQL Setup

1. Create a project at [supabase.com](https://supabase.com).
2. Go to the **SQL Editor** tab in your Supabase dashboard.
3. Paste and run the entire script from `supabase/schema.sql`.
4. Copy your project URL and anon public key from Project Settings > API.
5. Create a `.env` file in the project root:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-public-key
   ```
6. Restart the development server. The app will automatically connect to your cloud database!
