
// src/app/admin/products/actions.ts
'use server';

import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';

const prisma = new PrismaClient();

// 関税率（20%）
const DUTY_RATE = 1.2;

const productSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  basePrice: z.preprocess(
    (a) => parseFloat(z.string().parse(a)),
    z.number().positive('Base price must be a positive number')
  ),
  stock: z.preprocess(
    (a) => parseInt(z.string().parse(a), 10),
    z.number().int().min(0, 'Stock cannot be negative')
  ),
  imageUrl: z.string().url('Invalid image URL').optional().or(z.literal('')),
  isNewArrival: z.preprocess((a) => a === 'true' || a === true, z.boolean()).optional(),
  isRecommended: z.preprocess((a) => a === 'true' || a === true, z.boolean()).optional(),
});

export async function createProduct(formData: FormData) {
  try {
    const validatedFields = productSchema.safeParse({
      name: formData.get('name'),
      basePrice: formData.get('basePrice'),
      stock: formData.get('stock'),
      imageUrl: formData.get('imageUrl'),
      isNewArrival: formData.get('isNewArrival'),
      isRecommended: formData.get('isRecommended'),
    });

    if (!validatedFields.success) {
      return {
        errors: validatedFields.error.flatten().fieldErrors,
        message: 'Failed to create product due to validation errors.',
      };
    }

    const { name, basePrice, stock, imageUrl, isNewArrival, isRecommended } = validatedFields.data;

    // 原価に関税20%を上乗せして販売価格を算出
    const sellingPrice = basePrice * DUTY_RATE;

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
        price: sellingPrice, // 販売価格（関税込み）を保存
        cost: basePrice, // 原価を cost カラムに保存（オプション）
        stock,
        isNewArrival: isNewArrival || false,
        isRecommended: isRecommended || false,
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
    revalidatePath('/');
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
      basePrice: formData.get('basePrice'),
      stock: formData.get('stock'),
      imageUrl: formData.get('imageUrl'),
      isNewArrival: formData.get('isNewArrival'),
      isRecommended: formData.get('isRecommended'),
    });

    if (!validatedFields.success) {
      return {
        errors: validatedFields.error.flatten().fieldErrors,
        message: 'Failed to update product due to validation errors.',
      };
    }

    const { name, basePrice, stock, imageUrl, isNewArrival, isRecommended } = validatedFields.data;

    // 原価に関税20%を上乗せして販売価格を算出
    const newSellingPrice = basePrice * DUTY_RATE;

    // 現在の商品情報を取得（価格変動チェック用）
    const existingProduct = await prisma.product.findUnique({
      where: { id },
      select: { price: true }
    });

    // 価格変動データを準備
    let priceChangeData = {};
    if (existingProduct) {
      const currentPrice = Number(existingProduct.price);
      // 価格が変わった場合のみ履歴を保存
      if (Math.abs(currentPrice - newSellingPrice) > 0.01) {
        priceChangeData = {
          previousPrice: currentPrice,
          lastPriceChange: new Date(),
        };
      }
    }

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        name,
        slug: name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, ''),
        price: newSellingPrice, // 販売価格（関税込み）を保存
        cost: basePrice, // 原価を cost カラムに保存（オプション）
        stock,
        isNewArrival: isNewArrival || false,
        isRecommended: isRecommended || false,
        ...priceChangeData, // 価格変動があった場合のみ更新
        images: {
          deleteMany: {}, // Delete all existing images
          create: imageUrl // Create a new one if imageUrl is provided
            ? {
                url: imageUrl,
                alt: name,
              }
            : undefined,
        },
      },
    });

    revalidatePath('/admin/products');
    revalidatePath('/');
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
    revalidatePath('/');
    return { success: true, message: 'Product deleted successfully.' };
  } catch (error) {
    console.error('Error deleting product:', error);
    return { success: false, message: 'Failed to delete product.' };
  }
}
