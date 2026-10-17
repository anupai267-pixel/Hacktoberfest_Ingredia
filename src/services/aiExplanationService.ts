import type { AnalysisResult } from '../types/analysis';
import type { NormalizedProduct } from '../types/product';
import { supabase, isSupabaseConfigured } from './supabaseClient';

export interface AIExplanationResult {
  text: string;
  source: 'groq' | 'gemini' | 'template';
  modelUsed?: string;
}

export interface AIExplanationResult {
  text: string;
  source: 'groq' | 'template';
  model?: string;
}

/**
 * Generates an articulate, transparent, rules-grounded explanation
 * without needing an external API key.
 *
 * This function acts as the deterministic fallback whenever:
 * 1. Supabase is not configured (e.g. offline or local demo mode)
 * 2. The Groq API key is not configured on the Supabase Edge Function
 * 3. Network or rate limit errors occur
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
<<<<<<< HEAD
 * Requests an AI explanation from the secure backend Groq service.
 * 
 * Safety & Security Guarantees:
 * - Groq API key is strictly maintained on the server and never sent to the browser.
 * - The deterministic rules engine verdict is never overridden.
 * - If the backend server is offline or Groq is unconfigured/rate-limited,
 *   the system automatically falls back to the deterministic template explanation.
=======
 * Requests an AI explanation from the secure Supabase Edge Function (`ingredia-ai`),
 * powered by Groq and open-weight models (default: openai/gpt-oss-20b).
 *
 * Strict safety principle:
 * The rules engine ALREADY computed the verdict. The AI only articulates the findings
 * without overriding verdicts, hallucinating ingredients, or making clinical claims.
 *
 * Falls back gracefully to `generateTemplateExplanation()` if Supabase is unconfigured,
 * or if the Edge Function encounters any error.
>>>>>>> f5d1b0e8c9bf2012e5776ae924b0aa7d3461bdb6
 */
export async function requestAIExplanation(
  analysis: AnalysisResult,
  product: NormalizedProduct
): Promise<AIExplanationResult> {
<<<<<<< HEAD
  const apiBase = import.meta.env.VITE_API_URL || '';
  const endpoint = `${apiBase}/api/ai/explain`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        product: {
          name: product.name,
          brand: product.brand,
          ingredientsText: product.ingredientsText,
          declaredAllergens: product.declaredAllergens,
          traceWarnings: product.traceWarnings,
        },
        analysis: {
          verdict: analysis.verdict,
          verdictReason: analysis.verdictReason,
          triggeredRules: analysis.triggeredRules,
          matchedAllergens: analysis.matchedAllergens,
          matchedTraces: analysis.matchedTraces,
          ingredientsOfConcern: analysis.ingredientsOfConcern,
          nutritionalObservations: analysis.nutritionalObservations,
          missingDataNotes: analysis.missingDataNotes,
        },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      if (data.success && data.text) {
        return {
          text: data.text,
          source: 'groq',
          model: data.model,
        };
      }
    }
  } catch (error) {
    // Expected when backend server is not running or timeout occurs: silent fallback
    console.info('Backend Groq explanation unavailable, using deterministic rules synthesis.');
=======
  // If Supabase is not configured (e.g. running in local demo mode), fallback immediately
  if (!isSupabaseConfigured || !supabase) {
    return {
      text: generateTemplateExplanation(analysis, product),
      source: 'template',
    };
  }

  try {
    const { data, error } = await supabase.functions.invoke('ingredia-ai', {
      body: {
        product: {
          name: product.name,
          brand: product.brand,
        },
        analysis: {
          verdict: analysis.verdict,
          matchedAllergens: analysis.matchedAllergens,
          matchedTraces: analysis.matchedTraces,
          ingredientsOfConcern: analysis.ingredientsOfConcern,
          triggeredRules: analysis.triggeredRules,
          missingDataNotes: analysis.missingDataNotes,
          nutritionalObservations: analysis.nutritionalObservations
            .filter(n => n.status === 'high' || n.status === 'moderate')
            .map(n => `${n.metric}: ${n.value ?? ''}${n.unit} (${n.status})`),
        },
      },
    });

    if (error) {
      console.warn('Supabase Edge Function returned an error, falling back to template explanation:', error.message || error);
      return {
        text: generateTemplateExplanation(analysis, product),
        source: 'template',
      };
    }

    if (data?.explanation && typeof data.explanation === 'string' && data.explanation.trim()) {
      return {
        text: data.explanation.trim(),
        source: 'groq',
        modelUsed: data.model,
      };
    }
  } catch (err) {
    console.warn('AI explanation request failed, using template explanation:', err);
>>>>>>> f5d1b0e8c9bf2012e5776ae924b0aa7d3461bdb6
  }

  // Resilient deterministic fallback
  return {
    text: generateTemplateExplanation(analysis, product),
    source: 'template',
  };
}
