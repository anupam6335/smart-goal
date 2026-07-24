# Redis Caching Implementation | SMART GOAL 40%

## App Visualization

<img width="1322" height="831" alt="image" src="https://github.com/user-attachments/assets/50778b1d-c3af-46ce-a9a0-b04f159afcae" />
<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/eb2523d0-1faf-4aec-89cb-3ab445b50442" />

## Implementation Approach

- Created reusable Redis utility (cache-utils.ts) with get, set, delete, TTL, and clear operations
- Integrated Redis caching in /api/products route with 60-second TTL
- Implemented cache invalidation via DELETE endpoint
- Built client UI to demonstrate performance comparison between cached vs fresh data

## Key Technical Details

- Redis client initialized as singleton using ioredis with retry strategy
- Caches 15,000 products from DummyJSON API
- Pagination on client side showing 20 products per page

## Challenges Faced

- Environment variable configuration and connection setup – resolved by following Redis official documentation and reviewing IIFL codebase patterns for initialization.
- Error handling for connection failures and cache misses
- Save Data only for 60 sec

## Learnings

- Redis significantly reduces response times (from 7sec to <50ms)
- TTL management is crucial for stale data prevention
- Cache invalidation strategy should be explicit and controlled
- Performance gains are most noticeable with 100 data vs large datasets