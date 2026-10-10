import { addDoc, collection } from 'firebase/firestore';
import { db } from '../firebase';
import { DEMO_STORE_ID } from './dataSeeder';
import { RiskSeverity } from '../types';

export interface FraudAssessment {
  fraudScore: number;
  riskLevel: RiskSeverity;
  fraudFlags: string[];
  distanceToStoreMeters: number | null;
  isMockGpsSuspected: boolean;
  aiAvailable: boolean;
  aiExplanation: string;
  recommendation: 'approve' | 'review' | 'reject';
}

/** Menilai pesanan di server (aturan + Gemini). Melempar error jika server tidak terjangkau. */
export async function assessOrder(body: Record<string, unknown>): Promise<FraudAssessment> {
  const res = await fetch('/api/ai/anti-fraud', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Server anti-fraud menolak permintaan (HTTP ${res.status}).`);
  return (await res.json()) as FraudAssessment;
}

/** Catat ke fraud_logs untuk pesanan yang perlu ditinjau atau ditolak. */
export async function writeFraudLog(txId: string, a: FraudAssessment): Promise<void> {
  if (a.recommendation === 'approve') return;
  try {
    await addDoc(collection(db, 'fraud_logs'), {
      storeId: DEMO_STORE_ID,
      transactionId: txId,
      riskLevel: a.riskLevel,
      anomalyType: a.fraudFlags[0] || (a.recommendation === 'reject' ? 'AUTO_REJECT' : 'AUTO_REVIEW'),
      summary: `Skor ${a.fraudScore}/100, rekomendasi ${a.recommendation}. Flag: ${a.fraudFlags.join(', ') || '-'}`,
      aiDetails: a.aiExplanation,
      resolved: false,
      timestamp: new Date().toISOString(),
    });
  } catch (e) {
    console.warn('Gagal menulis fraud_logs:', e);
  }
}
