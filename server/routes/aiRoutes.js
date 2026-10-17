import { Router } from 'express';
import { generateGroqExplanation } from '../services/groqService.js';

export const aiRouter = Router();

/**
 * POST /api/ai/explain
 * Generates an accessible, grounded plain-language food safety explanation
 * using server-side Groq AI.
 */
aiRouter.post('/explain', async (req, res) => {
  try {
    const { product, analysis } = req.body || {};

    // 1. Input Validation
    if (!product || typeof product !== 'object') {
      return res.status(400).json({
        success: false,
        fallback: true,
        error: 'Invalid request: product information is required.'
      });
    }

    if (!analysis || typeof analysis !== 'object' || !analysis.verdict) {
      return res.status(400).json({
        success: false,
        fallback: true,
        error: 'Invalid request: deterministic analysis result with verdict is required.'
      });
    }

    // 2. Payload size check (prevent unbounded inputs)
    const productStr = JSON.stringify(product);
    const analysisStr = JSON.stringify(analysis);
    if (productStr.length > 50000 || analysisStr.length > 50000) {
      return res.status(413).json({
        success: false,
        fallback: true,
        error: 'Payload too large. Please provide standard product and analysis information.'
      });
    }

    // 3. Extract only the fields needed for the explanation
    const sanitizedProduct = {
      name: String(product.name || '').slice(0, 200),
      brand: String(product.brand || '').slice(0, 100),
      ingredientsText: String(product.ingredientsText || '').slice(0, 4000),
      declaredAllergens: Array.isArray(product.declaredAllergens)
        ? product.declaredAllergens.map(a => String(a).slice(0, 50))
        : [],
      traceWarnings: Array.isArray(product.traceWarnings)
        ? product.traceWarnings.map(t => String(t).slice(0, 100))
        : [],
    };

    const sanitizedAnalysis = {
      verdict: String(analysis.verdict).toLowerCase(),
      verdictReason: String(analysis.verdictReason || '').slice(0, 500),
      triggeredRules: Array.isArray(analysis.triggeredRules)
        ? analysis.triggeredRules.map(r => String(r).slice(0, 100))
        : [],
      matchedAllergens: Array.isArray(analysis.matchedAllergens)
        ? analysis.matchedAllergens.map(a => String(a).slice(0, 50))
        : [],
      matchedTraces: Array.isArray(analysis.matchedTraces)
        ? analysis.matchedTraces.map(t => String(t).slice(0, 50))
        : [],
      ingredientsOfConcern: Array.isArray(analysis.ingredientsOfConcern)
        ? analysis.ingredientsOfConcern.map(i => String(i).slice(0, 100))
        : [],
      nutritionalObservations: Array.isArray(analysis.nutritionalObservations)
        ? analysis.nutritionalObservations.slice(0, 10)
        : [],
      missingDataNotes: Array.isArray(analysis.missingDataNotes)
        ? analysis.missingDataNotes.map(m => String(m).slice(0, 200))
        : [],
    };

    // 4. Request explanation from Groq
    const result = await generateGroqExplanation({
      product: sanitizedProduct,
      analysis: sanitizedAnalysis,
    });

    return res.json(result);
  } catch (error) {
    console.error('[AI Router Error]', error?.message || error);
    // Never leak stack trace or internal details to the client
    return res.status(500).json({
      success: false,
      fallback: true,
      error: 'An internal error occurred while generating the explanation.'
    });
  }
});
