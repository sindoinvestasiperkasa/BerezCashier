
'use server';
/**
 * @fileOverview Entry point aman untuk memanggil alur createItem dari komponen React.
 */
import { createItemFlow, type CreateItemInput, type CreateItemOutput } from './create-item-flow';

// Fungsi wrapper yang aman untuk dipanggil dari komponen client/server Next.js
export async function createItem(input: CreateItemInput): Promise<CreateItemOutput> {
  // Panggil flow secara langsung, Genkit akan menanganinya
  return await createItemFlow({ input });
}
