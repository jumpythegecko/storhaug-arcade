// Chiptune-style sound effects made on the fly (no audio files). N toggles mute.
SA.sfx = {
  ctx: null, muted: false,
  init() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { this.ctx = null; }
  },
  toggleMute() { this.muted = !this.muted; },
  // One square/triangle/saw/noise note. slide = end frequency.
  tone(freq, dur = 0.1, type = 'square', vol = 0.12, slide = null, delay = 0) {
    if (this.muted || !this.ctx) return;
    const t = this.ctx.currentTime + delay;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    g.connect(this.ctx.destination);
    if (type === 'noise') {
      const len = Math.floor(this.ctx.sampleRate * dur);
      const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      const src = this.ctx.createBufferSource();
      src.buffer = buf; src.connect(g); src.start(t);
      return;
    }
    const o = this.ctx.createOscillator();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(slide, t + dur);
    o.connect(g); o.start(t); o.stop(t + dur);
  },
  seq(notes, step = 0.09, type = 'square', vol = 0.1) {
    notes.forEach((n, i) => { if (n) this.tone(n, step * 0.95, type, vol, null, i * step); });
  },
  blip() { this.tone(880, 0.05); },
  move() { this.tone(440, 0.04, 'square', 0.06); },
  start() { this.seq([523, 659, 784, 1047], 0.07); },
  step() { this.tone(120, 0.03, 'noise', 0.03); },
  hammer() { this.tone(180, 0.08, 'noise', 0.25); this.tone(90, 0.08, 'square', 0.1); },
  dig() { this.tone(200, 0.12, 'noise', 0.15); },
  bark() { this.tone(520, 0.08, 'sawtooth', 0.12, 300); this.tone(560, 0.08, 'sawtooth', 0.12, 320, 0.14); },
  alert() { this.tone(660, 0.1, 'square', 0.12, 1320); },
  thud() { this.tone(110, 0.15, 'triangle', 0.2, 60); },
  paper() { this.tone(2000, 0.06, 'noise', 0.06); },
  munch() { this.tone(300, 0.04, 'noise', 0.08); this.tone(250, 0.04, 'noise', 0.06, null, 0.09); },
  plant() { this.tone(330, 0.06, 'triangle', 0.15, 660); this.tone(990, 0.05, 'square', 0.06, null, 0.06); },
  shoo() { this.tone(900, 0.12, 'sawtooth', 0.09, 400); },
  fawn() { this.seq([1047, 1319, 1568], 0.06, 'triangle', 0.12); },
  win() { this.seq([523, 659, 784, 1047, 0, 784, 1047], 0.1, 'square', 0.1); },
  lose() { this.seq([392, 370, 349, 330, 0, 262], 0.16, 'triangle', 0.18); },
  complain() { for (let i = 0; i < 6; i++) this.tone(300 + Math.random() * 300, 0.07, 'sawtooth', 0.1, null, i * 0.08); },
};
