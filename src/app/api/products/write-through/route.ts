import { NextRequest, NextResponse } from 'next/server';
import { createProduct, Product } from '@/lib/db';
import { memoryCacheGet, memoryCacheSet } from '@/lib/memory-cache';
import { CACHE_KEYS, DEFAULT_CACHE_TTL } from '@/lib/constants';

const CACHE_KEY = CACHE_KEYS.PATTERNS_PRODUCTS;

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body = await request.json();

    const required = ['title', 'description', 'price', 'brand', 'category'];
    const missing = required.filter((field) => !body[field]);
    if (missing.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missing.join(', ')}` },
        { status: 400 }
      );
    }

    if (typeof body.price !== 'number' || body.price < 0) {
      return NextResponse.json(
        { error: 'Price must be a positive number' },
        { status: 400 }
      );
    }

    const productData: Omit<Product, 'id'> = {
      title: body.title,
      description: body.description,
      price: body.price,
      discountPercentage: body.discountPercentage || 0,
      rating: body.rating || 0,
      stock: body.stock || 0,
      brand: body.brand,
      category: body.category,
      thumbnail: body.thumbnail || `https://picsum.photos/seed/${Date.now()}/200/200`,
      images: body.images || [`https://picsum.photos/seed/${Date.now()}/400/400`],
    };

    const result = await createProduct(productData);

    const cached = memoryCacheGet<any[]>(CACHE_KEY);
    if (cached) {
      const updated = [...cached, result];
      memoryCacheSet(CACHE_KEY, updated, DEFAULT_CACHE_TTL);
    } else {
      memoryCacheSet(CACHE_KEY, [result], DEFAULT_CACHE_TTL);
    }

    const responseTimeMs = Date.now() - startTime;

    return NextResponse.json({
      data: result,
      pattern: 'write-through',
      responseTimeMs,
      cached: true,
      message: `Product "${result.title}" created (DB + cache updated)`,
    });
  } catch (error) {
    const responseTimeMs = Date.now() - startTime;
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to create product',
        responseTimeMs,
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    pattern: 'write-through',
    description: 'Writes to database and cache synchronously',
    flow: 'Client → API → DB → Cache → Response',
    useCase: 'Data consistency critical (inventory, user profiles)',
    endpoint: 'POST /api/products/write-through',
    body: {
      title: 'string (required)',
      description: 'string (required)',
      price: 'number (required)',
      brand: 'string (required)',
      category: 'string (required)',
      discountPercentage: 'number (optional, default: 0)',
      rating: 'number (optional, default: 0)',
      stock: 'number (optional, default: 0)',
      thumbnail: 'string (optional)',
      images: 'string[] (optional)',
    },
  });
}