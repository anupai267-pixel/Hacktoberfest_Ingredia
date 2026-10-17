// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This code runs in a Supabase Edge Function (Deno runtime).

interface ExplainRequestBody {
  product: {
    name: string;
    brand?: string;
  };
  analysis: {
    verdict: 'suitable' | 'caution' | 'avoid' | 'insufficient_data';
    matchedAllergens?: string[];
    matchedTraces?: string[];
    ingredientsOfConcern?: string[];
    triggeredRules?: string[];
    missingDataNotes?: string[];
    nutritionalObservations?: string[];
  };
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Open-weight models on Groq:
// Preferred primary: openai/gpt-oss-20b (high speed, open weights)
// Resilient fallback: llama-3.3-70b-versatile (broadly supported open-weight model)
const PREFERRED_MODEL = Deno.env.get('GROQ_MODEL') || 'openai/gpt-oss-20b';
const FALLBACK_MODEL = 'llama-3.3-70b-versatile';

/**
 * Validates the incoming request body according to Ingredia safety rules.
 */
function validateRequest(body: unknown): { valid: boolean; error?: string; data?: ExplainRequestBody } {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Request body must be a valid JSON object.' };
  }

  const payload = body as Record<string, unknown>;
  const product = payload.product as Record<string, unknown> | undefined;
  const analysis = payload.analysis as Record<string, unknown> | undefined;

  if (!product || typeof product !== 'object') {
    return { valid: false, error: 'Missing or invalid "product" object.' };
  }

  if (typeof product.name !== 'string' || !product.name.trim()) {
    return { valid: false, error: 'Product "name" string is required.' };
  }

  if (!analysis || typeof analysis !== 'object') {
    return { valid: false, error: 'Missing or invalid "analysis" object.' };
  }

  const validVerdicts = ['suitable', 'caution', 'avoid', 'insufficient_data'];
  if (typeof analysis.verdict !== 'string' || !validVerdicts.includes(analysis.verdict)) {
    return {
      valid: false,
      error: `Analysis verdict must be one of: ${validVerdicts.join(', ')}.`,
    };
  }

  return {
    valid: true,
    data: {
      product: {
        name: String(product.name).slice(0, 150).trim(),
        brand: product.brand ? String(product.brand).slice(0, 100).trim() : undefined,
      },
      analysis: {
        verdict: analysis.verdict as ExplainRequestBody['analysis']['verdict'],
        matchedAllergens: Array.isArray(analysis.matchedAllergens)
          ? analysis.matchedAllergens.slice(0, 15).map(String)
          : [],
        matchedTraces: Array.isArray(analysis.matchedTraces)
          ? analysis.matchedTraces.slice(0, 15).map(String)
          : [],
        ingredientsOfConcern: Array.isArray(analysis.ingredientsOfConcern)
          ? analysis.ingredientsOfConcern.slice(0, 20).map(String)
          : [],
        triggeredRules: Array.isArray(analysis.triggeredRules)
          ? analysis.triggeredRules.slice(0, 15).map(String)
          : [],
        missingDataNotes: Array.isArray(analysis.missingDataNotes)
          ? analysis.missingDataNotes.slice(0, 10).map(String)
          : [],
        nutritionalObservations: Array.isArray(analysis.nutritionalObservations)
          ? analysis.nutritionalObservations.slice(0, 10).map(String)
          : [],
      },
    },
  };
}

/**
 * Strips extra whitespace, accidental conversational preambles, or quotes.
 */
function cleanModelOutput(rawText: string): string {
  let cleaned = rawText.trim();

  // Strip leading/trailing matching quotes if the model wrapped output in quotes
  if (cleaned.startsWith('"') && cleaned.endsWith('"') && cleaned.length > 2) {
    cleaned = cleaned.slice(1, -1).trim();
  }

  // Strip any accidental markdown bold headers like "**Explanation:**"
  cleaned = cleaned.replace(/^(?:\*\*)?(?:Explanation|Summary):(?:\*\*)?\s*/i, '');

  return cleaned.trim();
}

/**
 * Calls Groq chat completion API with the requested open-weight model.
 */
async function callGroqChat(
  apiKey: string,
  model: string,
  systemPrompt: string,
  userPrompt: string
): Promise<{ success: boolean; text?: string; status: number; errorData?: unknown }> {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.2, // Low temperature for high factual grounding
      max_completion_tokens: 350,
    }),
  });

  if (!response.ok) {
    let errBody: unknown;
    try {
      errBody = await response.json();
    } catch {
      errBody = await response.text();
    }
    return { success: false, status: response.status, errorData: errBody };
  }

  const data = await response.json();
  const choiceText = data?.choices?.[0]?.message?.content;
  return { success: true, text: choiceText, status: 200 };
}

