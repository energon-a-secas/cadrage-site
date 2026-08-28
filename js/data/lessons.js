// ── Lesson corpus ────────────────────────────────────────────
// Aggregates the per-track files and owns the ordering. A lesson id is
// a contract: rules.js points at these from `learn`, walkthrough steps
// from `lesson`, and findingCard renders the link. tests/content.test.mjs
// asserts every reference resolves.

import { EXPOSURE_LESSONS } from './lessons/exposure.js';
import { FOCUS_LESSONS } from './lessons/focus.js';
import { COLOUR_LESSONS } from './lessons/colour.js';
import { LIGHT_LESSONS } from './lessons/light.js';
import { FORMAT_POST_LESSONS } from './lessons/format-post.js';

export const LEVELS = {
  basics: { label: 'Basics', weight: 1 },
  intermediate: { label: 'Intermediate', weight: 2 },
  advanced: { label: 'Advanced', weight: 3 },
};

/** Track order is the learning order: light-gathering first, then aim, then colour. */
export const TRACKS = {
  exposure: {
    label: 'The exposure triangle',
    blurb: 'Aperture, shutter and ISO trade in the same unit. What each one buys, what it costs, and who holds which side.',
  },
  focus: {
    label: 'Focus',
    blurb: 'When the camera may move focus, where it may look, and the movie-only rows that tune how it behaves.',
  },
  colour: {
    label: 'Colour',
    blurb: 'White balance, gamma curves, Log against Picture Profile, and the LUTs that only exist to serve Log.',
  },
  light: {
    label: 'Light and flicker',
    blurb: 'Mains light pulses. Spill bounces. Both are physics you can arrange around before they become findings.',
  },
  format: {
    label: 'Format and monitoring',
    blurb: 'The recording matrix as Sony publishes it, and judging exposure on a screen you can trust.',
  },
  post: {
    label: 'Post',
    blurb: 'Where in-camera choices and editor corrections meet, and how the same fix gets applied twice.',
  },
};

export const TRACK_ORDER = ['exposure', 'focus', 'colour', 'light', 'format', 'post'];

export const LESSONS = [
  ...EXPOSURE_LESSONS,
  ...FOCUS_LESSONS,
  ...COLOUR_LESSONS,
  ...LIGHT_LESSONS,
  ...FORMAT_POST_LESSONS,
].sort((a, b) =>
  TRACK_ORDER.indexOf(a.track) - TRACK_ORDER.indexOf(b.track) || a.order - b.order);

export const LESSON_BY_ID = Object.fromEntries(LESSONS.map(l => [l.id, l]));

export function lessonsForTrack(track) {
  return LESSONS.filter(l => l.track === track);
}

/** Previous and next lesson inside the same track, for the pager. */
export function neighbours(id) {
  const lesson = LESSON_BY_ID[id];
  if (!lesson) return { prev: null, next: null };
  const list = lessonsForTrack(lesson.track);
  const i = list.findIndex(l => l.id === id);
  return { prev: list[i - 1] || null, next: list[i + 1] || null };
}
