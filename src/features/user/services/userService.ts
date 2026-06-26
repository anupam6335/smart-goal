export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public details?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

const BASE_URL = 'https://jsonplaceholder.typicode.com';


export async function apiRequest<T>(
  endpoint: string,
  options?: RequestInit & { next?: { revalidate?: number } }
): Promise<T | null> {
  let response: Response;

  try {
    response = await fetch(`${BASE_URL}${endpoint}`, options);
  } catch (networkError) {
    throw new ApiError(
      'Network error – unable to reach the server.',
      undefined,
      String(networkError)
    );
  }

  const { ok, status, statusText } = response;

  if (!ok) {
    let errorDetail = '';
    try {
      const errorBody = await response.json();
      errorDetail = errorBody.message || JSON.stringify(errorBody);
    } catch {
      // If response is not JSON, ignore
    }
    const errorMessages: Record<number, string> = {
      400: 'Bad request – please check your input.',
      401: 'Unauthorized – please log in.',
      404: 'Requested data not found.',
      500: 'Server error – please try again later.',
    };
    const message =
      errorMessages[status] || `Unexpected error (${status}): ${statusText}`;
    throw new ApiError(message, status, errorDetail);
  }

  if (status === 204) {
    return null;
  }

  let data: T;
  try {
    data = await response.json();
  } catch (parseError) {
    throw new ApiError('Failed to parse server response.');
  }

  return data;
}

export interface User {
  id: number;
  name: string;
  email: string;
  address?: {
    street: string;
    city: string;
    zipcode: string;
  };
}

export async function getUsers(): Promise<User[]> {
  // Explicit caching: revalidate every 60 seconds
  const result = await apiRequest<User[]>('/users', {
    next: { revalidate: 60 },
  });
  return result ?? [];
}

export async function getUserById(id: number): Promise<User | null> {
  return apiRequest<User>(`/users/${id}`);
}

/**
 * Group users by email domain (complex object operation)
 * Uses reduce and safe destructuring.
 */
export function groupByDomain(users: User[]): Record<string, number> {
  return users.reduce((acc, { email }) => {
    const domain = email?.split('@')[1]?.toLowerCase().trim() ?? 'unknown';
    acc[domain] = (acc[domain] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);
}

/**
 * Returns top N users with uppercase names using slice + map.
 */
export function getTopUsers(users: User[], limit = 5) {
  return users
    .slice(0, limit)
    .map(({ id, name, email }) => ({
      id,
      displayName: name.toUpperCase(),
      email,
    }));
}