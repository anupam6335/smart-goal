import { NextRequest, NextResponse } from 'next/server';
import { createProduct, Product } from '@/lib/db';
import { cacheGet, cacheSet } from '@/lib/cache-utils';
import { CACHE_KEYS, DEFAULT_CACHE_TTL } from '@/lib/constants';

const CACHE_KEY = CACHE_KEYS.PATTERNS_PRODUCTS;

const writeQueue: Array<{ data: Omit<Product, 'id'>; resolve: (value: Product) => void; reject: (reason?: any) => void }> = [];
const BATCH_INTERVAL = 2000;
const MAX_BATCH_SIZE = 10;
let isProcessing = false;

function processQueue() {
  if (isProcessing || writeQueue.length === 0) return;
  isProcessing = true;

  const batch = writeQueue.splice(0, MAX_BATCH_SIZE);

  Promise.all(
    batch.map(async (item) => {
      try {
        const product = await createProduct(item.data);
        const cached = await cacheGet<any[]>(CACHE_KEY);
        if (cached !== null) {
          const updated = [...cached, product];
          await cacheSet(CACHE_KEY, updated, DEFAULT_CACHE_TTL);
        }
        item.resolve(product);
      } catch (err) {
        item.reject(err);
      }
    })
  ).finally(() => {
    isProcessing = false;
    if (writeQueue.length > 0) {
      setTimeout(processQueue, BATCH_INTERVAL);
    }
  });
}

setInterval(() => {
  if (!isProcessing && writeQueue.length > 0) {
    processQueue();
  }
}, BATCH_INTERVAL);

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const searchParams = request.nextUrl.searchParams;
    const variant = searchParams.get('variant') || 'simple';

    if (variant !== 'simple' && variant !== 'queue') {
      return NextResponse.json(
        {
          error: 'Invalid variant. Use ?variant=simple or ?variant=queue',
          validVariants: ['simple', 'queue'],
        },
        { status: 400 }
      );
    }

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

    const tempProduct: Product = {
      ...productData,
      id: Date.now(),
      _pending: true,
    } as any;

    const cached = await cacheGet<any[]>(CACHE_KEY);
    if (cached !== null) {
      const updated = [...cached, tempProduct];
      await cacheSet(CACHE_KEY, updated, DEFAULT_CACHE_TTL);
    } else {
      await cacheSet(CACHE_KEY, [tempProduct], DEFAULT_CACHE_TTL);
    }

    if (variant === 'simple') {
      setImmediate(async () => {
        try {
          const product = await createProduct(productData);
          const current = await cacheGet<any[]>(CACHE_KEY);
          if (current !== null) {
            const filtered = current.filter((p) => p._pending !== true);
            const updated = [...filtered, product];
            await cacheSet(CACHE_KEY, updated, DEFAULT_CACHE_TTL);
          }
        } catch (error) {
        }
      });
    } else {
      new Promise<Product>((resolve, reject) => {
        writeQueue.push({
          data: productData,
          resolve,
          reject,
        });
        if (!isProcessing) {
          setTimeout(processQueue, BATCH_INTERVAL);
        }
      });
    }

    const responseTimeMs = Date.now() - startTime;

    return NextResponse.json({
      data: tempProduct,
      pattern: 'write-behind',
      variant,
      responseTimeMs,
      cached: true,
      message: variant === 'simple'
        ? `Product "${tempProduct.title}" created using Write-Behind (simple) - Redis updated`
        : `Product "${tempProduct.title}" queued using Write-Behind (queue) - Redis updated`,
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
  const queueSize = writeQueue.length;
  return NextResponse.json({
    pattern: 'write-behind',
    variants: {
      simple: {
        description: 'Immediate async DB write using setImmediate',
        flow: 'Client → API → Redis → setImmediate(DB) → Response',
        useCase: 'Low-volume writes where immediate DB consistency is not critical',
      },
      queue: {
        description: 'Batched DB writes with interval (2s batch, max 10 per batch)',
        flow: 'Client → API → Redis → Queue → Batch → DB → Response',
        useCase: 'High-volume writes where batching improves throughput',
      },
    },
    endpoint: 'POST /api/products/behind?variant=simple|queue',
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
    queueStatus: {
      pendingItems: queueSize,
      batchInterval: `${BATCH_INTERVAL}ms`,
      maxBatchSize: MAX_BATCH_SIZE,
    },
  });
}