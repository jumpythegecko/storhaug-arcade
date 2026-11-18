// Core: shared namespace, palette, controls, and saved high scores.
window.SA = window.SA || {};

SA.W = 320;   // game width in pixels (scaled up to fit the screen)
SA.H = 180;   // game height

// One palette for the whole game. Brand colors: slate, green, ink.
SA.C = {
  ink: 0x131520, white: 0xf4f1e8, paper: 0xefe6cf, slate: 0x587193, slateL: 0x8fa3c0,
  slateD: 0x3a4b63, green: 0x86a126, greenD: 0x5c7019, grass: 0x4f7a28, grassD: 0x3b5e1d,
  tall: 0x6b9a33, dirt: 0x8a6a3e, dirtD: 0x5e4527, road: 0x3d3f46, roadL: 0x55585f,
  gray: 0x8a8f99, grayD: 0x4a4e57, red: 0xc0392b, orange: 0xe67e22, yellow: 0xf1c40f,
  pink: 0xff5fa2, wood: 0xa8743c, woodD: 0x6e4a24, black: 0x000000,
};
SA.hex = (n) => '#' + n.toString(16).padStart(6, '0');

// ---------- Controls: keyboard + game controller ----------
// Directions: arrows or WASD. ACTION: Space/Enter/Z. ALT: M/X/Tab. BACK: Esc.
SA.Input = class {
  constructor(scene) {
    this.scene = scene;
    const K = Phaser.Input.Keyboard.KeyCodes;
    this.keys = scene.input.keyboard.addKeys({
      up: K.UP, down: K.DOWN, left: K.LEFT, right: K.RIGHT,
      w: K.W, a: K.A, s: K.S, d: K.D,
      space: K.SPACE, enter: K.ENTER, z: K.Z,
      m: K.M, x: K.X, tab: K.TAB, esc: K.ESC, n: K.N,
    });
    this.prev = {}; this.now = {};
  }
  pad() {
    const gp = this.scene.input.gamepad;
    return gp && gp.total ? gp.getPad(0) : null;
  }
  update() {
    const k = this.keys, p = this.pad();
    const ax = p ? p.leftStick.x : 0, ay = p ? p.leftStick.y : 0;
    const b = (i) => !!(p && p.buttons[i] && p.buttons[i].pressed);
    this.prev = this.now;
    this.now = {
      up: k.up.isDown || k.w.isDown || ay < -0.5 || b(12),
      down: k.down.isDown || k.s.isDown || ay > 0.5 || b(13),
      left: k.left.isDown || k.a.isDown || ax < -0.5 || b(14),
      right: k.right.isDown || k.d.isDown || ax > 0.5 || b(15),
      action: k.space.isDown || k.enter.isDown || k.z.isDown || b(0) || b(9),
      alt: k.m.isDown || k.x.isDown || k.tab.isDown || b(1) || b(2) || b(3),
      back: k.esc.isDown || b(8),
      mute: k.n.isDown,
    };
    if (this.pressed('mute')) SA.sfx.toggleMute();
  }
  held(name) { return !!this.now[name]; }
  pressed(name) { return !!this.now[name] && !this.prev[name]; }
  dir() {
    let x = 0, y = 0;
    if (this.now.left) x -= 1; if (this.now.right) x += 1;
    if (this.now.up) y -= 1; if (this.now.down) y += 1;
    if (x && y) { x *= 0.7071; y *= 0.7071; }
    return { x, y };
  }
};

// ---------- High scores ----------
// If SA.LEADERBOARD_URL is set (src/config/leaderboard.js), scores are shared firm-wide through a
// Google Sheet. Otherwise, or while the sheet can't be reached, they're saved in this browser only.
SA.scores = {
  shared: null,          // { levelId: [{ name, score }, ...] } once loaded from the sheet
  key: (id) => 'storhaug-arcade-scores-' + id,
  local(id) {
    try { return JSON.parse(localStorage.getItem(this.key(id))) || []; } catch (e) { return []; }
  },
  get(id) { return (this.shared ? this.shared[id] || [] : this.local(id)).slice(0, 5); },
  qualifies(id, score) {
    const list = this.get(id);
    return score > 0 && (list.length < 5 || score > list[list.length - 1].score);
  },
  // Fetch the firm-wide board. Quietly does nothing if there's no URL or no connection.
  load() {
    if (!SA.LEADERBOARD_URL) return Promise.resolve();
    return fetch(SA.LEADERBOARD_URL).then((r) => r.json()).then((d) => { if (d && typeof d === 'object') this.shared = d; })
      .catch(() => {});
  },
  add(id, name, score) {
    const list = this.local(id);
    list.push({ name, score });
    list.sort((a, b) => b.score - a.score);
    try { localStorage.setItem(this.key(id), JSON.stringify(list.slice(0, 5))); } catch (e) { /* storage blocked: fine */ }
    if (this.shared) {   // show it right away, then send it to the sheet
      const sl = (this.shared[id] = this.shared[id] || []);
      sl.push({ name, score }); sl.sort((a, b) => b.score - a.score);
    }
    if (!SA.LEADERBOARD_URL) return Promise.resolve();
    // text/plain keeps this a "simple" request, which Google Apps Script accepts from any site
    return fetch(SA.LEADERBOARD_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: JSON.stringify({ id, name, score }) })
      .then((r) => r.json()).then((d) => { if (d && typeof d === 'object') this.shared = d; }).catch(() => {});
  },
  best(id) { const l = this.get(id); return l.length ? l[0] : null; },
  isShared() { return !!this.shared; },
};

SA.clamp = (v, a, b) => Math.max(a, Math.min(b, v));
SA.pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
SA.rand = (a, b) => a + Math.random() * (b - a);
