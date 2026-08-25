import { NextRequest, NextResponse } from 'next/server';
import { getProductById, updateProduct, deleteProduct, Product } from '@/lib/db';
import { writeThroughInvalidate } from '@/lib/cache-patterns';
import { CACHE_KEYS } from '@/lib/constants';

const CACHE_KEY = CACHE_KEYS.PATTERNS_PRODUCTS;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now();

  try {
    const { id } = await params;
    const productId = parseInt(id);

    if (isNaN(productId)) {
      return NextResponse.json(
        { error: 'Invalid product ID' },
        { status: 400 }
      );
    }

    const product = await getProductById(productId);

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    const responseTimeMs = Date.now() - startTime;

    return NextResponse.json({
      data: product,
      responseTimeMs,
      source: 'database',
    });
  } catch (error) {
    const responseTimeMs = Date.now() - startTime;
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to fetch product',
        responseTimeMs,
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now();

  try {
    const { id } = await params;
    const productId = parseInt(id);

    if (isNaN(productId)) {
      return NextResponse.json(
        { error: 'Invalid product ID' },
        { status: 400 }
      );
    }

    const body = await request.json();

    const existing = await getProductById(productId);
    if (!existing) {
      return NextResponse.json(
        { error: `Product with ID ${productId} not found` },
        { status: 404 }
      );
    }

    if (body.price !== undefined && (typeof body.price !== 'number' || body.price < 0)) {
      return NextResponse.json(
        { error: 'Price must be a positive number' },
        { status: 400 }
      );
    }

    const updateData: Partial<Omit<Product, 'id'>> = {};
    const updatableFields = [
      'title', 'description', 'price', 'discountPercentage',
      'rating', 'stock', 'brand', 'category', 'thumbnail', 'images'
    ];
    updatableFields.forEach((field) => {
      if (body[field] !== undefined) {
        (updateData as any)[field] = body[field];
      }
    });

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }

    const result = await writeThroughInvalidate(
      CACHE_KEY,
      async () => {
        const updated = await updateProduct(productId, updateData);
        if (!updated) {
          throw new Error(`Failed to update product with ID ${productId}`);
        }
        return updated;
      }
    );

    const responseTimeMs = Date.now() - startTime;

    return NextResponse.json({
      data: result,
      pattern: 'write-through (invalidate)',
      responseTimeMs,
      message: `Product "${result.title}" updated`,
    });
  } catch (error) {
    const responseTimeMs = Date.now() - startTime;
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to update product',
        responseTimeMs,
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now();

  try {
    const { id } = await params;
    const productId = parseInt(id);

    if (isNaN(productId)) {
      return NextResponse.json(
        { error: 'Invalid product ID' },
        { status: 400 }
      );
    }

    const existing = await getProductById(productId);
    if (!existing) {
      return NextResponse.json(
        { error: `Product with ID ${productId} not found` },
        { status: 404 }
      );
    }

    const result = await writeThroughInvalidate(
      CACHE_KEY,
      async () => {
        const deleted = await deleteProduct(productId);
        if (!deleted) {
          throw new Error(`Failed to delete product with ID ${productId}`);
        }
        return { id: productId, deleted: true };
      }
    );

    const responseTimeMs = Date.now() - startTime;

    return NextResponse.json({
      data: result,
      pattern: 'write-through (invalidate)',
      responseTimeMs,
      message: `Product "${existing.title}" deleted`,
    });
  } catch (error) {
    const responseTimeMs = Date.now() - startTime;
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to delete product',
        responseTimeMs,
      },
      { status: 500 }
    );
  }
}