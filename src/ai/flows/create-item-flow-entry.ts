
'use server';
/**
 * @fileOverview Entry point aman untuk memanggil alur createItem dari komponen React.
 */
import { runFlow } from 'genkit';
import { createItemFlow, type CreateItemInput, type CreateItemOutput } from './create-item-flow';

// Re-export tipe agar bisa diimpor dari satu tempat
export type { CreateItemInput, CreateItemOutput };

// Fungsi wrapper yang aman untuk dipanggil dari komponen client/server Next.js
export async function createItem(input: CreateItemInput): Promise<CreateItemOutput> {
  return await runFlow(createItemFlow, input);
}
