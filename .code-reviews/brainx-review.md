---
diff_hash: d2829f5582c0d57af0ffb6bfbfa0ae8769702b8307dd24f60651859103edba16
reviewed_at: 2026-10-27T13:49:24Z
---

## Summary

Replaces the Vite starter with a feature-based RAG chat frontend (React 19 + TS): chat feature (SSE streaming via `askStream`, `useChat`, message/source components), document feature (list/upload/add text/rename/delete), shared `apiFetch` client, `@` path alias, and a `HomePage`. Stack detected: React. No Critical or High issues; main concerns are missing env config safeguards, duplicated fetch/error logic, and an unused dependency.

## Findings

### Critical (0)

### High (0)

### Medium (3)
- **src/lib/api.ts:1** — `VITE_API_URL` is read without validation and no `.env.example` is added (only `.env` exists locally and is now gitignored). If unset, requests go to `undefinedpath`, producing confusing "Unable to reach the server" errors. The same env read is duplicated in `src/features/chat/api/chatApi.ts:4` rather than going through one config module. *(config)*
  - status: open
  - dev_reasoning: N/A
  - ai_reasoning: Export a single `API_URL` from a config module (fail fast or default if missing), reuse it in chatApi.ts, and add `.env.example` documenting `VITE_API_URL`.
- **src/features/chat/api/chatApi.ts:34** — `askStream` re-implements the shared client's request/error handling (hardcoded fetch, duplicated 429/503 status-message map, no server-provided error message parsing), so error behavior differs between `/ask/stream` and every other endpoint. *(maintainability)*
  - status: open
  - dev_reasoning: N/A
  - ai_reasoning: Export `STATUS_MESSAGES`/`readErrorMessage` (or a `apiFetchRaw` returning the Response) from lib/api.ts and reuse them for the streaming call.
- **src/App.tsx:3** — `react-router-dom` is added to dependencies but never used (App renders HomePage directly); there is also no error boundary, so a render error white-screens the app. *(scope)*
  - status: open
  - dev_reasoning: N/A
  - ai_reasoning: Remove the unused dependency (or wire up routing with a catch-all 404 route), and add an error boundary around the app in main.tsx/App.tsx.

### Low (4)
- **src/features/document/hooks/useDocuments.ts:22** — `refresh` sets `isLoading` true on every upload/rename/delete, so the "Loading documents…" text appears and ChatWindow's `documentsLoading` toggles (which bypasses the selected-document validity check) after each action; `refresh` also lacks the stale-response guard the initial effect has. *(correctness)*
  - status: open
  - dev_reasoning: N/A
  - ai_reasoning: Only set isLoading for the initial load, and have refresh avoid toggling it (or track a separate isRefreshing).
- **src/features/chat/api/chatApi.ts:28** — Malformed SSE JSON events are silently dropped via an empty `catch`, making backend protocol problems hard to debug; payload is cast to `AskStreamEvent` without validation. *(error-handling)*
  - status: open
  - dev_reasoning: N/A
  - ai_reasoning: Log or surface a parse error, and check `type` against the known set before yielding.
- **src/features/document/components/DocumentList.tsx:22** — `fileInputRef` is attached but never read (unused); the file input is also nested in a `<label>` styled as a button, which is not keyboard-focusable when the input is hidden via `file-input`. *(clean-code)*
  - status: open
  - dev_reasoning: N/A
  - ai_reasoning: Remove the unused ref and ensure the hidden input remains focusable/visible on focus (or use a real button that triggers it).
- **src/features/chat/hooks/useChat.ts:36** — `send` ignores `isSending` state by relying on `abortRef`, and `clear()` aborts without waiting, so a `send` called immediately after `clear` is silently dropped until the aborted stream's `finally` runs. *(correctness)*
  - status: open
  - dev_reasoning: N/A
  - ai_reasoning: Reset `abortRef.current = null` and `isSending` synchronously in `clear()` (the `finally` already guards on identity).

## Reviewed files
- .gitignore
- package.json
- package-lock.json (dependency change only: react-router-dom)
- src/App.css (deleted)
- src/App.tsx
- src/index.css (skimmed)
- src/main.tsx
- src/lib/api.ts
- src/pages/HomePage.tsx
- src/features/chat/{index.ts,types.ts,api/chatApi.ts,hooks/useChat.ts,components/ChatWindow.tsx,components/MessageItem.tsx,components/SourceList.tsx}
- src/features/document/{index.ts,types.ts,api/documentApi.ts,hooks/useDocuments.ts,components/DocumentList.tsx}
- tsconfig.app.json
- vite.config.ts
