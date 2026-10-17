import { supabase, isSupabaseConfigured } from './supabaseClient';
import type { ScanHistoryRecord, ProductVerdict } from '../types/analysis';

const DEMO_HISTORY_STORAGE_KEY = 'ingredia_demo_scan_history_v1';

export async function getScanHistory(userId?: string): Promise<ScanHistoryRecord[]> {
  if (isSupabaseConfigured && supabase && userId) {
    try {
      const { data, error } = await supabase
        .from('scan_history')
        .select('*')
        .eq('user_id', userId)
        .order('scanned_at', { ascending: false });

      if (!error && data) {
        return data.map((d: {
          id: string;
          user_id: string;
          product_id: string;
          barcode: string;
          product_name: string;
          brand?: string;
          image_url?: string;
          verdict: ProductVerdict;
          source: string;
          scanned_at: string;
          analysis_snapshot: ScanHistoryRecord['analysisSnapshot'];
          product_snapshot: ScanHistoryRecord['productSnapshot'];
        }) => ({
          id: d.id,
          userId: d.user_id,
          productId: d.product_id,
          barcode: d.barcode,
          productName: d.product_name,
          brand: d.brand,
          imageUrl: d.image_url,
          verdict: d.verdict,
          source: d.source,
          scannedAt: d.scanned_at,
          analysisSnapshot: d.analysis_snapshot,
          productSnapshot: d.product_snapshot,
        }));
      }
    } catch (e) {
      console.warn('Failed to query Supabase history:', e);
    }
  }

  // Fallback to local storage
  const stored = localStorage.getItem(DEMO_HISTORY_STORAGE_KEY);
  if (stored) {
    try {
      const parsed: ScanHistoryRecord[] = JSON.parse(stored);
      return parsed.sort((a, b) => new Date(b.scannedAt).getTime() - new Date(a.scannedAt).getTime());
    } catch (e) {
      console.error('Failed to parse local history:', e);
    }
  }

  return [];
}

export async function saveScanRecord(record: ScanHistoryRecord): Promise<{ success: boolean; error?: string }> {
  // Always update local storage
  try {
    const existing = await getScanHistory();
    // Prepend new record, avoiding immediate exact duplicates
    const filtered = existing.filter(r => !(r.barcode === record.barcode && r.scannedAt === record.scannedAt));
    const updated = [record, ...filtered];
    localStorage.setItem(DEMO_HISTORY_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed saving to localStorage history:', e);
  }

  // Save to Supabase if configured and authenticated
  if (isSupabaseConfigured && supabase && record.userId && !record.userId.startsWith('demo-')) {
    try {
      const { error } = await supabase.from('scan_history').insert({
        id: record.id,
        user_id: record.userId,
        product_id: record.productId,
        barcode: record.barcode,
        product_name: record.productName,
        brand: record.brand,
        image_url: record.imageUrl,
        verdict: record.verdict,
        source: record.source,
        scanned_at: record.scannedAt,
        analysis_snapshot: record.analysisSnapshot,
        product_snapshot: record.productSnapshot,
      });

      if (error) {
        return { success: false, error: error.message };
      }
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : 'Unknown database error' };
    }
  }

  return { success: true };
}

export async function deleteScanRecord(recordId: string, userId?: string): Promise<boolean> {
  // Update local storage
  const existing = await getScanHistory();
  const updated = existing.filter(r => r.id !== recordId);
  localStorage.setItem(DEMO_HISTORY_STORAGE_KEY, JSON.stringify(updated));

  // Supabase delete if configured
  if (isSupabaseConfigured && supabase && userId) {
    try {
      await supabase.from('scan_history').delete().eq('id', recordId).eq('user_id', userId);
    } catch (e) {
      console.error('Failed to delete scan record from Supabase:', e);
      return false;
    }
  }

  return true;
}

export async function clearAllHistory(userId?: string): Promise<boolean> {
  localStorage.removeItem(DEMO_HISTORY_STORAGE_KEY);

  if (isSupabaseConfigured && supabase && userId) {
    try {
      await supabase.from('scan_history').delete().eq('user_id', userId);
    } catch (e) {
      console.error('Failed to clear Supabase history:', e);
      return false;
    }
  }

  return true;
}
