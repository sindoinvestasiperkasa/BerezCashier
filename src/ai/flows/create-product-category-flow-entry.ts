
'use server';
/**
 * @fileOverview Entry point aman untuk memanggil alur createProductCategory dari komponen React.
 */
import { createProductCategoryFlow, type CreateProductCategoryInput, type CreateProductCategoryOutput } from './create-product-category-flow';

// Fungsi wrapper yang aman untuk dipanggil dari komponen client/server Next.js
export async function createProductCategory(input: CreateProductCategoryInput): Promise<CreateProductCategoryOutput> {
  // Panggil flow secara langsung, Genkit akan menanganinya
  return await createProductCategoryFlow(input);
}
