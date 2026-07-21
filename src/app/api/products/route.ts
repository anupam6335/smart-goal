import { NextRequest, NextResponse } from 'next/server';
import { cacheGet, cacheSet, cacheDelete } from '@/lib/cache-utils';

interface Product {
  id: number;
  title: string;
  description: string;
  price: number;
  discountPercentage: number;
  rating: number;
  stock: number;
  brand: string;
  category: string;
  thumbnail: string;
  images: string[];
}

const CACHE_KEY = 'products:all';
const CACHE_TTL = 60; // seconds
const API_BASE = 'https://dummyjson.com/products';
const PAGE_SIZE = 100;
const TOTAL_PRODUCTS = 15000;

/**
 * Fetch all products from DummyJSON by combining multiple pages.
 * Returns an array of products.
 */
async function fetchAllProducts(): Promise<Product[]> {
  const pageCount = TOTAL_PRODUCTS / PAGE_SIZE; // 10
  const promises = [];
  for (let i = 0; i < pageCount; i++) {
    const skip = i * PAGE_SIZE;
    const url = `${API_BASE}?limit=${PAGE_SIZE}&skip=${skip}&select=id,title,description,price,discountPercentage,rating,stock,brand,category,thumbnail,images`;
    promises.push(
      fetch(url, { headers: { 'Accept': 'application/json' } })
        .then(res => {
          if (!res.ok) throw new Error(`API responded with ${res.status}`);
          return res.json();
        })
        .then(data => data.products as Product[])
    );
  }
  const results = await Promise.all(promises);
  return results.flat();
}

/**
 * Artificial delay to simulate network latency.
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  try {
    const searchParams = request.nextUrl.searchParams;
    const refresh = searchParams.get('refresh') === 'true';

    // If refresh is false, try cache
    if (!refresh) {
      const cached = await cacheGet<Product[]>(CACHE_KEY);
      if (cached !== null) {
        const responseTimeMs = Date.now() - startTime;
        return NextResponse.json({
          data: cached,
          cached: true,
          source: 'cache',
          responseTimeMs,
          count: cached.length,
        });
      }
    }

    // Cache miss or refresh: fetch from external API
    const products = await fetchAllProducts();

    // Artificial delay to make the performance difference obvious
    await delay(1500);

    // Store in cache (ignore failure)
    await cacheSet(CACHE_KEY, products, CACHE_TTL);

    const responseTimeMs = Date.now() - startTime;
    return NextResponse.json({
      data: products,
      cached: false,
      source: 'external',
      responseTimeMs,
      count: products.length,
    });
  } catch (error) {
    console.error('[Products API] GET error:', error);
    const responseTimeMs = Date.now() - startTime;
    return NextResponse.json(
      {
        error: 'Failed to fetch products',
        responseTimeMs,
      },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const deleted = await cacheDelete(CACHE_KEY);
    return NextResponse.json({
      success: true,
      key: CACHE_KEY,
      deleted,
      message: deleted
        ? `Cache key "${CACHE_KEY}" deleted`
        : `Key "${CACHE_KEY}" did not exist`,
    });
  } catch (error) {
    console.error('[Products API] DELETE error:', error);
    return NextResponse.json(
      { error: 'Failed to invalidate cache' },
      { status: 500 }
    );
  }
}