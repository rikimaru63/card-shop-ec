
// src/app/admin/products/actions.ts
'use server';

import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

const prisma = new PrismaClient();

const productSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  price: z.preprocess(
    (a) => parseFloat(z.string().parse(a)),
    z.number().positive('Price must be a positive number')
  ),
  stock: z.preprocess(
    (a) => parseInt(z.string().parse(a), 10),
    z.number().int().min(0, 'Stock cannot be negative')
  ),
  imageUrl: z.string().url('Invalid image URL').optional().or(z.literal('')),
});

export async function createProduct(formData: FormData) {
  try {
    const validatedFields = productSchema.safeParse({
      name: formData.get('name'),
      price: formData.get('price'),
      stock: formData.get('stock'),
      imageUrl: formData.get('imageUrl'),
    });

    if (!validatedFields.success) {
      return {
        errors: validatedFields.error.flatten().fieldErrors,
        message: 'Failed to create product due to validation errors.',
      };
    }

    const { name, price, stock, imageUrl } = validatedFields.data;

    // For simplicity, we'll assign to the existing 'Pokemon Cards' category
    // In a real app, you'd likely have a selection for categories
    const pokemonCategory = await prisma.category.findUnique({
      where: { slug: 'pokemon-cards' },
    });

    if (!pokemonCategory) {
      throw new Error('Pokemon Cards category not found. Please seed the category first.');
    }

    const newProduct = await prisma.product.create({
      data: {
        name,
        slug: name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, ''),
        sku: `PKM-${name.toUpperCase().replace(/ /g, '')}-${Math.floor(Math.random() * 1000)}`,
        description: `A product created via admin dashboard: ${name}`,
        price,
        stock,
        categoryId: pokemonCategory.id,
        images: imageUrl
          ? {
              create: {
                url: imageUrl,
                alt: name,
              },
            }
          : undefined,
      },
    });

    revalidatePath('/admin/products');
    return { success: true, product: newProduct };
  } catch (error) {
    console.error('Error creating product:', error);
    return { success: false, message: 'Failed to create product.' };
  }
}

export async function updateProduct(id: string, formData: FormData) {
  try {
    const validatedFields = productSchema.safeParse({
      name: formData.get('name'),
      price: formData.get('price'),
      stock: formData.get('stock'),
      imageUrl: formData.get('imageUrl'),
    });

    if (!validatedFields.success) {
      return {
        errors: validatedFields.error.flatten().fieldErrors,
        message: 'Failed to update product due to validation errors.',
      };
    }

    const { name, price, stock, imageUrl } = validatedFields.data;

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        name,
        slug: name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, ''),
        price,
        stock,
        images: {
          upsert: {
            where: { productId: id },
            create: { url: imageUrl || 'https://placehold.co/400x600', alt: name },
            update: { url: imageUrl || 'https://placehold.co/400x600', alt: name },
          },
        },
      },
    });

    revalidatePath('/admin/products');
    return { success: true, product: updatedProduct };
  } catch (error) {
    console.error('Error updating product:', error);
    return { success: false, message: 'Failed to update product.' };
  }
}

export async function deleteProduct(id: string) {
  try {
    await prisma.product.delete({
      where: { id },
    });

    revalidatePath('/admin/products');
    return { success: true, message: 'Product deleted successfully.' };
  } catch (error) {
    console.error('Error deleting product:', error);
    return { success: false, message: 'Failed to delete product.' };
  }
}
