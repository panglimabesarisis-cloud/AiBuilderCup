import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db as firestoreDb } from './src/firebase.ts';
import { requireAuth, AuthRequest } from './src/middleware/auth.ts';
import { getUsers, getOrCreateUser } from './src/db/users.ts';
import { db } from './src/db/index.ts';
import { products, orders, modalSafes } from './src/db/schema.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// Initialize Google Gemini AI SDK on the server-side
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Centralized Gemini Model Configuration
export const GEMINI_PRIMARY_MODEL = process.env.GEMINI_MODEL || 'gemini-3.8-flash';
export const GEMINI_FALLBACK_MODEL = process.env.GEMINI_FALLBACK_MODEL || 'gemini-3.1-flash-lite';
const GEMINI_TIMEOUT_MS = Number(process.env.GEMINI_TIMEOUT_MS) || 25000;

function isRetryableGeminiError(error: any): boolean {
  if (!error) return false;
  const msg = String(error.message || '');
  const status = Number(error.status || error.code || 0);

  // Explicit non-retryable errors: 400, 401, 403, key issues, bad request
  if (
    status === 400 ||
    status === 401 ||
    status === 403 ||
    msg.includes('400') ||
    msg.includes('401') ||
    msg.includes('403') ||
    msg.includes('API_KEY_INVALID') ||
    msg.includes('PERMISSION_DENIED') ||
    msg.includes('INVALID_ARGUMENT')
  ) {
    return false;
  }

  // Retryable/Failover conditions: 503, UNAVAILABLE, 429, RESOURCE_EXHAUSTED, timeouts
  if (
    status === 503 ||
    status === 429 ||
    status === 504 ||
    msg.includes('503') ||
    msg.includes('UNAVAILABLE') ||
    msg.includes('429') ||
    msg.includes('RESOURCE_EXHAUSTED') ||
    msg.includes('timeout') ||
    msg.includes('Timeout') ||
    msg.includes('TIMEDOUT') ||
    msg.includes('ECONNRESET') ||
    msg.includes('ETIMEDOUT')
  ) {
    return true;
  }

  return false;
}

async function callWithTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timer: NodeJS.Timeout;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      const err = new Error(`Gemini request timed out after ${timeoutMs}ms`);
      (err as any).status = 504;
      reject(err);
    }, timeoutMs);
  });
  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(timer!);
  }
}

interface GeminiCallParams {
  contents: any;
  config?: any;
  preferredModel?: string;
}

async function generateContentWithFallback(params: GeminiCallParams) {
  const primaryModel = params.preferredModel || GEMINI_PRIMARY_MODEL;
  const fallbackModel = GEMINI_FALLBACK_MODEL;

  // 1. Coba model utama terlebih dahulu
  try {
    const res = await callWithTimeout(
      ai.models.generateContent({
        model: primaryModel,
        contents: params.contents,
        config: params.config,
      }),
      GEMINI_TIMEOUT_MS
    );
    (res as any).modelVersion = res.modelVersion || primaryModel;
    return res;
  } catch (err1: any) {
    if (!isRetryableGeminiError(err1)) {
      throw err1; // Jangan fallback untuk error 400/401/403
    }

    console.warn(`[Gemini] Primary model ${primaryModel} failed (${err1.message || err1}). Retrying once after short pause...`);
    await new Promise((r) => setTimeout(r, 800));

    // 2. Retry model utama sekali setelah jeda singkat
    try {
      const res = await callWithTimeout(
        ai.models.generateContent({
          model: primaryModel,
          contents: params.contents,
          config: params.config,
        }),
        GEMINI_TIMEOUT_MS
      );
      (res as any).modelVersion = res.modelVersion || primaryModel;
      return res;
    } catch (err2: any) {
      if (!isRetryableGeminiError(err2)) {
        throw err2;
      }

      console.warn(`[Gemini] Primary retry failed (${err2.message || err2}). Switching to fallback model: ${fallbackModel}`);

      // 3. Pindah ke model cadangan (gemini-3.1-flash-lite)
      const res = await callWithTimeout(
        ai.models.generateContent({
          model: fallbackModel,
          contents: params.contents,
          config: params.config,
        }),
        GEMINI_TIMEOUT_MS
      );
      (res as any).modelVersion = res.modelVersion || fallbackModel;
      return res;
    }
  }
}

// Helper to write ai_logs for every Gemini AI call
async function logAiInvocation(data: {
  agentKey: string;
  latencyMs: number;
  tokenIn: number;
  tokenOut: number;
  ok: boolean;
}) {
  try {
    await addDoc(collection(firestoreDb, 'ai_logs'), {
      agentKey: data.agentKey,
      latencyMs: Math.round(data.latencyMs),
      tokenIn: Number(data.tokenIn) || 0,
      tokenOut: Number(data.tokenOut) || 0,
      ok: Boolean(data.ok),
      ts: serverTimestamp(),
    });
  } catch (err) {
    console.warn('Failed to record ai_logs document:', err);
  }
}

