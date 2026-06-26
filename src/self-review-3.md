# Self-Review: smart goal 3

Overview

This review covers the additional improvements made after the initial submission of Review 2. The changes focus on enhancing the service layer, adding request cancellation and search functionality on the client, and improving overall code performance.


1. Service Layer Enhancements

a. apiRequest now accepts request options

Previous behaviour
The apiRequest function only accepted an endpoint and always performed a GET request. This made it impossible to use for POST, PUT, or DELETE operations.

What was changed
I updated apiRequest to accept an optional options parameter. This allows the same helper to handle different HTTP methods and also supports Next.js caching through next.revalidate, instead of creating separate request helpers.

Code before

```ts
async function apiRequest<T>(endpoint: string): Promise<T>
```

Code after

```ts
export async function apiRequest<T>(
  endpoint: string,
  options?: RequestInit & { next?: { revalidate?: number } }
): Promise<T | null>
```

Why this improves the code

• The same helper can now be reused for GET, POST, PUT and DELETE requests.
• It keeps the service layer consistent instead of introducing multiple request functions.
• It also allows caching options to be passed whenever they're needed.


b. Error response body parsing

Previous behaviour
When the server returned an error (4xx or 5xx), we threw a generic message like “Bad request – please check your input.” The actual server error details were lost.

What was changed
Instead of returning only a generic error message, I now try to read the response body and extract the backend error message whenever it's available. If the response isn't JSON, the existing fallback behaviour is preserved.

Code snippet

```ts
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
```

Why this improves the code

· users get more meaningful error messages (e.g., "No users found matching your search." ).
· The UI can display specific validation errors from the backend.
· Fallback to empty detail ensures we never crash when the error response is not json.


c. Caching strategy for server‑side fetch

Previous behaviour
getUsers did not specify any caching behaviour – it relied on Next.js defaults, which could lead to unnecessary API calls on every request.

What was changed
I passed { next: { revalidate: 60 } } to apiRequest inside getUsers. Since the user list doesn't change frequently, I added a 60-second revalidation period. This lets Next.js reuse cached data while still refreshing it regularly in the background.

Code

```ts
export async function getUsers(): Promise<User[]> {
  const result = await apiRequest<User[]>('/users', {
    next: { revalidate: 60 },
  });
  return result ?? [];
}
```

Why this improves the code

· Reduces load on the external API. i fetch once and reuse for 60 seconds.
· Improves server performance. cached data is served instantly.
· Still provides fresh data within a minute (stale‑while‑revalidate).


d. getUserById returns User | null

Previous behaviour
getUserById was typed as returning Promise<User>, but the underlying apiRequest could return null for a 204 No Content response. This type mismatch could cause runtime errors.

What was changed
I updated the return type to explicitly include null.

Before

```ts
export async function getUserById(id: number): Promise<User>
```

After

```ts
export async function getUserById(id: number): Promise<User | null>
```

Why this improves the code

· Type safety – callers are forced to handle the null case (e.g., "User not found").
· Prevents bugs like Cannot read property 'name' of null.
· Aligns the type with the actual implementation.


e. Improved functional methods

Previous behaviour

· getTopUsers used .filter((_, idx) => idx < limit) to limit the array – less idiomatic and slightly slower.
· groupByDomain didn’t normalise domains, so "Example.com" and "example.com" were counted separately.

What was changed

· I replaced .filter((_, idx) => idx < limit) with .slice(0, limit), which is a more direct way to return the first N items.
· Added .toLowerCase().trim() when extracting the domain to ensure consistent grouping.

Code

```ts
// getTopUsers
export function getTopUsers(users: User[], limit = 5) {
  return users.slice(0, limit).map(({ id, name, email }) => ({
    id,
    displayName: name.toUpperCase(),
    email,
  }));
}

// groupByDomain
export function groupByDomain(users: User[]): Record<string, number> {
  return users.reduce((acc, { email }) => {
    const domain = email?.split('@')[1]?.toLowerCase().trim() ?? 'unknown';
    acc[domain] = (acc[domain] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);
}
```

Why this improves the code

· slice is the standard way to get the first N items – easier for other developers to understand.
· Domain statistics become accurate and case‑insensitive.
· Minimal performance gain, but code is cleaner.


