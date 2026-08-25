import { NextRequest, NextResponse } from 'next/server';
import { getAllProducts } from '@/lib/db';
import { memoryCacheGet, memoryCacheSet } from '@/lib/memory-cache';
import { CACHE_KEYS, DEFAULT_CACHE_TTL } from '@/lib/constants';

const CACHE_KEY = CACHE_KEYS.PATTERNS_PRODUCTS;

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const refresh = request.nextUrl.searchParams.get('refresh') === 'true';

  try {
    let data;
    let cached = false;

    if (refresh) {
      data = await getAllProducts();
      memoryCacheSet(CACHE_KEY, data, DEFAULT_CACHE_TTL);
      cached = false;
    } else {
      const cachedData = memoryCacheGet<any[]>(CACHE_KEY);
      if (cachedData) {
        data = cachedData;
        cached = true;
      } else {
        data = await getAllProducts();
        memoryCacheSet(CACHE_KEY, data, DEFAULT_CACHE_TTL);
        cached = false;
      }
    }

    const responseTimeMs = Date.now() - startTime;

    return NextResponse.json({
      data,
      cached,
      source: cached ? 'cache' : 'database',
      responseTimeMs,
      count: data.length,
    });
  } catch (error) {
    const responseTimeMs = Date.now() - startTime;
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to fetch products',
        responseTimeMs,
      },
      { status: 500 }
    );
  }
}