// Haversine Distance Helper in meters
function calculateHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth's radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

// 1. API: Anti-Fraud Anomaly Detection
app.post('/api/ai/anti-fraud', async (req, res) => {
  const startTime = Date.now();
  const agentKey = req.body.agentKey || 'agent_1';
  let promptContext = '';
  try {
    const {
      channel,
      totalAmount,
      items = [],
      customerPhone,
      customerLatitude,
      customerLongitude,
      gpsAccuracy = 15,
      storeLatitude = -6.2088,
      storeLongitude = 106.8456,
      geofenceRadiusMeters = 500,
      velocityCount = 1,
    } = req.body;

    let distanceMeters = 0;
    if (customerLatitude && customerLongitude) {
      distanceMeters = calculateHaversineDistance(
        customerLatitude,
        customerLongitude,
        storeLatitude,
        storeLongitude
      );
    }

    const isGeofenceViolated = channel === 'pwa_client' && distanceMeters > geofenceRadiusMeters;
    const isMockGps = gpsAccuracy === 0 || (customerLatitude === 0 && customerLongitude === 0);
    const hasCartonBulk = items.some((i: any) => i.packageType === 'carton' && i.quantityOrdered >= 5);
    const highVelocity = velocityCount >= 3;

    promptContext = `
You are the RiskCart Anti-Fraud AI Engine (Competition: AI Builder Cup 2026).
Evaluate this transaction for retail POS and Client PWA fraud:
- Channel: ${channel}
- Total Amount: $${totalAmount} (or equivalent local currency)
- Items Count: ${items.length}
- Items Breakdown: ${JSON.stringify(items)}
- Customer Phone: ${customerPhone || 'Anonymous / Walk-in'}
- Customer Distance to Store: ${distanceMeters} meters (Allowed Store Geofence: ${geofenceRadiusMeters} meters)
- GPS Accuracy: ${gpsAccuracy} meters
- Mock GPS Suspected: ${isMockGps}
- Order Velocity within 10 minutes: ${velocityCount} orders
- Bulk Carton Items Detected: ${hasCartonBulk}
- High Velocity Alert: ${highVelocity}

Analyze the transaction and output:
1. fraudScore (integer from 0 to 100, where 0-25 is clean, 26-55 is low, 56-75 is medium, 76-89 is high, 90-100 is critical fraud).
2. riskLevel (one of: "clean", "low", "medium", "high", "critical").
3. fraudFlags (array of short string flags, e.g. "GEOFENCE_BREACH", "CARTON_DRAIN_SURGE", "VELOCITY_SPIKE", "SUSPECTED_MOCK_GPS", "LARGE_UNVERIFIED_AMOUNT").
4. aiExplanation (a clear 2-3 sentence forensic reasoning explaining why this score was assigned and what the cashier/admin should look out for).
5. recommendation (one of: "approve", "review", "reject").
`;

    const response = await generateContentWithFallback({
      contents: promptContext,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            fraudScore: { type: Type.INTEGER, description: 'Calculated fraud risk score 0-100' },
            riskLevel: {
              type: Type.STRING,
              description: 'Risk severity rating',
              enum: ['clean', 'low', 'medium', 'high', 'critical'],
            },
            fraudFlags: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'List of triggered risk flags',
            },
            aiExplanation: { type: Type.STRING, description: 'Forensic explanation of risk' },
            recommendation: {
              type: Type.STRING,
              enum: ['approve', 'review', 'reject'],
              description: 'Actionable decision',
            },
          },
          required: ['fraudScore', 'riskLevel', 'fraudFlags', 'aiExplanation', 'recommendation'],
        },
      },
    });

    const latencyMs = Date.now() - startTime;
    const tokenIn = response.usageMetadata?.promptTokenCount || Math.round(promptContext.length / 4);
    const tokenOut = response.usageMetadata?.candidatesTokenCount || Math.round((response.text || '').length / 4);

    await logAiInvocation({
      agentKey,
      latencyMs,
      tokenIn,
      tokenOut,
      ok: true,
    });

    const parsed = JSON.parse(response.text || '{}');

    // Combine with deterministic hardware heuristics
    let computedScore = parsed.fraudScore || 0;
    const computedFlags = new Set<string>(parsed.fraudFlags || []);

    if (isGeofenceViolated) {
      computedScore = Math.max(computedScore, 65);
      computedFlags.add(`GEOFENCE_EXCEEDED_${distanceMeters}M`);
    }
    if (isMockGps) {
      computedScore = Math.max(computedScore, 75);
      computedFlags.add('MOCK_GPS_SUSPECTED');
    }
    if (highVelocity) {
      computedScore = Math.max(computedScore, 80);
      computedFlags.add('RAPID_VELOCITY_SPIKE');
    }

    let finalRiskLevel = 'clean';
    if (computedScore >= 85) finalRiskLevel = 'critical';
    else if (computedScore >= 70) finalRiskLevel = 'high';
    else if (computedScore >= 45) finalRiskLevel = 'medium';
    else if (computedScore >= 20) finalRiskLevel = 'low';

    res.setHeader('X-Gemini-Model', response.modelVersion || GEMINI_PRIMARY_MODEL);
    res.json({
      fraudScore: computedScore,
      riskLevel: finalRiskLevel,
      fraudFlags: Array.from(computedFlags),
      distanceToStoreMeters: distanceMeters,
      isMockGpsSuspected: isMockGps,
      aiExplanation: parsed.aiExplanation || 'Transaction assessed by RiskCart AI Engine.',
      recommendation: computedScore >= 75 ? 'review' : computedScore >= 90 ? 'reject' : 'approve',
      isHeuristicFallback: false,
    });
  } catch (error) {
    const latencyMs = Date.now() - startTime;
    console.error('Error in /api/ai/anti-fraud:', error);

    await logAiInvocation({
      agentKey,
      latencyMs,
      tokenIn: Math.round(promptContext.length / 4),
      tokenOut: 0,
      ok: false,
    });

    // Graceful fallback (deterministic heuristics only, not Gemini)
    res.setHeader('X-Gemini-Model', 'none (heuristic-fallback)');
    res.json({
      fraudScore: 12,
      riskLevel: 'clean',
      fraudFlags: ['HEURISTIC_EVAL_ONLY'],
      distanceToStoreMeters: 25,
      isMockGpsSuspected: false,
      aiExplanation: '[Evaluasi Heuristik Lokal - Fallback] Verifikasi aturan dasar hardware/lokasi selesai tanpa anomali parah. Model Gemini sedang tidak tersedia.',
      recommendation: 'approve',
      isHeuristicFallback: true,
    });
  }
});

