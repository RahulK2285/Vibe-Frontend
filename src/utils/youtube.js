
// ✅ Single source of truth for turning "whatever the backend/search API sent"
// into a clean 11-char YouTube video ID. Used both where nowPlaying is set
// (useVibe.js) and defensively again right before playback (InvisiblePlayer.jsx),
// so a bad value anywhere upstream can never reach ReactPlayer unfiltered.

const URL_PATTERN = /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{11})/;
const BARE_ID_PATTERN = /^[a-zA-Z0-9_-]{11}$/;

export function extractYouTubeId(raw) {
  if (!raw || typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (BARE_ID_PATTERN.test(trimmed)) return trimmed; // already a clean id
  const match = trimmed.match(URL_PATTERN);          // pull id out of any url shape
  return match ? match[1] : null;
}