Deno.serve(async (req: Request) => {
  // 1. CORS Preflight Handling
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // 2. HTTP Method Check
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed. Use POST.' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // 3. Supabase Client Authentication Check
  // supabase.functions.invoke() sends the caller's JWT or anon key in the Authorization header.
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new Response(
      JSON.stringify({
        error: 'Missing or invalid Authorization header. Request must be authenticated via Supabase client.',
        code: 'UNAUTHORIZED',
      }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    // 4. Parse & Validate Request Body
    let rawBody: unknown;
    try {
      rawBody = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: 'Malformed JSON payload.', code: 'INVALID_JSON' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const validation = validateRequest(rawBody);
    if (!validation.valid || !validation.data) {
      return new Response(
        JSON.stringify({ error: validation.error, code: 'INVALID_INPUT' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { product, analysis } = validation.data;

    // 5. Server-Side Secret Verification (GROQ_API_KEY)
    const apiKey = Deno.env.get('GROQ_API_KEY')?.trim();
    if (!apiKey || apiKey === 'your-groq-api-key-here') {
      return new Response(
        JSON.stringify({
          error: 'GROQ_API_KEY is not configured on the Supabase Edge Function.',
          code: 'MISSING_API_KEY',
          message: 'Configure GROQ_API_KEY using "supabase secrets set GROQ_API_KEY=your_key".',
          fallbackAvailable: true,
        }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 6. Safety Guardrails & Truthfulness Directives
    // Adapted from strict food safety principles:
    // - Never override the deterministic rule verdict
    // - Never invent ingredients or nutrition numbers
    // - Do not make medical claims or diagnostic statements
    // - Prominently surface allergens if avoid/caution
    const systemPrompt = `You are Ingredia's food safety explanation assistant.
Your job is to explain the provided food product facts and deterministic safety verdict to the consumer in a calm, clear, and reassuring tone (3 to 5 sentences maximum, under 150 words).

CRITICAL SAFETY & TRUTH DIRECTIVES:
1. TRUTHFULNESS: Base your explanation ONLY on the provided verified ingredients, nutrition observations, and rule engine findings. Never fabricate, invent, or guess ingredients.
2. NO MEDICAL CLAIMS: Do NOT diagnose any medical condition, do NOT provide medical advice, and do NOT claim any food treats, cures, or is medically therapeutic.
3. NEVER OVERRIDE VERDICT: The deterministic rules engine has ALREADY established the verdict: "${analysis.verdict.toUpperCase()}". You MUST respect and reinforce this verdict. You must NEVER contradict, soften, or change it.
4. ALLERGEN SAFETY: If the verdict is AVOID or CAUTION due to allergen matches or trace warnings, prominently highlight those allergens first.
5. CONCISE & OBJECTIVE: Keep the response under 150 words. Do NOT include markdown code blocks, conversational greetings, or internal scratchpad notes. Output only the final consumer-facing explanation.`;

    const userPrompt = `Product: ${product.name}${product.brand ? ` (${product.brand})` : ''}
Verdict: ${analysis.verdict.toUpperCase()}
Triggered Rules: ${analysis.triggeredRules.length > 0 ? analysis.triggeredRules.join(', ') : 'None'}
Matched Allergens: ${analysis.matchedAllergens.length > 0 ? analysis.matchedAllergens.join(', ') : 'None'}
Matched Traces: ${analysis.matchedTraces.length > 0 ? analysis.matchedTraces.join(', ') : 'None'}
Ingredients of Concern: ${analysis.ingredientsOfConcern.length > 0 ? analysis.ingredientsOfConcern.join(', ') : 'None'}
Nutritional Notes: ${analysis.nutritionalObservations.length > 0 ? analysis.nutritionalObservations.join('; ') : 'Within standard screening thresholds'}
Data Completeness: ${analysis.missingDataNotes.length > 0 ? analysis.missingDataNotes.join('; ') : 'Complete ingredient and nutrition profile'}

Explain this verdict clearly to the user now:`;

    // 7. Call Groq with preferred open-weight model (with automatic fallback if model unavailable)
    let activeModel = PREFERRED_MODEL;
    let callResult = await callGroqChat(apiKey, activeModel, systemPrompt, userPrompt);

    // If preferred model is not found (e.g. HTTP 404 or model_not_found), fallback to resilient alternative
    if (!callResult.success && callResult.status === 404 && activeModel !== FALLBACK_MODEL) {
      console.warn(`[ingredia-ai] Model "${activeModel}" not available (404). Falling back to "${FALLBACK_MODEL}".`);
      activeModel = FALLBACK_MODEL;
      callResult = await callGroqChat(apiKey, activeModel, systemPrompt, userPrompt);
    }

    if (!callResult.success) {
      console.error('[ingredia-ai] Groq API call failed:', callResult.errorData);
      return new Response(
        JSON.stringify({
          error: 'Groq API request failed.',
          code: 'GROQ_API_ERROR',
          status: callResult.status,
          details: callResult.errorData,
          fallbackAvailable: true,
        }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const rawExplanation = callResult.text || '';
    if (!rawExplanation.trim()) {
      return new Response(
        JSON.stringify({
          error: 'Groq returned an empty explanation.',
          code: 'EMPTY_RESPONSE',
          fallbackAvailable: true,
        }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const cleanedExplanation = cleanModelOutput(rawExplanation);

    // 8. Return Success Payload
    return new Response(
      JSON.stringify({
        status: 'success',
        explanation: cleanedExplanation,
        model: activeModel,
        verdict: analysis.verdict,
        timestamp: new Date().toISOString(),
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[ingredia-ai] Unexpected Edge Function error:', message);
    return new Response(
      JSON.stringify({
        error: 'Internal Edge Function error occurred.',
        code: 'INTERNAL_ERROR',
        details: message,
        fallbackAvailable: true,
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