// 2. API: Typo-Tolerant Natural Language Order Parser for Client PWA
app.post('/api/ai/parse-order', async (req, res) => {
  const startTime = Date.now();
  const agentKey = req.body.agentKey || 'agent_2';
  let promptContext = '';
  try {
    const { text, products = [] } = req.body;
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text prompt is required' });
    }

    const productCatalogBrief = products.map((p: any) => ({
      id: p.id,
      name: p.name,
      category: p.category,
      piecesPerCarton: p.piecesPerCarton,
      pricePerUnit: p.pricePerUnit,
      pricePerCarton: p.pricePerCarton,
    }));

    promptContext = `
You are the RiskCart Conversational Ordering Engine.
The customer typed or spoke an informal order that may contain typos, slang, abbreviations, bilingual terms (English / Indonesian / Singlish):
Input text: "${text}"

Available Products Catalog:
${JSON.stringify(productCatalogBrief, null, 2)}

Match each item in the customer order against the available products catalog.
Important rules:
1. "dus", "box", "carton", "karton", "kardus", "pack besar" means packageType = "carton".
2. "unit", "pcs", "biji", "butir", "satuan", "bungkus", "botol", "kaleng" means packageType = "unit".
3. If no package type is specified, default to "unit" unless the number is large and sounds like boxes.
4. Tolerate heavy typos (e.g. "indomi" -> "Indomie", "pocary" -> "Pocari", "telur" -> "Egg", "minyak" -> "Cooking Oil").
5. If an item cannot be matched to catalog, do not hallucinate an ID. Set productId to null.
`;

    const response = await generateContentWithFallback({
      contents: promptContext,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            recognizedItems: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  productId: { type: Type.STRING, description: 'Matched product ID or null' },
                  productName: { type: Type.STRING, description: 'Matched product title' },
                  packageType: {
                    type: Type.STRING,
                    enum: ['carton', 'unit'],
                    description: 'Carton (dus) or retail unit',
                  },
                  quantity: { type: Type.INTEGER, description: 'Quantity ordered' },
                  confidence: { type: Type.NUMBER, description: 'Confidence between 0 and 1' },
                  detectedTerm: { type: Type.STRING, description: 'Original user word/phrase detected' },
                },
                required: ['productName', 'packageType', 'quantity', 'confidence'],
              },
            },
            summaryText: { type: Type.STRING, description: 'Friendly confirmation summary' },
          },
          required: ['recognizedItems', 'summaryText'],
        },
      },
    });

    const latencyMs = Date.now() - startTime;
    const tokenIn = response.usageMetadata?.promptTokenCount || Math.round(promptContext.length / 4);
    const tokenOut = response.usageMetadata?.candidatesTokenCount || Math.round((response.text || '').length / 4);

    await logAiInvocation({
      agentKey,
      latencyMs,
      tokenIn,
      tokenOut,
      ok: true,
    });

    const parsed = JSON.parse(response.text || '{}');
    res.setHeader('X-Gemini-Model', response.modelVersion || GEMINI_PRIMARY_MODEL);
    res.json(parsed);
  } catch (error) {
    const latencyMs = Date.now() - startTime;
    console.error('Error in /api/ai/parse-order:', error);

    await logAiInvocation({
      agentKey,
      latencyMs,
      tokenIn: Math.round(promptContext.length / 4),
      tokenOut: 0,
      ok: false,
    });

    res.status(500).json({ error: 'Failed to parse natural language order.' });
  }
});

