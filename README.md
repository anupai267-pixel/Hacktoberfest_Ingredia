<<<<<<< HEAD
# Ingredia — Know What’s in Your Food

[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61dafb.svg)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8-646cff.svg)](https://vite.dev/)
[![Tests](https://img.shields.io/badge/Tests-Vitest%20Passed-477A5B.svg)](https://vitest.dev/)

> **Ingredia** is a modern, transparent packaged-food safety intelligence platform. It helps consumers understand food ingredients, nutrition flags, allergen alerts, and dietary suitability using their chosen profile, verified live data, transparent deterministic rules, and optional AI-generated explanations.

---

## Core Engineering Principle

> **RULES DECIDE. AI EXPLAINS.**
> 
> In Ingredia, safety decisions are **never** left to a probabilistic language model. Allergen detection, cross-contact risk screening, and nutritional threshold evaluations are executed by a **deterministic, unit-tested TypeScript rule engine**. When an AI model is configured, it is strictly grounded in the rules engine’s output to explain findings in accessible language without overriding safety decisions or hallucinating ingredients.

---

## Key Features

1. **Brand Identity & Original SVG Assets**
   - Original apple/fruit silhouette with a green leaf, embedded barcode lines, and scanning brackets.
   - Vectors available as full brand mark (`public/ingredia-logo.svg`), compact icon (`public/ingredia-icon.svg`), and favicon (`public/favicon.svg`).
   - Clean, minimal, and premium design palette (`#FFF8F7` canvas, `#FFFFFF` surfaces, `#B03A67` primary berry, `#477A5B` suitable green, `#A66A16` caution amber, `#B63B48` avoid red).

2. **Real-Time Camera Barcode Scanner**
   - High-performance barcode detection powered by `@zxing/browser`.
   - Uses browser `navigator.mediaDevices.getUserMedia()` with automatic preference for rear-facing cameras on mobile devices (`facingMode: { ideal: "environment" }`).
   - Live reticle overlay, auto-stop on barcode detection, and robust cleanup of video tracks on component unmount.
   - Comprehensive error handling: permission denial, camera already in use, missing hardware, insecure contexts, and manual barcode input fallback.

3. **Open Food Facts Live API Integration**
   - Primary live packaged-food database source via `https://world.openfoodfacts.org/api/v2/`.
   - Proper client identification headers (`User-Agent: Ingredia - Web - Version 1.0`).
   - Strict unit normalization: converts sodium to milligrams (`mg`), handles salt-to-sodium stoichiometry ($1\text{g salt} \approx 400\text{mg sodium}$), standardizes reference basis (`per 100g`, `per 100ml`, or `serving`), and **never silently substitutes missing fields with zero**.

4. **Client-Side Food-Label Image OCR**
   - In-browser OCR extraction using `tesseract.js` for packaged items lacking barcodes.
   - Real-time progress indicators during OCR worker processing.
   - Regex-based heuristic parser separating ingredients, declared allergens, traces, sugars, saturated fat, sodium, and calories.
   - **Editable Review Form**: Users inspect and correct extracted text before triggering rule analysis.

5. **Deterministic Food Analysis Engine**
   - Four distinct verdicts: `Suitable`, `Caution`, `Avoid`, and `Insufficient Data`.
   - **Allergen Rules**: Confirmed ingredient match triggers immediate `Avoid`; trace / "may contain" warnings trigger `Caution` with prominent cross-contact notifications.
   - **Biological Distinction**: Accurately distinguishes immune-mediated milk protein allergy (casein/whey $\rightarrow$ Avoid) from digestive enzyme deficiency (lactose intolerance $\rightarrow$ Caution/Avoid).
   - **Prototype Screening Thresholds**: Screens sugars (> 12.5g caution, > 22.5g high), sodium (> 400mg caution, > 600mg high), and saturated fat (> 3.0g caution, > 5.0g high).
   - **Life-Stage & Health Context**: Surfaces contextual alerts for diabetes (elevated sugar flags) and pregnancy (unpasteurized/stimulant warnings) without making clinical diagnostic claims.

6. **Instant Demonstration Test Fixtures**
   - Built-in one-click test products covering every key edge case:
     - *Organic Rolled Oats* (Clean data, Suitable outcome)
     - *Hazelnut Cocoa Spread* (High sugar flag > 56g/100g)
     - *Greek Whole Milk Yogurt* (Milk allergen match)
     - *Crunchy Peanut Butter* (Peanut allergen match)
     - *70% Dark Chocolate* (Tree nut trace warning)
     - *Alpine Wild Herbal Infusion* (Missing ingredients & nutrition $\rightarrow$ Insufficient Data)
     - *Spicy Instant Ramen* (High sodium flag > 1700mg)
     - *Fruit Gummy Bears* (Beef gelatin $\rightarrow$ Vegan violation flag)

7. **Dual-Mode Persistence (Supabase + Local Prototype Mode)**
   - **Supabase Cloud**: Authenticated session management, PostgreSQL storage, and Row Level Security (RLS) policies guaranteeing that users can only select, insert, update, or delete their own profiles and scans.
   - **Local Prototype Mode**: When Supabase credentials are not supplied, Ingredia seamlessly operates locally using encrypted/sanitized browser storage with zero crashes, clear prototype banners, and complete privacy.

8. **User Privacy & Data Ownership**
   - Full data portability: one-click **JSON Data Export** containing the user's active preferences and full scan history.
   - One-click **Complete Data Deletion** purging all profile records and scan history from disk and memory.
   - Informed consent protocol on registration and onboarding.

---

## Project Structure

```
ingredia/
├── public/
│   ├── favicon.svg             # SVG browser favicon
│   ├── ingredia-icon.svg       # Compact brand mark (fruit + leaf + barcode + brackets)
│   └── ingredia-logo.svg       # Full brand logo with wordmark and tagline
├── src/
│   ├── components/
│   │   ├── auth/
│   │   │   └── ProtectedRoute.tsx     # Route authentication & onboarding guard
│   │   ├── common/
│   │   │   ├── NutritionMetricCard.tsx # Visual nutrient screening bar & threshold card
│   │   │   ├── SampleProductPicker.tsx # 1-click test fixture selector
│   │   │   └── VerdictBadge.tsx        # Status badge (Suitable, Caution, Avoid, Insufficient)
│   │   ├── layout/
│   │   │   ├── AppLayout.tsx           # Responsive shell (Navbar + Main + Footer)
│   │   │   ├── Footer.tsx              # Brand, links, and health disclaimer
│   │   │   └── Navbar.tsx              # Sticky desktop nav & mobile drawer
│   │   ├── ocr/
│   │   │   └── LabelUploadOCR.tsx      # Tesseract.js image OCR with editable review
│   │   └── scanner/
│   │       └── BarcodeScanner.tsx      # Real-time ZXing video barcode scanner
│   ├── context/
│   │   ├── AuthContext.tsx             # Supabase & demo mode authentication provider
│   │   └── ProfileContext.tsx          # User preferences & dietary profile provider
│   ├── data/
│   │   └── supplementalProducts.ts     # Curated scenario test dataset
│   ├── pages/
│   │   ├── DashboardPage.tsx           # Metrics, recent scans, profile summary
│   │   ├── HistoryPage.tsx             # Reverse-chronological scans, filtering, deletion
│   │   ├── LandingPage.tsx             # Homepage, visual workflow, feature highlights
│   │   ├── LoginPage.tsx               # Login with demo mode toggle
│   │   ├── NotFoundPage.tsx            # Clean 404 handler
│   │   ├── OnboardingPage.tsx          # 3-step profile personalization wizard
│   │   ├── ProductResultPage.tsx       # Safety, nutrition, rule explanation, AI summary
│   │   ├── ProfilePage.tsx             # Preference management
│   │   ├── ScanPage.tsx                # Camera scanner + manual barcode input
│   │   ├── SettingsPage.tsx            # Data export, account deletion, AI key setup
│   │   ├── SignupPage.tsx              # Account registration with informed consent
│   │   └── UploadLabelPage.tsx         # Label upload entry point
│   ├── services/
│   │   ├── aiExplanationService.ts     # Gemini API integration & template engine
│   │   ├── foodAnalysisEngine.ts       # Deterministic rules engine
│   │   ├── foodAnalysisEngine.test.ts  # Vitest unit test suite (10 test scenarios)
│   │   ├── historyService.ts           # Scan history data access
│   │   ├── openFoodFactsService.ts     # Live Open Food Facts API v2 client
│   │   ├── profileService.ts           # Profile data access
│   │   └── supabaseClient.ts           # Supabase client initializer
│   ├── styles/
│   ├── types/
│   │   ├── analysis.ts                 # Verdicts, flags, metrics, and history types
│   │   ├── product.ts                  # Normalized product schema and nutrition values
│   │   └── user.ts                     # User profile, allergens, and preferences types
│   ├── App.tsx                         # Router configuration
│   ├── index.css                       # Minimal & Premium design system tokens
│   └── main.tsx                        # React 19 application entrypoint
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql      # PostgreSQL tables, RLS policies, and indexes
├── .env.example                        # Configuration template
├── package.json                        # Dependencies and scripts
├── tsconfig.json                       # TypeScript compiler configuration
└── vite.config.ts                      # Vite & Vitest configuration
```

---

## Getting Started

### Prerequisites

- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher

### Installation

1. Clone or open the project folder:
   ```bash
   cd ingredia
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables (optional for local demo testing):
   ```bash
   cp .env.example .env
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```
   Open `http://localhost:5173` in your browser.

---

## Running Automated Tests

Run the Vitest test suite to verify the rule engine, allergen matching, trace handling, and unit normalization:

```bash
# Run all unit tests once
npm run test

# Run tests in watch mode
npm run test:watch
```

Run TypeScript compilation check:

```bash
npm run typecheck
```

Build for production:

```bash
npm run build
```

---

## Supabase Database Setup

To enable multi-user cloud authentication and persistent PostgreSQL storage:

1. Create a project at [supabase.com](https://supabase.com).
2. Navigate to **SQL Editor** in your Supabase dashboard.
3. Open `supabase/migrations/001_initial_schema.sql` and run the script. This creates:
   - `profiles` table with cascade delete on `auth.users(id)`
   - `scan_history` table with composite indexes
   - Row-Level Security (RLS) policies ensuring users can only read/write their own records.
4. Copy your project URL and anon public key from **Project Settings $\rightarrow$ API** into your `.env` file:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-actual-anon-key
   ```
5. Restart Vite (`npm run dev`).

*If you do not configure Supabase, Ingredia automatically runs in **Local Demo Mode** using browser localStorage.*

---

## Camera Permissions & Mobile Usage

- The barcode scanner uses `navigator.mediaDevices.getUserMedia()`.
- Modern browsers require **HTTPS** (or `localhost`) to access camera hardware.
- When prompted, grant camera permissions to the browser.
- If running on a mobile browser or testing over local Wi-Fi, serve Vite over HTTPS or test using `localhost`.
- If camera access is denied, Ingredia gracefully falls back to **Manual Barcode Entry** and **Image Label Upload**.

---

## Prototype Nutrition Screening Thresholds

The nutrition engine evaluates packaged foods against the following illustrative screening limits (per 100g/ml):

| Metric | Normal / Low | Caution Flag | High / Elevated Flag |
| :--- | :--- | :--- | :--- |
| **Sugars** | $\le 12.5\text{g}$ | $> 12.5\text{g}$ | $> 22.5\text{g}$ |
| **Sodium** | $\le 400\text{mg}$ | $> 400\text{mg}$ | $> 600\text{mg}$ |
| **Saturated Fat** | $\le 3.0\text{g}$ | $> 3.0\text{g}$ | $> 5.0\text{g}$ |

*Disclaimer: These thresholds are illustrative prototype reference values based on common consumer guidance. They do not constitute personalized medical advice or clinical limits.*

---

## License & Attribution

- **Open Food Facts API**: Open data published under the Open Database License (ODbL).
- **Icons**: [Lucide React](https://lucide.dev/) (ISC License).
- **OCR Engine**: [Tesseract.js](https://tesseract.projectnaptha.com/) (Apache-2.0 License).
- **Barcode Decoding**: [@zxing/browser](https://github.com/zxing-js/browser) (MIT License).
=======
# Hacktoberfest_Ingredia
>>>>>>> 09078a9740572f1b274297ff45cd9e171496e572
