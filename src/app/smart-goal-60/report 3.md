# SMART GOAL — Todo Mini‑Project

## What I Built

A single, fully combined **Todo** mini‑project at `/smart-goal-60/todo` that integrates **every component previously built across SMART GOAL 40 and SMART GOAL 60**, plus **Redis** at the backend.

## Previously Built Components Reused

| Component | Original Location | Applied In Todo As |
|---|---|---|
| Toast | `smart-goal-60/toast` | Notification system for every action |
| Modal | `smart-goal-60/modal-popup` | New Todo wizard + Delete confirmation |
| Star Rating | `smart-goal-60/star-rating` | Priority field on every todo |
| Password | `smart-goal-60/password-strength-checker` | PasswordGate for the Private group |
| Stepper | `smart-goal-60/stepper` | 4‑step New Todo creation flow |
| Accordion | `smart-goal-60/accordion` | Active / Completed / Private groups |
| Image Upload | `smart-goal-60/image-galary` | Base64 image attach in Stepper |
| Local Storage | — | Draft, accordion state, persisted across reloads |

## Redis Applied

- **Cache‑aside** on `GET /api/todos` (60 s TTL)
- **Write‑through** on `POST /api/todos`
- **Invalidate‑on‑write** on `PUT` / `DELETE /api/todos/[id]`
- **Session store** for password‑protected Private todos (1 h TTL)
- **Rate limiting** on login, upload, and mutations
- **Durable DB layer** — created todos survive cache expiry and server restart

## Feature Summary

- CRUD todos with priority, category, due date, image, and privacy flag
- Three accordion groups with persisted open/closed state
- Private group locked behind a server‑verified password (`dummy1234`)
- Change‑password flow with Redis override of the env var
- Live status bar showing cache source and response time
- Optimistic updates for toggle and delete

## Outcome

All nine requested features delivered in one integrated project. Redis is not a bolt‑on — it is the backbone for caching, sessions, rate limiting, and persistence.