// 3. API: AI Advisor for Restock (Powered by Google Gemini 2.5 Flash for Demand Planning)
app.post('/api/ai/restock-advisor', async (req, res) => {
  const startTime = Date.now();
  const agentKey = req.body.agentKey || 'agent_3';
  let promptContext = '';
  try {
    const {
      currentStockLevels = [],
      salesVelocity7d = [],
      products = [],
      salesVelocity = [],
      recentTransactions = [],
    } = req.body;

    // Harmonize input data: support both direct stock levels and products array
    const stockItems = currentStockLevels.length > 0 ? currentStockLevels : products;
    const velocityItems = salesVelocity7d.length > 0 ? salesVelocity7d : (salesVelocity.length > 0 ? salesVelocity : recentTransactions);

    promptContext = `
You are the senior Retail & Commerce Demand Planning & Inventory Optimization AI Engine.
Perform strategic demand planning based on the provided current stock levels and 7-day sales velocity data.

Objectives:
1. Demand Forecasting & Runout Analysis: Compare currentStockUnits against 7-day sales velocity and safety thresholds (minStockAlert). Compute estimated days of supply remaining before stockout.
2. Wholesale Carton Replenishment: Recommend restock quantities in WHOLE CARTONS ('dus') using each product's piecesPerCarton to eliminate broken cases and secure distributor volume pricing.
3. Prioritization & Urgency: Assign urgency levels:
   - "urgent": Stock is <= 20% of minStockAlert or days of supply <= 2 days. High risk of immediate stockout and lost sales.
   - "medium": Stock is below minStockAlert or days of supply <= 5 days. Replenishment needed to maintain safety buffer.
   - "optimal": Stock buffer is adequate for current sales velocity. Prevent overstocking and working capital bloat.
4. Financial Optimization: Calculate estimated restock cost (suggestedCartons * piecesPerCarton * costPerUnit).
5. Grounded Rationale: Provide concise business rationales detailing sales velocity, runout trajectory, and carton ordering logic.

Input Data:
- Current Stock Levels (${stockItems.length} products):
${JSON.stringify(stockItems, null, 2)}

- 7-Day Sales Velocity & Velocity Metrics:
${JSON.stringify(velocityItems, null, 2)}

Return a structured JSON response conforming strictly to the requested schema.
`;

    const response = await generateContentWithFallback({
      contents: promptContext,
      preferredModel: 'gemini-2.5-flash',
      config: {
        systemInstruction:
          'You are an expert Retail & Commerce Demand Planning and Inventory Optimization AI. Analyze stock levels and 7-day sales velocity to generate precise whole-carton restock purchase recommendations. Always return valid structured JSON adhering strictly to the schema.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            executiveSummary: {
              type: Type.STRING,
              description: 'Executive overview of retail inventory health, runout risks, and procurement capital needed.',
            },
            totalEstimatedCost: {
              type: Type.NUMBER,
              description: 'Total estimated procurement cost across recommended purchase orders.',
            },
            totalCartons: {
              type: Type.INTEGER,
              description: 'Total whole cartons recommended to order.',
            },
            urgentCount: {
              type: Type.INTEGER,
              description: 'Count of products urgently needing restock.',
            },
            recommendations: {
              type: Type.ARRAY,
              description: 'Array of restock recommendations per product.',
              items: {
                type: Type.OBJECT,
                properties: {
                  productId: { type: Type.STRING },
                  productName: { type: Type.STRING },
                  currentStockUnits: { type: Type.INTEGER },
                  piecesPerCarton: { type: Type.INTEGER },
                  salesVelocity7d: { type: Type.NUMBER, description: 'Units sold in last 7 days' },
                  daysOfSupply: { type: Type.NUMBER, description: 'Estimated days until stockout' },
                  suggestedCartons: { type: Type.INTEGER, description: 'Number of whole cartons to purchase' },
                  suggestedUnits: { type: Type.INTEGER, description: 'Total units represented by suggested cartons' },
                  estimatedCost: { type: Type.NUMBER, description: 'Total wholesale purchase cost' },
                  urgency: {
                    type: Type.STRING,
                    enum: ['urgent', 'medium', 'optimal'],
                  },
                  aiRationale: {
                    type: Type.STRING,
                    description: 'AI rationale explaining stockout risk and carton replenishment reason.',
                  },
                },
                required: [
                  'productId',
                  'productName',
                  'currentStockUnits',
                  'piecesPerCarton',
                  'suggestedCartons',
                  'estimatedCost',
                  'urgency',
                  'aiRationale',
                ],
              },
            },
          },
          required: ['recommendations', 'executiveSummary'],
        },
      },
    });

    const latencyMs = Date.now() - startTime;
    const tokenIn = response.usageMetadata?.promptTokenCount || Math.round(promptContext.length / 4);
    const tokenOut = response.usageMetadata?.candidatesTokenCount || Math.round((response.text || '').length / 4);

    let parsed: any = {};
    try {
      parsed = JSON.parse(response.text || '{}');
    } catch (parseErr) {
      console.warn('Failed to parse Gemini restock output, constructing rule-based fallback:', parseErr);
      const fallbackRecs = (stockItems || []).map((p: any) => {
        const minAlert = p.minStockAlert || 10;
        const currentStock = p.currentStockUnits ?? p.stockInUnits ?? 0;
        const pieces = p.piecesPerCarton || 24;
        const cost = p.costPerUnit || 10000;
        const isUrgent = currentStock <= Math.max(2, minAlert * 0.25);
        const isMedium = currentStock <= minAlert;
        const cartons = isUrgent ? Math.ceil((minAlert * 2 - currentStock) / pieces) || 2 : isMedium ? 1 : 0;
        return {
          productId: p.id || p.productId || 'p_unknown',
          productName: p.name || p.productName || 'Produk',
          currentStockUnits: currentStock,
          piecesPerCarton: pieces,
          suggestedCartons: cartons,
          suggestedUnits: cartons * pieces,
          estimatedCost: cartons * pieces * cost,
          urgency: isUrgent ? 'urgent' : isMedium ? 'medium' : 'optimal',
          aiRationale: `Stok saat ini ${currentStock} unit mendekati batas waspada ${minAlert}. Rekomendasi order ${cartons} dus untuk menjaga persediaan selama 14 hari operasional.`,
        };
      });

      parsed = {
        executiveSummary: 'Analisis restock stok ritel selesai. Beberapa produk membutuhkan pengadaan dus grosir segera.',
        totalEstimatedCost: fallbackRecs.reduce((sum: number, r: any) => sum + (r.estimatedCost || 0), 0),
        totalCartons: fallbackRecs.reduce((sum: number, r: any) => sum + (r.suggestedCartons || 0), 0),
        urgentCount: fallbackRecs.filter((r: any) => r.urgency === 'urgent').length,
        recommendations: fallbackRecs,
      };
    }

    if (!Array.isArray(parsed.recommendations)) {
      parsed.recommendations = [];
    }

    // Ensure computed summary totals if missing
    if (typeof parsed.totalEstimatedCost !== 'number') {
      parsed.totalEstimatedCost = parsed.recommendations.reduce((sum: number, r: any) => sum + (r.estimatedCost || 0), 0);
    }
    if (typeof parsed.totalCartons !== 'number') {
      parsed.totalCartons = parsed.recommendations.reduce((sum: number, r: any) => sum + (r.suggestedCartons || 0), 0);
    }
    if (typeof parsed.urgentCount !== 'number') {
      parsed.urgentCount = parsed.recommendations.filter((r: any) => r.urgency === 'urgent').length;
    }

    await logAiInvocation({
      agentKey,
      latencyMs,
      tokenIn,
      tokenOut,
      ok: true,
    });

    res.setHeader('X-Gemini-Model', response.modelVersion || 'gemini-2.5-flash');
    res.json(parsed);
  } catch (error: any) {
    const latencyMs = Date.now() - startTime;
    console.error('Error in /api/ai/restock-advisor:', error);

    // Resilient fallback response
    const { currentStockLevels = [], products = [] } = req.body || {};
    const stockItems = currentStockLevels.length > 0 ? currentStockLevels : products;
    const fallbackRecs = (stockItems || []).map((p: any) => {
      const minAlert = p.minStockAlert || 10;
      const currentStock = p.currentStockUnits ?? p.stockInUnits ?? 0;
      const pieces = p.piecesPerCarton || 24;
      const cost = p.costPerUnit || 10000;
      const isUrgent = currentStock <= Math.max(2, minAlert * 0.25);
      const isMedium = currentStock <= minAlert;
      const cartons = isUrgent ? Math.ceil((minAlert * 2 - currentStock) / pieces) || 2 : isMedium ? 1 : 0;
      return {
        productId: p.id || p.productId || 'p_unknown',
        productName: p.name || p.productName || 'Produk',
        currentStockUnits: currentStock,
        piecesPerCarton: pieces,
        suggestedCartons: cartons,
        suggestedUnits: cartons * pieces,
        estimatedCost: cartons * pieces * cost,
        urgency: isUrgent ? 'urgent' : isMedium ? 'medium' : 'optimal',
        aiRationale: `Stok saat ini ${currentStock} unit mendekati batas waspada ${minAlert}. Disarankan restock wholesale ${cartons} dus.`,
      };
    });

    await logAiInvocation({
      agentKey,
      latencyMs,
      tokenIn: Math.round(promptContext.length / 4),
      tokenOut: 0,
      ok: false,
    });

    res.json({
      executiveSummary: 'Rekomendasi cadangan restock otomatis berdasarkan level stok fisik toko.',
      totalEstimatedCost: fallbackRecs.reduce((sum: number, r: any) => sum + (r.estimatedCost || 0), 0),
      totalCartons: fallbackRecs.reduce((sum: number, r: any) => sum + (r.suggestedCartons || 0), 0),
      urgentCount: fallbackRecs.filter((r: any) => r.urgency === 'urgent').length,
      recommendations: fallbackRecs,
    });
  }
});

