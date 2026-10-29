// One accurate storage/analytics line, shared by every page that talks
// about where things are kept. Facts it rests on (check before editing):
// - drafts, plans, streaks, and saves live in this browser's localStorage
//   (pasted prompts in sessionStorage) — no account, no server, no sync;
// - layout.tsx loads Google Analytics, which counts page visits; answers
//   and numbers are never put in URLs, so they are not part of that.

export const STORAGE_NOTE =
  "Kept in this browser only — no account, no sync. Clearing your browser data erases it.";

export const ANALYTICS_NOTE =
  "Google Analytics counts page visits here. What you type or tap isn't sent to it or anywhere else.";
