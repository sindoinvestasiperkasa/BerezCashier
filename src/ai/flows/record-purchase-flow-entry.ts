
'use server';
/**
 * @fileOverview Entry point aman untuk memanggil alur recordPurchase dari komponen React.
 */
import { recordPurchaseFlow, type RecordPurchaseInput, type RecordPurchaseOutput } from './record-purchase-flow';

// Fungsi wrapper yang aman untuk dipanggil dari komponen client/server Next.js
export async function recordPurchase(input: RecordPurchaseInput): Promise<RecordPurchaseOutput> {
  // Panggil flow secara langsung, Genkit akan menanganinya
  return await recordPurchaseFlow(input);
}