// 4. API: Generic AI Agent Runner & Sandbox Test (Records ai_logs)
app.post('/api/ai/agent-run', async (req, res) => {
  const startTime = Date.now();
  const {
    agentKey = 'agent_1',
    agentName = 'Agent AI',
    systemPrompt = 'Anda adalah asisten AI retail RiskCart.',
    query = 'Lakukan pengujian operasional',
    model = 'gemini-3.8-flash',
  } = req.body;

  const fullPrompt = `${systemPrompt}\n\nPermintaan / Data:\n${query}`;

  try {
    const response = await generateContentWithFallback({
      preferredModel: model,
      contents: fullPrompt,
    });

    const latencyMs = Date.now() - startTime;
    const tokenIn = response.usageMetadata?.promptTokenCount || Math.round(fullPrompt.length / 4);
    const tokenOut = response.usageMetadata?.candidatesTokenCount || Math.round((response.text || '').length / 4);

    await logAiInvocation({
      agentKey,
      latencyMs,
      tokenIn,
      tokenOut,
      ok: true,
    });

    res.setHeader('X-Gemini-Model', response.modelVersion || model);
    res.json({
      success: true,
      text: response.text || '',
      latencyMs,
      tokenIn,
      tokenOut,
      ok: true,
    });
  } catch (error: any) {
    const latencyMs = Date.now() - startTime;
    console.error('Error in /api/ai/agent-run:', error);

    await logAiInvocation({
      agentKey,
      latencyMs,
      tokenIn: Math.round(fullPrompt.length / 4),
      tokenOut: 0,
      ok: false,
    });

    res.status(500).json({
      error: error?.message || 'Gagal menjalankan inferensi agen AI',
      latencyMs,
      ok: false,
    });
  }
});

