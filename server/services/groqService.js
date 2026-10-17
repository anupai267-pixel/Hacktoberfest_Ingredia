import { Groq } from 'groq-sdk';

/**
 * Service to generate grounded food safety explanations using Groq AI.
 */
export async function generateGroqExplanation({ product, analysis }) {
  const apiKey = process.env.GROQ_API_KEY?.trim();

  // If no API key configured, signal client to use deterministic template
  if (!apiKey || apiKey === 'your-groq-api-key-here') {
    return {
      success: false,
      fallback: true,
      message: 'Groq API key not configured on server. Fallback to deterministic rules engine explanation.'
    };
  }

  const model = process.env.GROQ_MODEL?.trim() || 'llama-3.3-70b-versatile';

  const groq = new Groq({ apiKey });

  // Format nutrition observations safely
  const nutObs = (analysis.nutritionalObservations || [])
    .filter(n => n.status !== 'normal')
    .map(n => `${n.metric}: ${n.value}${n.unit} (${n.status.toUpperCase()} vs threshold)`)
    .join('; ');

  const systemPrompt = `You are Ingredia's food safety explanation assistant.
Your job is to provide calm, objective, plain-language explanations of packaged-food analysis results based strictly on the deterministic rules engine output.

CRITICAL SAFETY & TRUTH CONSTRAINTS:
1. THE RULES ENGINE HAS ALREADY DETERMINED THE PRODUCT CLASSIFICATION: "${analysis.verdict?.toUpperCase()}". DO NOT CHANGE, OVERRIDE, OR CONTRADICT THIS VERDICT.
2. NEVER FABRICATE, GUESS, OR INVENT INGREDIENTS, ALLERGENS, NUTRITION VALUES, OR PRODUCT IDENTITIES NOT PRESENT IN THE INPUT.
3. NEVER INDEPENDENTLY DECLARE THAT A FOOD IS MEDICALLY SAFE, CURES ILLNESS, OR HARMFUL BEYOND THE SCREENED RULES.
4. Explain clearly:
   - Why the product received its classification (${analysis.verdict}).
   - Which declared ingredients or allergens triggered a warning (if any).
   - Which nutrition values deserve consumer attention (if any).
   - What information is missing or incomplete (if any).
   - What the user should verify on the physical package.
5. Keep the explanation concise, clear, and reassuring (around 100-150 words). Format with clean, readable paragraphs or bullet points.`;

  const userContent = `Product Information:
- Name: ${product.name || 'Packaged Grocery'}
- Brand: ${product.brand || 'Unspecified'}
- Declared Ingredients: ${product.ingredientsText || 'None listed'}
- Declared Allergens: ${(product.declaredAllergens || []).join(', ') || 'None declared'}
- Trace / May Contain: ${(product.traceWarnings || []).join(', ') || 'None declared'}

Deterministic Rules Engine Verdict:
- Verdict: ${analysis.verdict?.toUpperCase()}
- Summary Reason: ${analysis.verdictReason || 'Standard rule evaluation'}
- Triggered Rules: ${(analysis.triggeredRules || []).join(', ') || 'None'}
- Matched Allergens: ${(analysis.matchedAllergens || []).join(', ') || 'None'}
- Matched Traces: ${(analysis.matchedTraces || []).join(', ') || 'None'}
- Ingredients of Concern: ${(analysis.ingredientsOfConcern || []).join(', ') || 'None'}
- Flagged Nutrition: ${nutObs || 'Within standard prototype thresholds'}
- Missing Data Notes: ${(analysis.missingDataNotes || []).join(' ') || 'None'}

Please provide the concise plain-language explanation for this product.`;

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent }
      ],
      model: model,
      temperature: 0.2,
      max_tokens: 350,
      top_p: 0.9,
    });

    const choice = chatCompletion.choices?.[0]?.message?.content;
    if (!choice || !choice.trim()) {
      return {
        success: false,
        fallback: true,
        message: 'Groq response was empty.'
      };
    }

    return {
      success: true,
      text: choice.trim(),
      model: model,
      source: 'groq'
    };
  } catch (error) {
    // Sanitize error logging: never expose secret key
    const status = error?.status || 500;
    const errorType = error?.error?.type || error?.name || 'GroqAPIError';
    
    // Provide a safe, scrubbed message to the frontend
    let userMsg = 'AI explanation service unavailable. Using transparent rules explanation.';
    if (status === 401) {
      userMsg = 'Invalid Groq API key configured on server. Using rules explanation.';
    } else if (status === 429) {
      userMsg = 'Groq rate limit reached. Using rules explanation.';
    }

    console.warn(`[Groq Service Warning] Status ${status} (${errorType}): ${error?.message?.slice(0, 100)}`);

    return {
      success: false,
      fallback: true,
      error: userMsg
    };
  }
}
