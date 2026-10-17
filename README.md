
# 🌿 Ingredia — Know What’s in Your Food

**Ingredia** is a food ingredient transparency and safety intelligence platform that helps people understand packaged food ingredients, nutrition flags, allergen alerts, and dietary suitability.

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

Ingredia separates decision-making from explanation.

- **Rules decide:** Deterministic logic evaluates product information against defined criteria.
- **AI explains:** Optional AI-generated text helps users understand the results.
- **Transparency matters:** Results should be understandable and traceable to available information.

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
```

## 🚀 Getting Started

Follow these steps to run Ingredia locally.

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

```bash
npm run build
```

### 7. Check Available Scripts

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
