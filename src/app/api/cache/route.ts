import { NextRequest, NextResponse } from 'next/server';
import { cacheDelete, cacheClear } from '@/lib/cache-utils';

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const key = searchParams.get('key');
    const pattern = searchParams.get('pattern');

    // Validate that either key or pattern is provided
    if (!key && !pattern) {
      return NextResponse.json(
        { error: 'Either "key" or "pattern" query parameter is required' },
        { status: 400 }
      );
    }

    // If both are provided, prefer pattern (clear multiple keys)
    if (pattern) {
      const deletedCount = await cacheClear(pattern);
      if (deletedCount === -1) {
        return NextResponse.json(
          { error: 'Failed to clear cache by pattern' },
          { status: 500 }
        );
      }
      return NextResponse.json({
        success: true,
        pattern,
        deletedCount,
        message: `Cleared ${deletedCount} keys matching pattern "${pattern}"`,
      });
    }

    // Single key deletion
    if (key) {
      const deleted = await cacheDelete(key);
      return NextResponse.json({
        success: deleted,
        key,
        message: deleted
          ? `Key "${key}" deleted successfully`
          : `Key "${key}" not found or could not be deleted`,
      });
    }

    // Fallback (should never reach here)
    return NextResponse.json(
      { error: 'Invalid parameters' },
      { status: 400 }
    );
  } catch (error) {
    console.error('[Cache API] Unhandled error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}