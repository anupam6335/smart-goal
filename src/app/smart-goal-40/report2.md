# Redis Caching Patterns Implementation | SMART GOAL 40%

## App Visualization

<div align="center">
  <table>
    <tr>
      <td align="center" width="33%">
        <img width="975" height="857" alt="Image" src="https://github.com/user-attachments/assets/677e6aca-fb4a-4d4d-b1ce-7a5d2189fcb2" />   
        <br />
        <b>Caching Patterns</b>
        <br />
        <span style="color:gray; font-size:12px;">Interactive UI with performance comparison</span>
      </td>
      <td align="center" width="33%">
         <img width="851" height="770" alt="Image" src="https://github.com/user-attachments/assets/71dc1938-af2d-4c3e-930f-1a73ff8f2d07" />   
        <br />
        <b>Product List</b>
        <br />
        <span style="color:gray; font-size:12px;">Real-time DB and Redis data viewer</span>
      </td>
      <td align="center" width="33%">
        <img width="1920" height="1080" alt="Image" src="https://github.com/user-attachments/assets/903b0b96-b6be-4f79-9feb-6f5f72901fc6" />
        <br />
        <b>Redis Data Viewer</b>
        <br />
        <span style="color:gray; font-size:12px;">[Your third image description]</span>
      </td>
    </tr>
  </table>
</div>

## Implementation Approach

- Created reusable Redis utility (`cache-utils.ts`) with get, set, delete, TTL, and clear operations.
- Implemented **three caching patterns** with a dedicated UI to demonstrate performance differences:
  - **Cache-Aside** – reads: check cache → miss → fetch from DB → store → return.
  - **Write-Through** – writes: DB + cache synchronously (strong consistency).
  - **Write-Behind** – writes: cache first → DB asynchronously (fast writes).
- Built a visual UI with "Fetch from Cache", "Refresh List", and "Invalidate Cache" buttons to compare response times in real time.
- Added **in‑memory database** (simulated) and **Redis Cloud** as the cache layer for all patterns.
- Documented each pattern with advantages, disadvantages, limitations, and use cases directly in the UI.

## Patterns Implemented

| Pattern | Flow | Speed | Best For |
|---------|------|-------|----------|
| **Cache-Aside** | Check cache → Miss → DB → Cache → Return | Fast reads | Read‑heavy apps |
| **Write-Through** | DB → Cache → Return | Slower writes | Consistency‑critical data |
| **Write-Behind** | Cache → Return → Async DB | Fastest writes | High‑throughput writes |

## Which Pattern Best Fits This Next.js App?

**Write-Through** is the best fit because:
1. Data consistency is critical (e‑commerce inventory).
2. Write frequency is moderate (admin updates).
3. Simpler to implement than Write-Behind.
4. Users must see updated products immediately.

## Key Technical Details

- In‑memory database (global singleton) simulates persistence across requests.
- Redis Cloud stores the cache (`patterns:products`) with 60‑second TTL.
- All patterns use the same cache key for consistency.
- UI includes a **Memory Data Viewer** to show raw JSON from both DB and Redis.

## Challenges Faced

- **Rate limiting** from DummyJSON – resolved by sequential fetching and local mock fallback.
- **Slow background refreshes** – fixed by adding delayed async refresh (2s) so optimistic updates show first..

## Learnings

- Write-Through guarantees consistency but adds latency.
- Write-Behind provides the best UX for write‑heavy flows.
- Optimistic updates + delayed background refresh keeps the UI responsive.