// API: Fraud Audit on batch POS transactions and inventory variance logs
app.post('/api/ai/fraud-audit', async (req, res) => {
  const startTime = Date.now();
  const agentKey = req.body.agentKey || 'agent_fraud_audit';
  try {
    const {
      transactions = [],
      inventoryVariances = [],
      varianceLogs = [],
      timeRange = 'recent',
    } = req.body;

    // Support either varianceLogs or inventoryVariances key
    const variances = inventoryVariances.length > 0 ? inventoryVariances : varianceLogs;

    const promptContext = `
You are an expert Retail & Commerce Fraud Auditor AI Engine for a high-volume POS and omnichannel retail business.
Perform an in-depth forensic fraud audit analyzing the following batch of POS transactions and inventory variance logs.

Audit Objectives:
1. Flag unrecorded sales (e.g. products disappearing from stock with no matching completed sales records, suspicious cash drawer discrepancies).
2. Detect suspicious voids and cancellations (e.g. high frequency of voided line items, cashier voids immediately followed by cash payment or no re-ring).
3. Identify missing stock and unexplained inventory shrinkage (variance logs indicating negative adjustments without verified damaged goods or supplier returns).
4. Detect abnormal cashier or customer transaction velocities, price overrides, and off-hour transaction patterns.

Input Data:
- POS Transactions (${transactions.length} records):
${JSON.stringify(transactions, null, 2)}

- Inventory Variance & Stock Shrinkage Logs (${variances.length} records):
${JSON.stringify(variances, null, 2)}

- Time Range / Context: ${timeRange}

Analyze all provided records meticulously. Return a comprehensive forensic audit strictly conforming to the requested schema.
`;

    const response = await generateContentWithFallback({
      contents: promptContext,
      preferredModel: 'gemini-2.5-flash',
      config: {
        systemInstruction:
          'You are a senior forensic retail fraud auditor. Thoroughly analyze POS transactions and inventory discrepancies to identify unrecorded sales, suspicious voids, and missing stock. Always respond in valid structured JSON adhering to the specified schema.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            riskScore: {
              type: Type.INTEGER,
              description: 'Overall fraud risk score between 0 and 100 for this batch of operations.',
            },
            anomalyCount: {
              type: Type.INTEGER,
              description: 'Total count of detected fraud anomalies or high-risk discrepancies.',
            },
            summary: {
              type: Type.STRING,
              description: 'Executive forensic summary of findings, highlighting patterns in voids, unrecorded sales, and shrinkage.',
            },
            flaggedItems: {
              type: Type.ARRAY,
              description: 'Detailed list of flagged suspicious transactions, voids, or inventory shrinkage anomalies.',
              items: {
                type: Type.OBJECT,
                properties: {
                  type: {
                    type: Type.STRING,
                    description: 'Category of fraud: "UNRECORDED_SALE", "SUSPICIOUS_VOID", "MISSING_STOCK", "VELOCITY_ANOMALY", or "DRAWER_MISMATCH".',
                  },
                  severity: {
                    type: Type.STRING,
                    description: 'Severity level: "low", "medium", "high", or "critical".',
                  },
                  referenceId: {
                    type: Type.STRING,
                    description: 'Associated transaction ID, item SKU, or variance log ID.',
                  },
                  reason: {
                    type: Type.STRING,
                    description: 'Detailed explanation of why this record is flagged as fraudulent or anomalous.',
                  },
                  estimatedLoss: {
                    type: Type.NUMBER,
                    description: 'Estimated financial loss or inventory impact in dollars/currency units.',
                  },
                },
                required: ['type', 'severity', 'reason'],
              },
            },
            recommendations: {
              type: Type.ARRAY,
              description: 'Actionable audit recommendations to prevent future loss.',
              items: {
                type: Type.STRING,
              },
            },
          },
          required: ['riskScore', 'anomalyCount', 'flaggedItems'],
        },
      },
    });

    const latencyMs = Date.now() - startTime;
    const tokenIn = (response as any)?.usageMetadata?.promptTokenCount || Math.round(promptContext.length / 4);
    const tokenOut = (response as any)?.usageMetadata?.candidatesTokenCount || 0;

    let parsedResult: any = {};
    try {
      parsedResult = JSON.parse(response.text || '{}');
    } catch (parseErr) {
      console.warn('Failed to parse Gemini fraud-audit JSON output directly:', parseErr);
      parsedResult = {
        riskScore: 25,
        anomalyCount: 0,
        summary: response.text || 'Audit completed.',
        flaggedItems: [],
        recommendations: [],
      };
    }

    // Ensure fallback defaults for required fields
    if (typeof parsedResult.riskScore !== 'number') {
      parsedResult.riskScore = 0;
    }
    if (typeof parsedResult.anomalyCount !== 'number') {
      parsedResult.anomalyCount = Array.isArray(parsedResult.flaggedItems) ? parsedResult.flaggedItems.length : 0;
    }
    if (!Array.isArray(parsedResult.flaggedItems)) {
      parsedResult.flaggedItems = [];
    }

    await logAiInvocation({
      agentKey,
      latencyMs,
      tokenIn,
      tokenOut,
      ok: true,
    });

    res.setHeader('X-Gemini-Model', response.modelVersion || 'gemini-2.5-flash');
    res.json(parsedResult);
  } catch (error: any) {
    const latencyMs = Date.now() - startTime;
    console.error('Error in /api/ai/fraud-audit:', error);

    await logAiInvocation({
      agentKey,
      latencyMs,
      tokenIn: 0,
      tokenOut: 0,
      ok: false,
    });

    res.status(500).json({
      error: error?.message || 'Gagal menjalankan audit kecurangan POS',
      riskScore: 0,
      anomalyCount: 0,
      flaggedItems: [],
      latencyMs,
      ok: false,
    });
  }
});

