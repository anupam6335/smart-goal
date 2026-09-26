import { NextRequest, NextResponse } from 'next/server';
import {
  buildUploadResponse,
  fileToDataUrl,
  validateUpload,
} from '@/app/smart-goal-60/todo/lib/upload';
import {
  checkRateLimit,
  getClientIdentifier,
} from '@/app/smart-goal-60/todo/lib/rate-limit';

export const dynamic = 'force-dynamic';

const UPLOAD_LIMIT = 10;

const NO_STORE_HEADERS = { 'Cache-Control': 'no-store' } as const;

export async function POST(request: NextRequest) {
  const identifier = getClientIdentifier(request.headers);
  const limit = await checkRateLimit(identifier, UPLOAD_LIMIT);

  if (!limit.allowed) {
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((limit.resetAt - Date.now()) / 1000)
    );
    return NextResponse.json(
      { error: 'Too many uploads. Please try again later.' },
      {
        status: 429,
        headers: {
          ...NO_STORE_HEADERS,
          'X-RateLimit-Remaining': String(limit.remaining),
          'X-RateLimit-Reset': String(Math.floor(limit.resetAt / 1000)),
          'Retry-After': String(retryAfterSeconds),
        },
      }
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: 'Request must be multipart/form-data' },
      { status: 400, headers: NO_STORE_HEADERS }
    );
  }

  const file = formData.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: 'Field "file" is required and must be a file' },
      { status: 400, headers: NO_STORE_HEADERS }
    );
  }

  const validation = validateUpload(file);
  if (!validation.ok) {
    return NextResponse.json(
      { error: validation.error },
      { status: 400, headers: NO_STORE_HEADERS }
    );
  }

  try {
    const dataUrl = await fileToDataUrl(file);
    const payload = buildUploadResponse(file, dataUrl);
    return NextResponse.json(payload, {
      status: 201,
      headers: NO_STORE_HEADERS,
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to process file' },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}