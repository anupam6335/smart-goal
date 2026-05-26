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

async function apiRequest<T>(endpoint: string): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${BASE_URL}${endpoint}`);
  } catch (networkError) {
    throw new ApiError(
      'Network error – unable to reach the server.',
      undefined,
      String(networkError)
    );
  }

  //  Nested destructuring with fallback
  const { ok, status, statusText } = response;

  if (!ok) {
    const errorMessages: Record<number, string> = {
      400: 'Bad request – please check your input.',
      401: 'Unauthorized – please log in.',
      404: 'Requested data not found.',
      500: 'Server error – please try again later.',
    };
    const message =
      errorMessages[status] || `Unexpected error (${status}): ${statusText}`;
    throw new ApiError(message, status);
  }

  // Handle 204 No Content
  if (status === 204) {
    return null as T;
  }

  //  Safe JSON parsing with error handling
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
  return apiRequest<User[]>('/users');
}

export async function getUserById(id: number): Promise<User> {
  return apiRequest<User>(`/users/${id}`);
}

/**
 *  Complex object operation: group users by email domain
 * Uses reduce and safe destructuring
 */
export function groupByDomain(users: User[]): Record<string, number> {
  return users.reduce((acc, { email }) => {
    const domain = email?.split('@')[1] ?? 'unknown';
    acc[domain] = (acc[domain] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);
}

/**
 *  Functional: filter + map + reduce
 * Returns top 5 users with uppercase names
 */
export function getTopUsers(users: User[], limit = 5) {
  return users
    .filter((_, idx) => idx < limit)          // pure functional
    .map(({ id, name, email }) => ({          // destructuring
      id,
      displayName: name.toUpperCase(),
      email,
    }));
}