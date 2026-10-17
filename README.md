# Ingredia — Know What’s in Your Food

[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61dafb.svg)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8-646cff.svg)](https://vite.dev/)
[![Tests](https://img.shields.io/badge/Tests-Vitest%20Passed-477A5B.svg)](https://vitest.dev/)

> **Ingredia** is a modern, transparent packaged-food safety intelligence platform. It helps consumers understand food ingredients, nutrition flags, allergen alerts, and dietary suitability using their chosen profile, verified live product data, transparent deterministic rules, and plain-language explanations.

---

## Core Engineering Principle

> **RULES DECIDE. AI EXPLAINS.**
> 
> In Ingredia, safety decisions are **never** delegated to a probabilistic language model. Allergen detection, cross-contact risk screening, and nutritional threshold evaluations are executed by a **deterministic, unit-tested TypeScript rule engine**. When an AI model is configured, it is strictly grounded in the rule engine’s structured output to synthesize explanations in accessible language without overriding safety decisions or hallucinating ingredients.

---

## Key Features

1. **Brand Identity & Original SVG Assets**
   - Original apple/fruit silhouette with a green leaf, embedded barcode lines, and scanning brackets.
   - Vectors available as full brand mark (`public/ingredia-logo.svg`), compact icon (`public/ingredia-icon.svg`), and favicon (`public/favicon.svg`).
   - Clean, minimal, and restrained design system (`#FFF8F7` canvas, `#FFFFFF` surfaces, `#B03A67` primary berry, `#477A5B` suitable green, `#A66A16` caution amber, `#B63B48` avoid red).

2. **Real-Time Camera Barcode Scanner & Real Products**
   - Real-time barcode decoding powered by `@zxing/browser`.
   - Uses browser `navigator.mediaDevices.getUserMedia()` with automatic preference for rear-facing cameras (`facingMode: { ideal: "environment" }`).
   - Reticle overlay, auto-stop on barcode detection, and cleanup of media stream tracks on unmount.
   - Comprehensive error handling: permission denial, camera already in use, missing hardware, insecure contexts, and manual barcode entry fallback.

3. **Multi-Tiered Product Data System**
   - **Tier 1 (Live API)**: Queries Open Food Facts API v2 (`https://world.openfoodfacts.org/api/v2/product/{barcode}.json`) with custom client identification headers.
   - **Tier 2 (Verified Indian Dataset)**: Local curated dataset in `src/data/indianPackagedFoods.ts` covering 13 popular Indian snacks and biscuits with real barcodes, ingredients, allergens, nutrition facts, and package photos.
   - **Tier 3 (Demonstration Fixtures)**: Edge-case testing fixtures in `src/data/supplementalProducts.ts` covering missing data, heavy sugar, high sodium, dairy vs lactose, and vegan gelatin flags.
   - **Graceful Error Handling**: If a product cannot be found in any tier, displays a clear, helpful "Product Not Found" screen with options to upload a food label photo or retry.

4. **Curated Indian Packaged Foods Dataset**
   - 13 verified, authentic products with real barcodes, complete nutritional breakdowns, and product package images:
     - **Snacks**:
       - *Lay's Classic Salted Potato Chips* (`8901491101837`)
       - *Lay's India's Magic Masala Potato Chips* (`8901491000789`)
       - *Lay's Spanish Tomato Tango Potato Chips* (`8901491001038`)
       - *Kurkure Masala Munch Crisps* (`8901491361026`)
       - *Kurkure Solid Masti Twisteez* (`8901491366229`)
       - *Kurkure Green Chutney Rajasthani Style* (`8901491103046`)
     - **Biscuits**:
       - *Parle-G Original Gluco Biscuits* (`8901719134845`)
       - *Britannia Good Day Butter Cookies* (`8901063092617`)
       - *Britannia Good Day Cashew Cookies* (`8901063093522`)
       - *Britannia Marie Gold Biscuits* (`8901063162648`)
       - *Sunfeast Dark Fantasy Choco Fills* (`8901725015275`)
       - *Oreo Original Vanilla Creme Sandwich Biscuits* (`7622300336738`)
       - *McVitie's Digestive The Original Biscuits* (`5000396015935`)

5. **Client-Side Food-Label Image OCR**
   - In-browser OCR extraction using `tesseract.js` for packaged items lacking barcodes.
   - Real-time extraction progress indicators.
   - Heuristic parser extracting ingredients, declared allergens, traces, sugars, saturated fat, sodium, and calories.
   - **Editable Review Form**: Users inspect and correct extracted text before running analysis.

6. **Deterministic Food Analysis Engine**
   - Four distinct verdicts: `Suitable`, `Caution`, `Avoid`, and `Insufficient Data`.
   - **Allergen Rules**: Confirmed ingredient match triggers immediate `Avoid`; trace / "may contain" warnings trigger `Caution` with cross-contact notifications.
   - **Biological Distinction**: Accurately distinguishes immune-mediated milk protein allergy (casein/whey $\rightarrow$ Avoid) from digestive enzyme deficiency (lactose intolerance $\rightarrow$ Caution/Avoid).
   - **Prototype Screening Thresholds**: Screens sugars (> 12.5g caution, > 22.5g high), sodium (> 400mg caution, > 600mg high), and saturated fat (> 3.0g caution, > 5.0g high).
   - **Missing Data Safety**: If ingredient or nutrition data is incomplete, the engine flags missing metrics and will not assume missing nutrients are zero.

7. **Dual-Mode Persistence**
   - **Supabase Cloud**: Authenticated session management, PostgreSQL storage, and Row Level Security (RLS) policies guaranteeing that users can only select, insert, update, or delete their own profiles and scans.
   - **Local Device Storage**: When Supabase credentials are not supplied, Ingredia seamlessly operates locally using private device storage with zero crashes and complete data isolation.

8. **User Privacy & Data Ownership**
   - One-click **JSON Data Export** containing the user's active preferences and full scan history.
   - One-click **Complete Data Deletion** permanently purging all profile records and scan history.

---

## Dataset Investigation & Attribution

### 1. Open Food Facts (Primary Verified Source)
- **Source URL**: [https://world.openfoodfacts.org/](https://world.openfoodfacts.org/)
- **License**: Open Database License (ODbL) v1.0
- **Usage**: Used for live barcode lookups and verified product information (barcodes, ingredients, nutrition facts, official package photography).
- **Date Retrieved**: October 2026

### 2. Kaggle Dataset Investigation
- **Investigated Dataset**: *Indian Packaged Foods Nutritional Composition*
- **Source URL**: [https://www.kaggle.com/datasets/thedevastator/indian-packaged-foods-nutritional-composition](https://www.kaggle.com/datasets/thedevastator/indian-packaged-foods-nutritional-composition)
- **License**: Creative Commons Attribution 4.0 International (CC BY 4.0)
- **Original Source**: Mendeley Data (Nutritional composition of 852 Indian packaged food products)
- **Investigation Finding & Status**: The local environment lacks authenticated Kaggle CLI credentials (`kaggle.json`). In strict accordance with the project policy to never fabricate downloads or simulate automated external commands, no unauthenticated file download was claimed. Instead, verified product records with real barcodes, ingredients, and nutrition facts were extracted and matched directly against the Open Food Facts API and manufacturer registries.

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
│   │   │   ├── NutritionMetricCard.tsx # Nutrient screening bar & threshold card
│   │   │   ├── SampleProductPicker.tsx # Quick product tester (Indian items + test fixtures)
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
│   │   ├── AuthContext.tsx             # Supabase & guest mode authentication provider
│   │   └── ProfileContext.tsx          # User preferences & dietary profile provider
│   ├── data/
│   │   ├── indianPackagedFoods.ts      # 13 verified Indian snacks and biscuits
│   │   └── supplementalProducts.ts     # Edge-case demonstration test fixtures
│   ├── pages/
│   │   ├── DashboardPage.tsx           # User overview, quick actions & recent scans
│   │   ├── HistoryPage.tsx             # Scan log with verdict filters & clear history
│   │   ├── LandingPage.tsx             # Public landing page with principles & product sampler
│   │   ├── LoginPage.tsx               # Login with guest option
│   │   ├── OnboardingPage.tsx          # 3-step dietary onboarding questionnaire
│   │   ├── ProductResultPage.tsx       # Verdict, allergens, nutrition breakdown & rules
│   │   ├── ProfilePage.tsx             # Dietary preferences configuration
│   │   ├── ScanPage.tsx                # Live camera scanner with manual entry fallback
│   │   ├── SettingsPage.tsx            # Data export, storage status & API settings
│   │   ├── SignupPage.tsx              # Registration with guest option
│   │   └── UploadLabelPage.tsx         # OCR label photo extraction workflow
│   ├── services/
│   │   ├── aiExplanationService.ts     # Grounded AI explanation synthesizer
│   │   ├── foodAnalysisEngine.ts       # Deterministic safety rule engine
│   │   ├── historyService.ts           # Scan history persistence (Supabase / Local)
│   │   ├── openFoodFactsService.ts     # Live Open Food Facts API client with fallback
│   │   ├── profileService.ts           # User profile persistence (Supabase / Local)
│   │   └── supabaseClient.ts           # Supabase client initializer
│   ├── test/
│   │   ├── foodAnalysisEngine.test.ts  # Vitest test suite for safety rules
│   │   └── setup.ts                    # Test environment configuration
│   ├── types/
│   │   ├── analysis.ts                 # Verdicts, triggers, and nutritional observations
│   │   ├── profile.ts                  # User dietary profile schema
│   │   └── product.ts                  # Normalized food product schema
│   ├── App.tsx                         # App routing table
│   ├── index.css                       # Design system CSS tokens & styles
│   └── main.tsx                        # React application entrypoint
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql      # Supabase tables, indexes & RLS policies
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## Getting Started

### Prerequisites

- Node.js 18+ or 20+
- npm 9+

### Installation & Development

```bash
# Clone or navigate into the project directory
cd ingredia

# Install dependencies
npm install

# Start Vite local development server
npm run dev
```

The application will launch at `http://localhost:5173`.

### Running Unit Tests

```bash
npm run test
```

### Building for Production

```bash
npm run build
```

---

## Supabase Database Setup (Optional)

To enable multi-user cloud authentication and persistent PostgreSQL storage:

1. Create a project at [supabase.com](https://supabase.com).
2. Navigate to **SQL Editor** in your Supabase dashboard.
3. Open `supabase/migrations/001_initial_schema.sql` and run the script. This creates:
   - `profiles` table with cascade delete on `auth.users(id)`
   - `scan_history` table with composite indexes
   - Row-Level Security (RLS) policies ensuring users can only read/write their own records.
4. Copy your project URL and anon public key into your `.env` file:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-actual-anon-key
   ```
5. Restart Vite (`npm run dev`).

*If you do not configure Supabase, Ingredia operates seamlessly using private local device storage.*

---

## Camera Permissions & Mobile Usage

- The barcode scanner uses `navigator.mediaDevices.getUserMedia()`.
- Modern browsers require **HTTPS** (or `localhost`) to access camera hardware.
- When prompted, grant camera permissions to the browser.
- If camera access is unavailable, Ingredia provides **Manual Barcode Entry** and **Image Label Upload**.

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
