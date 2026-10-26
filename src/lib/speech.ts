let enabled = true;
let voice: SpeechSynthesisVoice | null = null;

const supported = typeof window !== 'undefined' && 'speechSynthesis' in window;

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

export function stopSpeaking() {
  if (!supported) return;
  try {
    speechSynthesis.cancel();
  } catch {
    /* ignore */
  }
}

/** Read a text aloud in German. By default it interrupts whatever is being said. */
export function say(text: string, queue = false) {
  if (!enabled || !supported) return;
  try {
    if (!queue) speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'de-DE';
    u.rate = 0.9;
    u.pitch = 1.05;
    if (voice) u.voice = voice;
    speechSynthesis.speak(u);
  } catch {
    /* ignore */
  }
}
