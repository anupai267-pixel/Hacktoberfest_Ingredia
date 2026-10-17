# 🌿 Ingredia — Know What’s in Your Food

<p align="center">
  <img src="public/ingredia-logo.svg" alt="Ingredia Logo" width="110" />
</p>

<h3 align="center">Understand Every Ingredient. Make Informed Choices.</h3>

<p align="center">
  An AI-powered food transparency platform that turns complex food labels into clear, personalized insights.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-Ready-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/Node.js-Express-339933?logo=nodedotjs&logoColor=white" alt="Node.js and Express" />
  <img src="https://img.shields.io/badge/Groq-Qwen%203.8--27B-F55036?logo=groq&logoColor=white" alt="Groq AI with Qwen model" />
  <img src="https://img.shields.io/badge/Tests-Vitest-6E9F18?logo=vitest&logoColor=white" alt="Vitest" />
</p>

---

## ✨ What Is Ingredia?

Have you ever looked at a packaged food label and wondered what its ingredients actually mean?

**Ingredia makes food labels easier to understand.** It helps users explore ingredients, identify declared allergens, understand nutritional warning signs, and check products against their selected dietary preferences.

By combining a transparent rules engine, food product databases, automatic label OCR, and optional AI-generated explanations, Ingredia transforms complicated product information into understandable results.

> 🌱 **Our mission:** Make food information clearer, more accessible, and easier to understand.

## 🎯 The Problem

Packaged food labels can be difficult to interpret because of:

- Complex ingredient names and additive codes.
- Hidden or unfamiliar allergen terminology.
- Dense nutritional information.
- Difficulty checking products against personal dietary preferences.
- Incomplete product information that makes informed decisions harder.

## 💡 Our Solution

Ingredia brings these details together in one simple experience.

| Challenge | How Ingredia Helps |
|---|---|
| Complicated ingredient labels | Extracts text from uploaded food-label photos using OCR |
| Unfamiliar packaged products | Looks up available product information using barcodes and product databases |
| Allergen concerns | Checks declared ingredients and trace warnings against selected profiles |
| Confusing nutrition facts | Applies transparent nutritional screening rules |
| Difficult-to-understand results | Uses Groq-powered AI explanations when configured |
| Missing product information | Clearly identifies insufficient data instead of assuming unknown values are safe |

## 🔄 How It Works

1. **Scan or Upload** — Scan a supported product barcode or upload/capture a food-label image.
2. **Extract Information** — Retrieve available product data or use OCR to extract label text.
3. **Analyze the Product** — The deterministic rules engine evaluates the available ingredients, allergens, nutrition values, and selected dietary profile.
4. **Understand the Result** — View a `Suitable`, `Caution`, `Avoid`, or `Insufficient Data` classification.
5. **Get a Clear Explanation** — When Groq is available, the configured Qwen model explains the findings in simple language.

## 🌟 Key Features

### 📷 1. Automatic Food-Label OCR
- Extracts text from uploaded or captured label photos.
- Uses Tesseract.js for browser-based OCR.
- Applies image preprocessing to improve text recognition.
- Attempts to identify ingredients, declared allergens, trace warnings, and nutrition values.
- Designed to reduce manual data entry.

*OCR accuracy depends on image quality and label readability. Extracted information may require careful verification.*

### 🛒 2. Multi-Source Product Lookup
- Open Food Facts API v2 integration.
- Barcode-based product lookup.
- Curated Indian packaged-food data.
- Supplemental fixtures for testing edge cases.
- Clear handling of missing or unavailable product information.

### 🧠 3. Deterministic Food Analysis Engine
Ingredia uses a transparent TypeScript rules engine to classify products into four categories:

- 🟢 **Suitable** — No configured rule has identified a concern in the available data.
- 🟠 **Caution** — A warning or screening threshold requires attention.
- 🔴 **Avoid** — A configured rule has identified a conflict, such as a confirmed ingredient match for a selected allergy.
- ⚪ **Insufficient Data** — Available information is not enough to make a reliable assessment.

These are screening results based on available information, not guarantees of safety.

### 🤖 4. Groq-Powered AI Explanations
Ingredia uses Groq to generate plain-language explanations from the structured results of its rules engine.

- **Provider:** Groq
- **Configured model:** `qwen/qwen3.8-27b`
- **Backend:** Node.js and Express
- **API route:** `POST /api/ai/explain`
- **Fallback:** Deterministic explanations when AI is unavailable

The AI helps explain the findings; it does not decide whether a product is suitable or override the rules engine.

### 🥗 5. Personalized Dietary Profiles
Users can select supported preferences and screening needs, including:

- Food allergies.
- Lactose intolerance.
- Vegetarian or vegan preferences.
- Configured nutritional screening targets.

Results depend on the selected profile and the information available for each product.

### 🔐 6. Privacy and Data Management
- Server-side storage of the Groq API key.
- Optional Supabase authentication and PostgreSQL persistence.
- Row Level Security policies for supported user-owned records.
- Local-device storage when cloud functionality is not configured.
- JSON data export and data deletion features.

