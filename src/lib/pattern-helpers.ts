import { NextResponse } from 'next/server';

export const getProductKey = (id: number) => `product:${id}`;
export const getListKey = (pattern: string) => `products:${pattern}`;

export interface ApiResponse<T = any> {
  data?: T;
  cached?: boolean;
  source?: 'cache' | 'db';
  responseTimeMs: number;
  pattern: string;
  operation: string;
  dbLatencyMs?: number;
  queueSize?: number;
  error?: string;
  message?: string;
}

export const successResponse = <T>(
  data: T,
  cached: boolean,
  source: 'cache' | 'db',
  responseTimeMs: number,
  pattern: string,
  operation: string,
  extra: Partial<ApiResponse> = {}
): NextResponse => {
  return NextResponse.json({
    data,
    cached,
    source,
    responseTimeMs,
    pattern,
    operation,
    ...extra,
  } as ApiResponse<T>);
};

export const errorResponse = (
  error: string,
  responseTimeMs: number,
  pattern: string,
  operation: string,
  status: number = 500
): NextResponse => {
  return NextResponse.json(
    {
      error,
      responseTimeMs,
      pattern,
      operation,
    } as ApiResponse,
    { status }
  );
};