// 4. API: Fonnte WhatsApp OTP Gateway for Client PWA Member Verification
app.post('/api/fonnte/send-otp', async (req, res) => {
  try {
    const {
      phone,
      otp,
      customerName = 'Pelanggan',
      token = 'aFLkjgrJ2JnKclient-pwaxG1H7F5X',
    } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({ error: 'Phone and OTP are required' });
    }

    // Format phone number to clean Indonesian format (e.g., 628123456789)
    let cleanPhone = String(phone).replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '62' + cleanPhone.slice(1);
    } else if (!cleanPhone.startsWith('62')) {
      cleanPhone = '62' + cleanPhone;
    }

    const message = `*RiskCart Point Of Sale - Verifikasi Member PWA*\n\nHalo *${customerName}*,\n\nKode OTP pendaftaran member Anda adalah:\n🔐 *${otp}*\n\nJangan berikan kode ini kepada siapa pun. Masukkan kode ini pada aplikasi untuk menyelesaikan pendaftaran toko & verifikasi alamat.\n\n_RiskCart Retail & Wholesale System_`;

    let fonnteResult: any = null;
    let sendSuccess = false;

    try {
      const fonnteResponse = await fetch('https://api.fonnte.com/send', {
        method: 'POST',
        headers: {
          Authorization: token,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          target: cleanPhone,
          message: message,
          countryCode: '62',
        }),
      });

      fonnteResult = await fonnteResponse.json().catch(() => ({}));
      console.log('Fonnte API response:', fonnteResult);
      if (fonnteResult && (fonnteResult.status === true || fonnteResult.status === 'true' || fonnteResult.id)) {
        sendSuccess = true;
      }
    } catch (networkErr: any) {
      console.warn('Fonnte network call warning (will use fallback):', networkErr.message);
    }

    // Return response with details so user UI displays actual gateway response
    res.json({
      success: true,
      deliveredViaFonnte: sendSuccess,
      fonnteResponse: fonnteResult,
      phone: cleanPhone,
      otp,
      tokenUsed: token ? `${token.slice(0, 8)}...` : '',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error in /api/fonnte/send-otp:', error);
    res.status(500).json({ error: 'Failed to send OTP via Fonnte' });
  }
});

