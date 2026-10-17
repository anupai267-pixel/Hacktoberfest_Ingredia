<<<<<<< HEAD
# Ingredia — Know What’s in Your Food

[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61dafb.svg)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8-646cff.svg)](https://vite.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-Express%20Backend-green.svg)](https://nodejs.org/)
[![Groq](https://img.shields.io/badge/Groq-Llama%203.3-f55036.svg)](https://groq.com/)
[![Tests](https://img.shields.io/badge/Tests-Vitest%20Passed-477A5B.svg)](https://vitest.dev/)

> **Ingredia** is a modern, transparent packaged-food safety intelligence platform. It helps consumers understand food ingredients, nutrition flags, allergen alerts, and dietary suitability using their chosen profile, verified live product data, transparent deterministic rules, and optional Groq-powered AI explanations.
=======

# 🌿 Ingredia — Know What’s in Your Food

**Ingredia** is a food ingredient transparency and safety intelligence platform that helps people understand packaged food ingredients, nutrition flags, allergen alerts, and dietary suitability.
>>>>>>> f5d1b0e8c9bf2012e5776ae924b0aa7d3461bdb6

Our goal is to make food labels easier to understand so consumers can make more informed food choices.

## 🎯 Problem Statement

Packaged food labels often contain complex ingredient names and nutritional information. Consumers may find it difficult to identify allergens, understand nutritional concerns, and determine whether a product matches their dietary preferences.

## 💡 Our Solution

Ingredia simplifies food product information by combining user-selected dietary profiles, available product data, transparent rule-based analysis, and optional AI-generated explanations.

## ✨ Features

- 🥗 **Ingredient Analysis** — Helps users understand food ingredients.
- ⚠️ **Nutrition Flags** — Highlights relevant nutritional concerns.
- 🚨 **Allergen Alerts** — Identifies relevant allergens using available product information.
- 👤 **Personalized Profiles** — Supports analysis based on selected dietary preferences.
- ✅ **Dietary Suitability** — Evaluates products against supported dietary rules.
- 🔍 **Transparent Results** — Makes the reasoning behind classifications easier to understand.
- 🤖 **AI-Powered Explanations** — Optional AI assistance explains results in simple language.
- 💻 **Modern Interface** — Built to make food information easier to explore.

## 🧠 Core Engineering Principle

> **RULES DECIDE. AI EXPLAINS.**
<<<<<<< HEAD
> 
> In Ingredia, safety decisions are **never** delegated to a probabilistic language model. Allergen detection, cross-contact risk screening, and nutritional threshold evaluations are executed by a **deterministic, unit-tested TypeScript rule engine**. When Groq AI is configured, it is strictly grounded in the rule engine’s structured output to synthesize explanations in accessible language without overriding safety decisions or hallucinating ingredients.
=======
>>>>>>> f5d1b0e8c9bf2012e5776ae924b0aa7d3461bdb6

Ingredia separates decision-making from explanation.

- **Rules decide:** Deterministic logic evaluates product information against defined criteria.
- **AI explains:** Optional AI-generated text helps users understand the results.
- **Transparency matters:** Results should be understandable and traceable to available information.

<<<<<<< HEAD
1. **Brand Identity & Original SVG Assets**
   - Original apple/fruit silhouette with a green leaf, embedded barcode lines, and scanning brackets.
   - Vectors available as full brand mark (`public/ingredia-logo.svg`), compact icon (`public/ingredia-icon.svg`), and favicon (`public/favicon.svg`).
   - Clean, minimal, and restrained design system (`#FFF8F7` canvas, `#FFFFFF` surfaces, `#B03A67` primary berry, `#477A5B` suitable green, `#A66A16` caution amber, `#B63B48` avoid red).

2. **Secure Node.js / Express Backend with Groq AI**
   - Dedicated Express server (`server/`) with security headers, CORS origin verification, and request payload size limits.
   - `POST /api/ai/explain` route calling official Groq SDK (`groq-sdk`) using server-side credentials.
   - **Zero Secret Leakage**: The `GROQ_API_KEY` is maintained exclusively on the server and is never exposed to client bundles or browsers.
   - **Resilient Fallback**: If Groq is unconfigured, rate-limited, or unreachable, the system automatically falls back to deterministic rule synthesis with zero UI crashes.

3. **High-Performance Client-Side Food-Label OCR**
   - In-browser OCR extraction using `tesseract.js` for packaged items lacking barcodes.
   - **Offscreen Canvas Preprocessor**: Constrains large photos to optimal OCR dimensions (1600px max) and enhances contrast with grayscale normalization to prevent worker out-of-memory errors.
   - **Multi-Pass Regex Heuristics**: Accurately isolates multiline ingredients, declared allergens (`CONTAINS:`), traces (`MAY CONTAIN:`), and nutrition facts tables (distinguishing kcal from kJ).
   - **Raw Text Inspector**: Full OCR text viewer allowing users to inspect what was read and copy-paste unformatted ingredients into the review form.

4. **Multi-Tiered Product Data System**
   - **Tier 1 (Live API)**: Queries Open Food Facts API v2 (`https://world.openfoodfacts.org/api/v2/product/{barcode}.json`) with custom client identification headers.
   - **Tier 2 (Verified Indian Dataset)**: Local curated dataset in `src/data/indianPackagedFoods.ts` covering 13 popular Indian snacks and biscuits with real barcodes, ingredients, allergens, nutrition facts, and package photos.
   - **Tier 3 (Demonstration Fixtures)**: Edge-case testing fixtures in `src/data/supplementalProducts.ts` covering missing data, heavy sugar, high sodium, dairy vs lactose, and vegan gelatin flags.
   - **Graceful Error Handling**: If a product cannot be found in any tier, displays a clear, helpful "Product Not Found" screen with options to upload a food label photo or retry.

5. **Curated Indian Packaged Foods Dataset**
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

6. **Deterministic Food Analysis Engine**
   - Four distinct verdicts: `Suitable`, `Caution`, `Avoid`, and `Insufficient Data`.
   - **Allergen Rules**: Confirmed ingredient match triggers immediate `Avoid`; trace / "may contain" warnings trigger `Caution` with cross-contact notifications.
   - **Biological Distinction**: Accurately distinguishes immune-mediated milk protein allergy (casein/whey $\rightarrow$ Avoid) from digestive enzyme deficiency (lactose intolerance $\rightarrow$ Caution/Avoid).
   - **Prototype Screening Thresholds**: Screens sugars (> 12.5g caution, > 22.5g high), sodium (> 400mg caution, > 600mg high), and saturated fat (> 3.0g caution, > 5.0g high).
   - **Missing Data Safety**: If ingredient or nutrition data is incomplete, the engine flags missing metrics and will not assume missing nutrients are zero.

7. **Dual-Mode Persistence & Data Privacy**
   - **Supabase Cloud**: Authenticated session management, PostgreSQL storage, and Row Level Security (RLS) policies guaranteeing that users can only select, insert, update, or delete their own profiles and scans.
   - **Local Device Storage**: Operates locally using private device storage when Supabase is not configured.
   - **Data Portability & Purge**: One-click JSON data export and permanent data wipe.

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
├── server/
│   ├── .env.example            # Backend environment template (GROQ_API_KEY, PORT)
│   ├── index.js                # Express app entrypoint (CORS, security headers, health check)
│   ├── routes/
│   │   └── aiRoutes.js         # POST /api/ai/explain route handler
│   └── services/
│       └── groqService.js      # Groq SDK client with safety guardrails & error sanitization
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
│   │   │   └── LabelUploadOCR.tsx      # Tesseract.js image OCR with preprocessor & raw viewer
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
│   │   ├── SettingsPage.tsx            # Data export, storage status & privacy settings
│   │   ├── SignupPage.tsx              # Registration with guest option
│   │   └── UploadLabelPage.tsx         # OCR label photo extraction workflow
│   ├── services/
│   │   ├── aiExplanationService.ts     # Client service dispatching to backend Groq route
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
├── .env.example                        # Frontend environment template
├── .gitignore                          # Git ignore configuration protecting secrets
├── package.json
├── tsconfig.json
└── vite.config.ts                      # Vite configuration with /api backend proxy
=======
AI does not replace the rule-based decision-making system.

## 🛠️ Tech Stack

- **Frontend:** React
- **Language:** TypeScript
- **Development Tool:** Vite
- **Backend / Database:** Supabase, where configured
- **Database Migrations:** SQL
- **Code Quality:** ESLint / Oxlint

## 📁 Project Structure

```text
Hacktoberfest_Ingredia/
├── public/
├── src/
├── supabase/
│   └── migrations/
├── .env.example
├── .gitignore
├── .oxlintrc.json
├── index.html
├── package.json
├── package-lock.json
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── vite.config.ts
└── README.md
>>>>>>> f5d1b0e8c9bf2012e5776ae924b0aa7d3461bdb6
```

## 🚀 Getting Started

Follow these steps to run Ingredia locally.

<<<<<<< HEAD
### 1. Installation

```bash
# Navigate to project folder
cd ingredia

# Install frontend and backend dependencies
npm install
```

### 2. Configure Backend Groq AI (Optional)

Create a `server/.env` file with your Groq API credentials:

```bash
# Copy example template
cp server/.env.example server/.env
```

Edit `server/.env`:
```env
GROQ_API_KEY=your_actual_groq_api_key_here
GROQ_MODEL=llama-3.3-70b-versatile
PORT=3001
```

*(If you skip this step, Ingredia seamlessly uses its built-in deterministic rules engine explanation.)*

### 3. Start Development Servers

In terminal 1 (start the backend server):
```bash
npm run server:dev
```
The backend starts on `http://localhost:3001`.

In terminal 2 (start the Vite frontend):
```bash
npm run dev
```
The frontend launches at `http://localhost:5173`. Vite automatically proxies `/api` calls to the backend on port 3001.

### 4. Running Unit Tests

```bash
npm run test
```

### 5. Production Build
=======
### Prerequisites

Install the following:

- [Node.js](https://nodejs.org/)
- [Git](https://git-scm.com/)
- [Visual Studio Code](https://code.visualstudio.com/)

### 1. Clone the Repository

```bash
git clone https://github.com/nidheesha07/Hacktoberfest_Ingredia.git
```

### 2. Navigate to the Project

```bash
cd Hacktoberfest_Ingredia
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Configure Environment Variables

Check `.env.example` for the required environment variables.

Create a local `.env` file if required and configure the necessary credentials for the services you use.

**Never upload private API keys, passwords, or secrets to GitHub.**

### 5. Start the Development Server

```bash
npm run dev
```

Open the local URL displayed in your terminal.

### 6. Build for Production
>>>>>>> f5d1b0e8c9bf2012e5776ae924b0aa7d3461bdb6

```bash
npm run build
```

### 7. Check Available Scripts

<<<<<<< HEAD
## License & Attribution

- **Groq SDK**: [groq-sdk](https://github.com/groq/groq-typescript) (Apache-2.0 License).
- **Open Food Facts API**: Open data published under the Open Database License (ODbL).
- **Icons**: [Lucide React](https://lucide.dev/) (ISC License).
- **OCR Engine**: [Tesseract.js](https://tesseract.projectnaptha.com/) (Apache-2.0 License).
- **Barcode Decoding**: [@zxing/browser](https://github.com/zxing-js/browser) (MIT License).
=======
Open `package.json` to see the available scripts for linting and testing.

## 🔄 How It Works

1. **Select a Profile** — Choose relevant dietary preferences or restrictions.
2. **Provide Product Information** — Use the product information supported by the application.
3. **Analyze Ingredients** — Apply defined rules to the available information.
4. **Identify Concerns** — Display relevant nutrition flags and allergen alerts.
5. **Explain Results** — Present understandable insights, with optional AI-generated explanations.
6. **Make Informed Choices** — Review the information before deciding whether a product is suitable.

The actual results depend on the available product data and the rules implemented in the application.

## 🛡️ Safety and Transparency

- Product information may be incomplete or inaccurate.
- Allergen alerts depend on the available product information.
- No alert does not guarantee that a product is allergen-free.
- Dietary suitability results depend on the selected profile and implemented rules.
- Always verify packaging and manufacturer information, especially when managing serious food allergies.

Ingredia is intended to support informed food choices and is not a replacement for professional medical advice.

## 🌱 Future Enhancements

- Barcode-based product lookup.
- Expanded verified food product databases.
- Ingredient explanations.
- Personalized dietary preferences.
- Product comparison tools.
- Improved accessibility and mobile experience.
- Expanded automated testing.

These are potential improvements and may not be available in the current version.

## 🤝 Contributing

Contributions that improve the project's functionality, reliability, accessibility, and transparency are welcome.

1. Fork the repository.
2. Create a feature branch.
3. Make your changes.
4. Test your changes.
5. Commit your changes.
6. Submit a pull request.

## 📄 License

A license has not yet been specified. Add a `LICENSE` file when the project's licensing terms have been decided.

## 🌍 Our Vision

We aim to make understanding food labels simpler, clearer, and more transparent through reliable rules, available product information, and understandable explanations.

---

**Ingredia — Know What’s in Your Food. 🌿**
>>>>>>> f5d1b0e8c9bf2012e5776ae924b0aa7d3461bdb6
