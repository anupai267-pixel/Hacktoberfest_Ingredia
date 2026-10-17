# 🌿 Ingredia — Know What’s in Your Food

[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61dafb.svg)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8-646cff.svg)](https://vite.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-Express%20Backend-green.svg)](https://nodejs.org/)
[![Groq](https://img.shields.io/badge/Groq-Llama%203.3-f55036.svg)](https://groq.com/)
[![Tests](https://img.shields.io/badge/Tests-Vitest%20Passed-477A5B.svg)](https://vitest.dev/)

> **Ingredia** is a food ingredient transparency and safety intelligence platform that helps people understand packaged food ingredients, nutrition flags, allergen alerts, and dietary suitability using user-selected dietary profiles, available product data, transparent deterministic rules, and optional Groq-powered AI explanations.

---

## 🎯 Problem Statement

Packaged food labels often contain complex ingredient names, cryptic additive codes, and dense nutritional tables. Consumers find it difficult to identify allergens, understand nutritional thresholds, and determine whether a product matches their dietary preferences or medical requirements.

---

## 💡 Our Solution

Ingredia simplifies food product information by combining:
1. **User-Selected Dietary Profiles**: Custom allergies, lactose intolerance, vegan/vegetarian preferences, and health screening targets.
2. **Multi-Source Product Data**: Live Open Food Facts API v2, curated verified Indian packaged goods dataset, and automated food label OCR.
3. **Deterministic Rules Engine**: Unit-tested, rule-based classification into `Suitable`, `Caution`, `Avoid`, and `Insufficient Data`.
4. **Grounded AI Explanations**: Server-side Groq AI generating plain-language summaries strictly grounded in the rules engine's findings.

---

## 🧠 Core Engineering Principle

> **RULES DECIDE. AI EXPLAINS.**
> 
> In Ingredia, safety decisions are **never** delegated to a probabilistic language model. Allergen detection, cross-contact risk screening, and nutritional threshold evaluations are executed by a **deterministic, unit-tested TypeScript rule engine**. When Groq AI is configured, it is strictly grounded in the rule engine’s structured output to synthesize explanations in accessible language without overriding safety decisions or hallucinating ingredients.

---

## ✨ Key Features

1. **Brand Identity & Original SVG Assets**
   - Original apple/fruit silhouette with a green leaf, embedded barcode lines, and scanning brackets.
   - Vectors available as full brand mark (`public/ingredia-logo.svg`), compact icon (`public/ingredia-icon.svg`), and favicon (`public/favicon.svg`).
   - Clean, minimal, and restrained design system (`#FFF8F7` canvas, `#FFFFFF` surfaces, `#B03A67` primary berry, `#477A5B` suitable green, `#A66A16` caution amber, `#B63B48` avoid red).

2. **Secure Node.js / Express Backend with Groq AI**
   - Dedicated Express server (`server/`) with security headers, CORS origin verification, and request payload size limits.
   - `POST /api/ai/explain` route calling official Groq SDK (`groq-sdk`) using server-side credentials.
   - **Zero Secret Leakage**: The `GROQ_API_KEY` is maintained exclusively on the server and is never exposed to client bundles or browsers.
   - **Resilient Fallback**: If Groq is unconfigured, rate-limited, or unreachable, the system automatically falls back to deterministic rule synthesis with zero UI crashes.

3. **Fully Automatic Food-Label OCR**
   - Instant in-browser OCR extraction using `tesseract.js` for packaged items lacking barcodes.
   - **Zero Manual Data Entry**: Upload or capture a label photo, and the app automatically extracts, structures, analyzes, and displays results without requiring manual typing or confirmation forms.
   - **Offscreen Canvas Preprocessor**: Constrains large photos to optimal OCR dimensions (1600px max) and enhances contrast with grayscale normalization to prevent worker out-of-memory errors.
   - **Multi-Pass Regex Heuristics**: Accurately isolates multiline ingredients, declared allergens (`CONTAINS:`), traces (`MAY CONTAIN:`), and nutrition facts tables (distinguishing kcal from kJ).

4. **Multi-Tiered Product Data System**
   - **Tier 1 (Live API)**: Queries Open Food Facts API v2 (`https://world.openfoodfacts.org/api/v2/product/{barcode}.json`) with custom client identification headers.
   - **Tier 2 (Verified Indian Dataset)**: Local curated dataset in `src/data/indianPackagedFoods.ts` covering 13 popular Indian snacks and biscuits with real barcodes, ingredients, allergens, nutrition facts, and package photos.
   - **Tier 3 (Demonstration Fixtures)**: Edge-case testing fixtures in `src/data/supplementalProducts.ts` covering missing data, heavy sugar, high sodium, dairy vs lactose, and vegan gelatin flags.
   - **Graceful Error Handling**: If a product cannot be found in any tier, displays a clear, helpful "Product Not Found" screen with options to upload a food label photo or retry.

5. **Curated Indian Packaged Foods Dataset**
   - 13 verified, authentic products with real barcodes, complete nutritional breakdowns, and product package images:
     - **Snacks**: Lay's Classic Salted (`8901491101837`), Lay's Magic Masala (`8901491000789`), Lay's Spanish Tomato Tango (`8901491001038`), Kurkure Masala Munch (`8901491361026`), Kurkure Solid Masti (`8901491366229`), Kurkure Green Chutney (`8901491103046`).
     - **Biscuits**: Parle-G (`8901719134845`), Britannia Good Day Butter (`8901063092617`), Britannia Good Day Cashew (`8901063093522`), Britannia Marie Gold (`8901063162648`), Sunfeast Dark Fantasy (`8901725015275`), Oreo Original (`7622300336738`), McVitie's Digestive (`5000396015935`).

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

## 🚀 Getting Started

Follow these steps to run Ingredia locally.

### 1. Installation

```bash
# Navigate to project folder
cd ingredia

# Install dependencies
npm install
```

### 2. Configure Backend Groq AI (Optional)

Create a `server/.env` file with your Groq API credentials:

```bash
cp server/.env.example server/.env
```

Edit `server/.env`:
```env
GROQ_API_KEY=your_actual_groq_api_key_here
GROQ_MODEL=llama-3.3-70b-versatile
PORT=3001
```

*(If no Groq key is configured, Ingredia seamlessly uses its built-in deterministic rules explanation.)*

### 3. Start Development Servers

Start the backend server:
```bash
npm run server:dev
```
The backend runs on `http://localhost:3001`.

In a second terminal, start Vite frontend:
```bash
npm run dev
```
The frontend launches at `http://localhost:5173`. Vite automatically proxies `/api` calls to the backend.

### 4. Running Unit Tests

```bash
npm run test
```

### 5. Production Build

```bash
npm run build
```

---

## 🛡️ Safety and Transparency

- Product information may be incomplete or subject to manufacturer reformulations.
- Allergen alerts depend on the available product information.
- A "Suitable" verdict does not guarantee that a product is 100% allergen-free.
- Dietary suitability results depend on the selected profile and implemented rules.
- Always inspect physical packaging before consuming, especially when managing life-threatening food allergies.
- Ingredia is intended to support informed food choices and is not a replacement for professional clinical or medical advice.

---

## 📄 License & Attribution

- **Groq SDK**: [groq-sdk](https://github.com/groq/groq-typescript) (Apache-2.0 License).
- **Open Food Facts API**: Open data published under the Open Database License (ODbL).
- **Icons**: [Lucide React](https://lucide.dev/) (ISC License).
- **OCR Engine**: [Tesseract.js](https://tesseract.projectnaptha.com/) (Apache-2.0 License).
- **Barcode Decoding**: [@zxing/browser](https://github.com/zxing-js/browser) (MIT License).

---

**Ingredia — Know What’s in Your Food. 🌿**