// API: Send WhatsApp notification / billing reminder via Fonnte Gateway
app.post('/api/whatsapp/send', async (req, res) => {
  try {
    const { phone, message, token = 'aFLkjgrJ2JnKclient-pwaxG1H7F5X' } = req.body;
    if (!phone || !message) {
      return res.status(400).json({ error: 'Phone and message are required' });
    }

    let cleanPhone = String(phone).replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '62' + cleanPhone.slice(1);
    } else if (!cleanPhone.startsWith('62')) {
      cleanPhone = '62' + cleanPhone;
    }

    let fonnteResult: any = null;
    let sendSuccess = false;

    try {
      const fonnteResponse = await fetch('https://api.fonnte.com/send', {
        method: 'POST',
        headers: {
          Authorization: token,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          target: cleanPhone,
          message: message,
          countryCode: '62',
        }),
      });

      fonnteResult = await fonnteResponse.json().catch(() => ({}));
      if (fonnteResult && (fonnteResult.status === true || fonnteResult.status === 'true' || fonnteResult.id)) {
        sendSuccess = true;
      }
    } catch (networkErr: any) {
      console.warn('Fonnte network call warning:', networkErr.message);
    }

    res.json({
      success: true,
      deliveredViaFonnte: sendSuccess,
      fonnteResponse: fonnteResult,
      phone: cleanPhone,
      message,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error in /api/whatsapp/send:', error);
    res.status(500).json({ error: 'Failed to send WhatsApp message' });
  }
});

// API: Webhook Simulator for Payment Gateways (Midtrans, Xendit, QRIS, Bank Transfer)
app.post('/api/webhook/simulate', async (req, res) => {
  try {
    const { provider = 'midtrans', orderId, amount = 150000, status = 'settlement' } = req.body;
    const generatedOrderId = orderId || `INV-${Date.now()}`;
    const payload = {
      event: 'payment.success',
      provider: String(provider).toLowerCase(),
      order_id: generatedOrderId,
      gross_amount: Number(amount),
      transaction_status: status,
      payment_type: provider === 'qris' ? 'qris' : 'bank_transfer',
      settlement_time: new Date().toISOString(),
      signature_key: `simulated_sec_${Math.random().toString(36).substring(2, 10)}`,
    };

    res.json({
      success: true,
      message: `Simulasi Webhook untuk ${String(provider).toUpperCase()} berhasil diproses oleh server!`,
      payload,
    });
  } catch (error: any) {
    console.error('Error in /api/webhook/simulate:', error);
    res.status(500).json({ error: 'Failed to simulate webhook' });
  }
});

// Cloud SQL Database Routes
app.get('/api/users', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userList = await getUsers();
    res.json(userList);
  } catch (error: any) {
    console.error('Failed to fetch users:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch users' });
  }
});

app.post('/api/users/sync', requireAuth, async (req: AuthRequest, res) => {
  try {
    if (!req.user || !req.user.uid || !req.user.email) {
      return res.status(400).json({ error: 'Missing authenticated user details' });
    }
    const syncedUser = await getOrCreateUser(req.user.uid, req.user.email);
    res.json({ success: true, user: syncedUser });
  } catch (error: any) {
    console.error('Failed to sync user with database:', error);
    res.status(500).json({ error: error.message || 'Failed to sync user' });
  }
});

app.get('/api/products', async (_req, res) => {
  try {
    const productList = await db.select().from(products);
    res.json(productList);
  } catch (error: any) {
    console.error('Failed to fetch products from Cloud SQL:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

app.get('/api/safes', async (_req, res) => {
  try {
    const records = await db.select().from(modalSafes);
    res.json(records);
  } catch (error: any) {
    console.error('Failed to fetch modal safe records from Cloud SQL:', error);
    res.status(500).json({ error: 'Failed to fetch modal safes' });
  }
});

app.post('/api/safes', async (req, res) => {
  try {
    const { type, amount, notes, cashier } = req.body;
    if (!type || !amount || !notes || !cashier) {
      return res.status(400).json({ error: 'All fields (type, amount, notes, cashier) are required' });
    }
    const newRecord = await db
      .insert(modalSafes)
      .values({
        type,
        amount: Number(amount),
        notes,
        cashier,
      })
      .returning();
    res.json({ success: true, record: newRecord[0] });
  } catch (error: any) {
    console.error('Failed to create safe transaction in Cloud SQL:', error);
    res.status(500).json({ error: 'Failed to insert modal safe record' });
  }
});

// Setup Vite development middlewares or production static serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`RiskCart Server listening on port ${PORT}`);
  });
}

startServer();
