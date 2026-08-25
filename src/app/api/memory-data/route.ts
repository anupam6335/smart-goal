import { NextResponse } from 'next/server';
import { getAllProducts } from '@/lib/db';
import { cacheGet } from '@/lib/cache-utils';
import { CACHE_KEYS } from '@/lib/constants';

export async function GET() {
  const products = await getAllProducts();
  const cacheData = await cacheGet<any[]>(CACHE_KEYS.PATTERNS_PRODUCTS);

  return NextResponse.json({
    database: {
      count: products.length,
      data: products,
    },
    cache: {
      key: CACHE_KEYS.PATTERNS_PRODUCTS,
      count: cacheData ? cacheData.length : 0,
      data: cacheData || null,
    },
    timestamp: new Date().toISOString(),
  });
}