Actual privacy and access protections depend on the deployed configuration and correctly implemented security policies.

---

## 🛡️ Our Core Principle

<p align="center">
  <h3>RULES DECIDE. AI EXPLAINS.</h3>
</p>

Food-related screening should be transparent and predictable.

Ingredia uses deterministic rules for classification and optional AI for explanations. Unknown ingredient or nutrition data must not automatically be treated as safe, and AI-generated text must not replace the underlying analysis.

**Important:** Ingredia is an informational screening tool, not a medical diagnostic system. Always inspect the physical packaging, especially when managing serious food allergies. A `Suitable` result does not guarantee that a product is allergen-free.

## 🧰 Technology Stack

| Technology | Purpose |
|---|---|
| React 19 | Interactive user interface |
| TypeScript | Typed application logic |
| Vite | Development server and production build |
| Node.js + Express | Backend API |
| Groq + Qwen model | AI-generated explanations |
| Tesseract.js | Food-label OCR |
| Open Food Facts API | External product information |
| ZXing Browser | Barcode scanning |
| Supabase | Optional authentication and cloud persistence |
| Vitest | Automated tests |
| Lucide React | Interface icons |

## 🏗️ Project Structure

```text
ingredia/
├── public/
│   ├── ingredia-logo.svg
│   ├── ingredia-icon.svg
│   └── favicon.svg
├── server/
│   ├── index.js
│   ├── routes/
│   │   └── aiRoutes.js
│   └── services/
│       └── groqService.js
├── src/
│   ├── components/
│   │   └── ocr/
│   ├── data/
│   │   ├── indianPackagedFoods.ts
│   │   └── supplementalProducts.ts
│   ├── services/
│   │   ├── foodAnalysisEngine.ts
│   │   └── aiExplanationService.ts
│   └── pages/
├── server/.env.example
├── package.json
└── README.md
```

*This is an overview of the main project areas; individual files may vary as development continues.*

## 🚀 Getting Started

### Prerequisites

- Node.js and npm.
- Git.
- A modern web browser.
- A Groq API key for AI explanations (optional).

### 1. Clone the Repository

```bash
git clone https://github.com/nidheesha07/Hacktoberfest_Ingredia.git
cd Hacktoberfest_Ingredia
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure the Backend

Create a file named `server/.env` and add your own credentials:

```env
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=qwen/qwen3.8-27b
PORT=3001
```

**Important:** Confirm that `qwen/qwen3.8-27b` is available to your Groq account. If Groq reports that the model is unavailable, use a currently supported model ID from your Groq console.

Keep your real API key private. Never commit `server/.env` or place the secret in frontend environment variables.

If AI is not configured, the application can use its deterministic explanation fallback, provided the backend and fallback functionality are implemented and available.

### 4. Start the Backend

Open a terminal in the project root:

```bash
npm run server:dev
```

The backend should run at:

`http://localhost:3001`

### 5. Start the Frontend

Open a second terminal in the project root:

```bash
npm run dev
```

Open the local URL printed by Vite, typically:

`http://localhost:5173`

### 6. Run Tests and Build

Run the project's tests:

```bash
npm run test
```

Create a production build:

```bash
npm run build
```

## 🧪 Testing and Reliability

Ingredia is designed around explicit rules and predictable fallback behavior.

Testing should cover:

- Confirmed ingredient and allergen matches.
- Trace warnings and cross-contact notices.
- Nutritional threshold boundaries.
- Missing or incomplete product data.
- OCR extraction and parsing edge cases.
- AI failures and deterministic fallback behavior.
- API validation and error handling.

Run the commands above to verify the current codebase; the README does not itself guarantee that every test passes.

## 🔮 Future Enhancements

Potential directions for future development include:

- Improved multilingual label recognition.
- Better OCR confidence indicators and ingredient parsing.
- Expanded verified product coverage.
- More transparent explanations of individual screening rules.
- Additional accessibility improvements.
- Broader automated testing of edge cases and incomplete data.

## 🤝 Contributing

Contributions, feedback, and bug reports can help improve Ingredia.

1. Fork the repository.
2. Create a feature branch.
3. Make a focused change.
4. Run the available tests and production build.
5. Open a pull request with a clear description of your changes.

Please avoid committing secrets, private user data, or unverified claims about food products.

## 📚 Attribution

- [Groq](https://groq.com/) — AI inference platform.
- [Open Food Facts](https://world.openfoodfacts.org/) — Open food product database.
- [Tesseract.js](https://tesseract.projectnaptha.com/) — OCR engine.
- [ZXing Browser](https://github.com/zxing-js/browser) — Barcode decoding.
- [Supabase](https://supabase.com/) — Optional authentication and database services.
- [Lucide](https://lucide.dev/) — Interface icons.
- [Vitest](https://vitest.dev/) — Testing framework.

Review each dependency's license and attribution requirements when distributing the project.

---

<p align="center">
  🌿 <strong>Ingredia — Know What’s in Your Food.</strong>
  <br/>
  <em>Read the label. Understand the ingredients. Make informed choices.</em>
</p>