2. Client Component Improvements

a. Request cancellation with AbortController

Previous behaviour
If a user triggered a new request while an old one was pending, the old request continued and could update state on an unmounted component – causing memory leaks and React warnings.

What was changed
While testing, I noticed that older requests could still complete after a new one had started. To avoid stale updates, I added an AbortController and cancelled any pending request before starting a new one. Before starting any fetch, i abort the previous controller. On unmount, I also abort any pending request.

Code

```ts
const abortControllerRef = useRef<AbortController | null>(null);

// Before fetching
if (abortControllerRef.current) {
  abortControllerRef.current.abort();
}
const controller = new AbortController();
abortControllerRef.current = controller;

// Cleanup on unmount
useEffect(() => {
  return () => abortControllerRef.current?.abort();
}, []);
```

Why this improves the code

· Prevents state updates on unmounted components (no more warnings).
· Cancels stale requests, saving bandwidth.
· The UI stays consistent – old results won’t appear after a new search.


b. Performance optimisations with useCallback and memo

Previous behaviour
All functions and child components were re‑created on every render, causing unnecessary re‑renders – especially noticeable when typing in the search input.

What was changed

· I memoized the main event handlers using useCallback and wrapped the Card component with React.memo to avoid unnecessary re-renders.
· Wrapped the Card component with React.memo.

Code

```ts
const Card = memo(({ title, children }) => { ... });

const loadAll = useCallback(async () => { ... }, []);
const loadSingle = useCallback(async (id) => { ... }, []);
const triggerError = useCallback(() => loadSingle(9999), [loadSingle]);
```

Why this improves the code

· Stable function references prevent unnecessary re‑runs of effects.
· The Card component only re‑renders when its props change.
· This reduces unnecessary renders and keeps the UI responsive while interacting with the page.


c. Debounced search functionality

Previous behaviour
There was no way to search/filter the user list.

What was changed
I added a search input with a 500ms debounce. Instead of filtering on every keystroke, the search runs only after the user pauses typing. When the user types, we wait for them to pause before filtering the full user list by name or email. If the search box is empty, we show the top 5 users.

Code

```ts
const [searchTerm, setSearchTerm] = useState('');

useEffect(() => {
  if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
  if (!searchTerm.trim()) {
    setFilteredUsers(getTopUsers(allUsers, 5));
    return;
  }
  debounceTimeoutRef.current = setTimeout(() => {
    const term = searchTerm.toLowerCase().trim();
    const filtered = allUsers.filter(
      (user) =>
        user.name.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term)
    );
    setFilteredUsers(filtered);
  }, 500);
  return () => clearTimeout(debounceTimeoutRef.current);
}, [searchTerm, allUsers]);
```

Why this improves the code

· Users can quickly find a specific user by name or email.
· Delaying the filter slightly avoids unnecessary work while the user is still typing and provides a smoother experience.
· The filter is case‑insensitive and handles partial matches.
· A small counter shows the number of matches, giving clear feedback.


3. Server Component Caching

Previous behaviour
The server component ServerUsers called getUsers() without any explicit caching configuration.

What was changed
Since caching is now handled inside getUsers, no additional changes were required in the server component. It automatically uses the updated caching behaviour. I added a comment to clarify this in page.tsx.

Code (in page.tsx)

```ts
const users = await getUsers(); // now caches and revalidates every 60s
```

Why this improves the code

· The server component serves data faster because it reuses cached responses.
· Less load on the external API.
· The comment helps other developers understand the caching behaviour.


# Summary of All Changes

- Service layer apiRequest accepts request options Supports all HTTP methods and caching
- Service layer Error body parsing Better error messages, easier debugging
- Service layer Explicit caching (revalidate: 60) Faster server responses, reduced API load
- Service layer getUserById returns User \| null Type safety, avoids runtime errors
- Service layer Functional method improvements Cleaner code, case‑insensitive domain grouping
- Client component AbortController Prevents memory leaks and stale updates
- Client component useCallback + memo Fewer re‑renders, better performance
- Client component Debounced search Smooth interactive search experience
- Server component Implicit caching via getUsers Faster page loads, less API traffic
