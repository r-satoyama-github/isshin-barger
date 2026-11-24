// 効果音（Web Audio API で合成）と 読み上げ（speechSynthesis）

const SETTINGS_KEY = 'isshin.settings';

export const settings = loadSettings();

function loadSettings() {
  const defaults = { sound: true, voice: true };
  try {
    return { ...defaults, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}') };
  } catch {
    return defaults;
  }
}

export function saveSettings() {
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); } catch { /* ignore */ }
}

let ctx = null;

// iPad では ユーザーのタップの中で 音を有効にする必要がある
export function unlockAudio() {
  try {
    ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
  } catch { ctx = null; }
  if ('speechSynthesis' in window) {
    const u = new SpeechSynthesisUtterance(' ');
    u.volume = 0;
    speechSynthesis.speak(u);
  }
}

function tone(freq, start, dur, { type = 'sine', vol = 0.2, slideTo } = {}) {
  if (!ctx || !settings.sound) return;
  const t = ctx.currentTime + start;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(ctx.destination);
  o.start(t);
  o.stop(t + dur + 0.05);
}

export const sfx = {
  // 商品を追加（レジの ピッ）
  pi()    { tone(1320, 0, 0.12, { type: 'square', vol: 0.08 }); },
  // ふつうのボタン
  tap()   { tone(880, 0, 0.06, { vol: 0.12 }); },
  // 商品をへらす・けす
  pop()   { tone(600, 0, 0.15, { type: 'triangle', vol: 0.15, slideTo: 250 }); },
  // おかねを おく（チャリン）
  coin()  {
    tone(1900, 0, 0.08, { type: 'triangle', vol: 0.15 });
    tone(2500, 0.05, 0.3, { type: 'triangle', vol: 0.12 });
  },
  // おさつ（ペラッ）
  bill()  { tone(300, 0, 0.12, { type: 'sawtooth', vol: 0.04, slideTo: 900 }); },
  // レジの チーン
  chin()  {
    tone(1568, 0, 1.2, { vol: 0.2 });
    tone(2093, 0.1, 1.4, { vol: 0.18 });
    tone(3136, 0.1, 0.8, { vol: 0.05 });
  },
  // できた！ファンファーレ
  fanfare() {
    [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.12, 0.3, { type: 'square', vol: 0.07 }));
    tone(1047, 0.5, 0.6, { type: 'square', vol: 0.07 });
  },
  // まだ たりない
  boo()   { tone(330, 0, 0.18, { type: 'sawtooth', vol: 0.05 }); tone(247, 0.18, 0.25, { type: 'sawtooth', vol: 0.05 }); },
};

let jaVoice = null;
function pickVoice() {
  const voices = speechSynthesis.getVoices();
  jaVoice =
    voices.find(v => v.lang === 'ja-JP' && /Kyoko|O-ren|Hattori|Otoya/i.test(v.name)) ||
    voices.find(v => v.lang && v.lang.replace('_', '-').startsWith('ja')) ||
    null;
}
if ('speechSynthesis' in window) {
  pickVoice();
  speechSynthesis.addEventListener?.('voiceschanged', pickVoice);
}

export function speak(text) {
  if (!settings.voice || !('speechSynthesis' in window)) return;
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'ja-JP';
    if (jaVoice) u.voice = jaVoice;
    u.rate = 1.05;
    u.pitch = 1.2;
    speechSynthesis.speak(u);
  } catch { /* ignore */ }
}
