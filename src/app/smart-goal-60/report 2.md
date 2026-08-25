# Frontend Mini-Challenges – SMART GOAL 60%

## Implementation Approach

- Built **six challenges pages** :
  **Column Table**, **Modal Popup**, **Star Rating**, **Tic Tac Toe**, **Toast**, and **Weather App**.
- updated  dashboard (`/smart-goal-60`) to showcase all completed challenges.

## App Visualization – Dashboard

<img width="1055" height="736" alt="Image" src="https://github.com/user-attachments/assets/3bdad742-279c-4d8d-9d82-e7682a5c8d55" />

### Challenge Previews

| Challenge | Screenshot | Description |
|-----------|------------|-------------|
| **Column Table** | <img width="891" height="559" alt="Image" src="https://github.com/user-attachments/assets/e1e71f5b-0e03-4b99-9fec-c0aca9d44519" /> | Dynamic grid (2-8 rows/cols). Numbers fill column‑by‑column. |
| **Modal Popup** | <img width="851" height="727" alt="Image" src="https://github.com/user-attachments/assets/a413559b-9781-4dfc-a7bc-2262a24b72cd" /> | Configurable modal (Info, Warning, Delete). |
| **Star Rating** | <img width="616" height="258" alt="Image" src="https://github.com/user-attachments/assets/ca64e90f-9dcb-4eb2-84d1-ec89e283f71c" /> | Click to rate (1-5), hover to preview, clear to reset. |
| **Tic Tac Toe** | <img width="621" height="643" alt="Image" src="https://github.com/user-attachments/assets/2210efc1-a45c-4c0e-8844-a828640738a9" /> | Two-Player and vs Computer (minimax AI). Winning line highlighted. |
| **Toast** | <img width="800" height="380" alt="Image" src="https://github.com/user-attachments/assets/5fed2aa2-9ba8-41ed-975d-52ea7428fb80" /> | Position options (top/bottom, left/center/right). Duration controls (2s, 3.5s, 5s, 10s, Manual). |
| **Weather App** | <img width="1026" height="865" alt="Image" src="https://github.com/user-attachments/assets/c8539d12-f865-45b6-b43e-7862e8b07fd0" /> | Current weather, hourly timeline (24hrs), 7‑day forecast with temperature bars. Open-Meteo API. |

## Key Technical Details

- **Column Table:** CSS Grid with dynamic `gridTemplateColumns`/`Rows`. Numbers computed `c * rows + r + 1`.
- **Modal Popup:** Backdrop blur, Escape key support, body scroll lock. Three types with color indicators.
- **Star Rating:** Hover preview (`onMouseEnter`/`onMouseLeave`), click to set/clear.
- **Tic Tac Toe:** Minimax algorithm for unbeatable AI. 8 pre‑defined winning lines. Green highlight on win.
- **Toast:** Fixed container with 6 positions. Auto‑dismiss with configurable duration. Colored dot for type.
- **Weather App:** Geocoding + weather API. Temperature bars with gradient for min/max.

## Challenges Faced

- Column table numbering logic required careful indexing (`c * rows + r + 1`).
- Minimax implementation – recursion and optimal AI moves.
- Weather API rate limits – handled with error states.
- Accessibility – keyboard navigation (Escape, Enter/Space).

## Learnings

- Each challenge uses a different state pattern (toggle, multi‑step, rating, game board).
- Minimax recursion for AI decision trees.
- API integration with loading/error states.
- Reusable components (toasts, modals) can be extracted across the app.