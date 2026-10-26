let enabled = true;
let voice: SpeechSynthesisVoice | null = null;

const supported = typeof window !== 'undefined' && 'speechSynthesis' in window;

/** Pause after cancel() before speaking again – Chrome and Safari swallow the start of an utterance otherwise. */
const CANCEL_GAP_MS = 150;
/** Let a sound effect finish first – on iOS the audio switch otherwise clips the beginning of the speech. */
const SFX_GAP_MS = 280;

let queue: string[] = [];
let timer: number | undefined;
let quietUntil = 0;
// Chrome garbage-collects utterances that nothing references and then stops mid-sentence.
const alive = new Set<SpeechSynthesisUtterance>();

function pickVoice() {
  try {
    const voices = speechSynthesis.getVoices();
    voice = voices.find((v) => v.lang === 'de-DE') || voices.find((v) => v.lang?.startsWith('de')) || null;
  } catch {
    voice = null;
  }
}

if (supported) {
  pickVoice();
  speechSynthesis.onvoiceschanged = pickVoice;
}

export function setSpeechEnabled(on: boolean) {
  enabled = on;
  if (!on) stopSpeaking();
}

/** Called by the sound effects so speech waits until the tone is over. */
export function noteSoundEffect() {
  quietUntil = Math.max(quietUntil, performance.now() + SFX_GAP_MS);
}

export function stopSpeaking() {
  queue = [];
  clearTimeout(timer);
  if (!supported) return;
  try {
    speechSynthesis.cancel();
  } catch {
    /* ignore */
  }
}

function flush() {
  timer = undefined;
  const texts = queue;
  queue = [];
  try {
    // Android Chrome sometimes leaves the synth paused after the app was in the background.
    speechSynthesis.resume();
    for (const text of texts) {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'de-DE';
      u.rate = 0.9;
      u.pitch = 1.05;
      if (voice) u.voice = voice;
      alive.add(u);
      u.onend = u.onerror = () => alive.delete(u);
      speechSynthesis.speak(u);
    }
  } catch {
    /* ignore */
  }
}

function schedule() {
  clearTimeout(timer);
  const wait = quietUntil - performance.now();
  if (wait > 0) timer = window.setTimeout(flush, wait);
  else flush();
}

/**
 * Read a text aloud in German.
 * 'interrupt' (default) stops whatever is being said – for direct reactions to a tap.
 * 'queue' waits until the current speech is finished – for announcements that follow feedback.
 */
export function say(text: string, mode: 'interrupt' | 'queue' = 'interrupt') {
  if (!enabled || !supported) return;
  if (mode === 'interrupt') {
    queue = [];
    try {
      if (speechSynthesis.speaking || speechSynthesis.pending) {
        speechSynthesis.cancel();
        quietUntil = Math.max(quietUntil, performance.now() + CANCEL_GAP_MS);
      }
    } catch {
      /* ignore */
    }
  }
  queue.push(text);
  schedule();
}
