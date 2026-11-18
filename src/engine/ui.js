// Shared UI: panels, fades, scene changes, pause menu.

// Bordered panel. Returns the graphics object.
SA.panel = function (scene, x, y, w, h, fill = SA.C.ink, border = SA.C.slateL, alpha = 0.92) {
  const g = scene.add.graphics();
  g.fillStyle(fill, alpha).fillRect(x, y, w, h);
  g.lineStyle(1, border, 1).strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  g.lineStyle(1, SA.C.ink, 1).strokeRect(x - 0.5, y - 0.5, w + 1, h + 1);
  return g;
};

// Fade out, then start another scene.
SA.goto = function (scene, key, data) {
  if (scene._leaving) return;
  scene._leaving = true;
  scene.events.once('shutdown', () => { scene._leaving = false; });  // scenes are reused
  scene.cameras.main.fadeOut(250, 19, 21, 32);
  scene.cameras.main.once('camerafadeoutcomplete', () => scene.scene.start(key, data));
};

// Small "N: SOUND ON/OFF" tag in a corner, updated every frame by the scene.
SA.muteTag = function (scene) {
  const t = SA.text(scene, SA.W - 2, SA.H - 9, '', SA.C.gray).setOrigin(1, 0).setScrollFactor(0).setDepth(1000);
  const tick = () => t.setText(SA.sfx.muted ? 'N: SOUND OFF' : 'N: SOUND ON');
  scene.events.on('update', tick);
  scene.events.once('shutdown', () => scene.events.off('update', tick));  // scenes are reused
  return t;
};

// Controls key along the bottom of the screen. Stays up the whole time.
// items: [['ARROWS', 'MOVE'], ['SPACE', 'DIG'], ...]. ESC PAUSE and N SOUND are added at the end
// unless noExtras. Call bar.set(items) to change it mid-level (e.g. when SPACE does something new).
SA.keyBar = function (scene, items, opts = {}) {
  const C = SA.C, depth = 5000, y = SA.H - 10;
  const bg = scene.add.graphics().setScrollFactor(0).setDepth(depth);
  let objs = [], cur = null, mutedShown = null;
  const extras = opts.noExtras ? [] : [['ESC', opts.escLabel || 'PAUSE'], ['N', 'SOUND']];
  const draw = () => {
    objs.forEach((o) => o.destroy()); objs = [];
    const list = [...cur, ...extras].map(([k, l]) => [k, l === 'SOUND' && SA.sfx.muted ? 'MUTED' : l]);
    // measure: keycap = text + 4px padding, then 3px, then label, then a gap between items
    const widths = list.map(([k, l]) => (k.length * 6 + 3) + 3 + (l.length * 6 - 1));
    let gap = 10;
    const total = () => widths.reduce((a, b) => a + b, 0) + gap * (list.length - 1);
    while (total() > SA.W - 4 && gap > 3) gap--;
    while (total() > SA.W - 4 && list.length > 1) { list.pop(); widths.pop(); }  // last resort: drop from the end
    let x = Math.max(2, Math.round((SA.W - total()) / 2));
    bg.clear().fillStyle(C.ink, 0.92).fillRect(0, y, SA.W, 10).fillStyle(C.slateD).fillRect(0, y, SA.W, 1);
    list.forEach(([k, l], i) => {
      const kw = k.length * 6 + 3;
      bg.fillStyle(C.grayD).fillRect(x, y + 2, kw, 8);
      bg.fillStyle(C.white).fillRect(x, y + 1, kw, 7);
      objs.push(SA.text(scene, x + 2, y + 1, k, C.ink).setScrollFactor(0).setDepth(depth + 1));
      objs.push(SA.text(scene, x + kw + 3, y + 1, l, i >= cur.length ? C.gray : C.yellow).setScrollFactor(0).setDepth(depth + 1));
      x += widths[i] + gap;
    });
    mutedShown = SA.sfx.muted;
  };
  const bar = {
    set(newItems) {
      const key = JSON.stringify(newItems);
      if (key === bar._key) return;
      bar._key = key; cur = newItems; draw();
    },
  };
  bar.set(items);
  const tick = () => { if (SA.sfx.muted !== mutedShown) draw(); };
  scene.events.on('update', tick);
  scene.events.once('shutdown', () => scene.events.off('update', tick));  // scenes are reused
  return bar;
};

// Pause menu for levels. Call pause.update() first in the level's update();
// it returns true while paused (skip the rest of the update).
SA.Pause = class {
  constructor(scene, inp) {
    this.scene = scene; this.inp = inp; this.on = false; this.sel = 0;
    const d = 2000;
    this.layer = scene.add.container(0, 0).setScrollFactor(0).setDepth(d).setVisible(false);
    const g = scene.add.graphics().setScrollFactor(0);
    g.fillStyle(SA.C.ink, 0.75).fillRect(0, 0, SA.W, SA.H);
    this.layer.add(g);
    this.layer.add(SA.panel(scene, 100, 55, 120, 70).setScrollFactor(0));
    this.layer.add(SA.text(scene, 160, 64, 'PAUSED', SA.C.yellow).setOrigin(0.5, 0).setScrollFactor(0));
    this.opts = ['RESUME', 'RESTART', 'QUIT TO ARCADE'].map((s, i) =>
      SA.text(scene, 160, 82 + i * 12, s).setOrigin(0.5, 0).setScrollFactor(0));
    this.opts.forEach((o) => this.layer.add(o));
  }
  update() {
    const inp = this.inp;
    if (inp.pressed('back')) { this.on = !this.on; this.layer.setVisible(this.on); SA.sfx.blip(); }
    if (!this.on) return false;
    if (inp.pressed('up')) { this.sel = (this.sel + 2) % 3; SA.sfx.move(); }
    if (inp.pressed('down')) { this.sel = (this.sel + 1) % 3; SA.sfx.move(); }
    this.opts.forEach((o, i) => o.setTint(i === this.sel ? SA.C.green : SA.C.white).setText((i === this.sel ? '> ' : '  ') + ['RESUME', 'RESTART', 'QUIT TO ARCADE'][i] + '  '));
    if (inp.pressed('action')) {
      SA.sfx.blip();
      if (this.sel === 0) { this.on = false; this.layer.setVisible(false); }
      else if (this.sel === 1) SA.goto(this.scene, this.scene.scene.key);
      else SA.goto(this.scene, 'Select');
    }
    return true;
  }
};

// Heads-up timer text helper: m:ss
SA.fmtTime = (s) => { s = Math.max(0, Math.ceil(s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };

// Line-of-sight test: is the segment (x1,y1)-(x2,y2) blocked by any circle {x,y,r}?
SA.blocked = function (x1, y1, x2, y2, circles) {
  const dx = x2 - x1, dy = y2 - y1, len2 = dx * dx + dy * dy || 1;
  return circles.some((c) => {
    let t = ((c.x - x1) * dx + (c.y - y1) * dy) / len2;
    t = SA.clamp(t, 0, 1);
    const px = x1 + t * dx - c.x, py = y1 + t * dy - c.y;
    return px * px + py * py < c.r * c.r;
  });
};
