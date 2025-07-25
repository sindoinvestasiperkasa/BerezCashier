
'use server';
/**
 * @fileOverview Entry point aman untuk memanggil alur createProductCategory dari komponen React.
 */
import { runFlow } from '@genkit-ai/next';
import { createProductCategoryFlow } from './create-product-category-flow';
import type { CreateProductCategoryInput, CreateProductCategoryOutput } from './create-product-category-flow';

// Fungsi wrapper yang aman untuk dipanggil dari komponen client/server Next.js
export async function createProductCategory(input: CreateProductCategoryInput): Promise<CreateProductCategoryOutput> {
  return await runFlow(createProductCategoryFlow, input);
}
