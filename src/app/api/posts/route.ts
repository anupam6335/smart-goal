import { NextRequest, NextResponse } from 'next/server';
import { cacheGet, cacheSet } from '@/lib/cache-utils';

interface Post {
  userId: number;
  id: number;
  title: string;
  body: string;
}

const CACHE_KEY = 'posts:all';
const CACHE_TTL = 60; // seconds
const API_URL = 'https://jsonplaceholder.typicode.com/posts';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const refresh = searchParams.get('refresh') === 'true';

    // If not refreshing, try to get from cache
    if (!refresh) {
      const cachedData = await cacheGet<Post[]>(CACHE_KEY);
      if (cachedData !== null) {
        return NextResponse.json({
          data: cachedData,
          cached: true,
          source: 'cache',
        });
      }
    }

    // Fetch from external API with a timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    let response;
    try {
      response = await fetch(API_URL, {
        signal: controller.signal,
        headers: { 'Accept': 'application/json' },
      });
    } catch (fetchError) {
      clearTimeout(timeoutId);
      console.error('[Posts API] Fetch error:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch posts from external service' },
        { status: 504 } // Gateway Timeout
      );
    }
    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error(`[Posts API] External API returned ${response.status}`);
      return NextResponse.json(
        { error: `External API error: ${response.status}` },
        { status: response.status }
      );
    }

    let data: Post[];
    try {
      data = await response.json();
    } catch (parseError) {
      console.error('[Posts API] JSON parse error:', parseError);
      return NextResponse.json(
        { error: 'Invalid response from external service' },
        { status: 502 }
      );
    }

    // Store in cache (ignore failure – we still return the data)
    await cacheSet(CACHE_KEY, data, CACHE_TTL);

    return NextResponse.json({
      data,
      cached: false,
      source: 'external',
    });
  } catch (error) {
    console.error('[Posts API] Unhandled error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}