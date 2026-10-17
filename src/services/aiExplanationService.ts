import type { AnalysisResult } from '../types/analysis';
import type { NormalizedProduct } from '../types/product';

/**
 * Generates an articulate, transparent, rules-grounded explanation
 * without needing an external API key.
 */
export function generateTemplateExplanation(
  analysis: AnalysisResult,
  _product?: NormalizedProduct
): string {
  const parts: string[] = [];

  // 1. Verdict Statement
  if (analysis.verdict === 'avoid') {
    parts.push(
      `⚠️ **Avoid Recommended**: This product is classified as **Avoid** because it contains confirmed allergen(s) matching your profile: **${analysis.matchedAllergens.join(', ')}**.`
    );
  } else if (analysis.verdict === 'insufficient_data') {
    parts.push(
      `ℹ️ **Insufficient Data**: We cannot evaluate suitability because critical ingredient declarations or nutrition values were not available for this item.`
    );
  } else if (analysis.verdict === 'caution') {
    parts.push(
      `⚡ **Caution Advised**: While no direct confirmed allergen conflict was found, several factors warrant your attention.`
    );
  } else {
    parts.push(
      `✅ **Suitable**: Based on your configured dietary preferences, no conflicting allergens or high-concern ingredients were detected in this product.`
    );
  }

  // 2. Allergen Details
  if (analysis.matchedAllergens.length > 0) {
    parts.push(
      `• **Allergen Alert**: Detected "${analysis.ingredientsOfConcern.join(', ')}", which triggers your declared allergy for ${analysis.matchedAllergens.join(', ')}. Strict avoidance is recommended.`
    );
  }

  // 3. Trace / Cross-contact warnings
  if (analysis.matchedTraces.length > 0) {
    parts.push(
      `• **Cross-Contact Risk**: The manufacturer declares potential facility contact or traces of **${analysis.matchedTraces.join(', ')}**. If you have severe anaphylactic sensitivity, caution is strongly advised.`
    );
  }

  // 4. Dietary & Preference Observations
  const dietaryFlags = analysis.flags.filter(f => f.category === 'dietary');
  if (dietaryFlags.length > 0) {
    const list = dietaryFlags.map(f => f.description).join(' ');
    parts.push(`• **Dietary Notes**: ${list}`);
  }

  // 5. Nutritional Observations
  const highNut = analysis.nutritionalObservations.filter(n => n.status === 'high');
  if (highNut.length > 0) {
    const nutDetails = highNut
      .map(n => `${n.metric} (${n.value}${n.unit} / ${n.basis})`)
      .join(', ');
    parts.push(
      `• **Nutrition Flags**: Exceeds standard prototype screening thresholds for ${nutDetails}.`
    );
  }

  // 6. Missing Data & Safety Notice
  if (analysis.missingDataNotes.length > 0) {
    parts.push(`• **Data Completeness**: ${analysis.missingDataNotes.join(' ')}`);
  }

  parts.push(
    `*Always verify physical packaging before consuming, as manufacturing lines and formulations may change.*`
  );

  return parts.join('\n\n');
}

/**
 * Optional Gemini API Integration for enhanced natural language explanation.
 * Strictly constrained: AI is grounded on the rules output and cannot change the verdict.
 */
export async function requestAIExplanation(
  analysis: AnalysisResult,
  product: NormalizedProduct,
  customApiKey?: string
): Promise<{ text: string; source: 'gemini' | 'template' }> {
  const apiKey = customApiKey || import.meta.env.VITE_GEMINI_API_KEY;

  if (!apiKey || apiKey === 'your-gemini-key-here') {
    return {
      text: generateTemplateExplanation(analysis, product),
      source: 'template',
    };
  }

  const prompt = `
You are Ingredia's food safety explanation assistant.
Explain the following food safety verdict to the user in a calm, clear, and reassuring tone.

CRITICAL RULES:
1. THE RULES ENGINE HAS ALREADY DETERMINED THE VERDICT: "${analysis.verdict.toUpperCase()}".
2. DO NOT OVERRIDE OR CHANGE THIS VERDICT.
3. DO NOT FABRICATE OR GUESS INGREDIENTS.
4. Keep the explanation under 150 words.
5. Provide a simple explanation of what triggered the verdict and what ingredients were flagged.

Product: ${product.name} (${product.brand || 'Brand not specified'})
Verdict: ${analysis.verdict}
Triggered Rules: ${analysis.triggeredRules.join(', ')}
Matched Allergens: ${analysis.matchedAllergens.join(', ') || 'None'}
Matched Traces: ${analysis.matchedTraces.join(', ') || 'None'}
Ingredients of Concern: ${analysis.ingredientsOfConcern.join(', ') || 'None'}
Missing Data Notes: ${analysis.missingDataNotes.join(', ') || 'None'}
`;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 300,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const candidate = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (candidate) {
      return {
        text: candidate.trim(),
        source: 'gemini',
      };
    }
  } catch (e) {
    console.warn('AI generation failed, using template explanation:', e);
  }

  return {
    text: generateTemplateExplanation(analysis, product),
    source: 'template',
  };
}
