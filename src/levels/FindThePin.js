// LEVEL: FIND THE PIN — compare an old, slightly-off record of survey to the site and
// dig up the property corner before dark. Scale: 4 world pixels = 1 foot.
SA.PIN_LAYOUTS = [
  { // Suburban lot. The maple on the map was cut down (stump left).
    houses: [{ x: 300, y: 170, w: 112, h: 80 }], sheds: [{ x: 480, y: 110, w: 36, h: 30 }],
    trees: [[150, 120], [200, 300], [520, 250], [90, 230, 'stump']], pines: [], berries: [[250, 70], [560, 180]],
    poles: [[600, 345]], fences: [[[40, 40], [600, 40]], [[40, 40], [40, 340]]],
    gravel: [360, 210, 40, 140], pins: [[560, 330], [120, 180], [470, 70]],
  },
  { // Rural parcel with a barn. The fence up the middle is new since the survey.
    houses: [], sheds: [{ x: 420, y: 140, w: 72, h: 60 }],
    trees: [], pines: [[100, 90], [160, 110], [130, 210], [300, 280], [560, 300]],
    berries: [[220, 180], [250, 200], [500, 230], [80, 300], [380, 260]],
    poles: [[300, 345]], fences: [[[20, 330], [620, 330]], [[20, 330], [20, 30]], [[300, 40], [300, 200], 'new']],
    gravel: [440, 175, 30, 155], pins: [[240, 195], [540, 90], [90, 150]],
  },
  { // Town lot with a house and a back shed.
    houses: [{ x: 220, y: 160, w: 112, h: 80 }], sheds: [{ x: 500, y: 80, w: 36, h: 30 }],
    trees: [[420, 260], [560, 200], [100, 300], [380, 90, 'stump']], pines: [[40, 80]], berries: [[600, 300]],
    poles: [[40, 345]], fences: [[[600, 30], [600, 330]], [[330, 30], [600, 30]]],
    gravel: [150, 205, 40, 145], pins: [[380, 320], [520, 140], [330, 60]],
  },
];

SA.FindThePin = class extends Phaser.Scene {
  constructor() { super('FindThePin'); }

  create() {
    const C = SA.C;
    this.WW = 640; this.WH = 400;
    this.cameras.main.fadeIn(250, 19, 21, 32);
    this.cameras.main.setBounds(0, 0, this.WW, this.WH + 10);  // +10: room for the controls bar
    this.inp = new SA.Input(this);
    this.pause = new SA.Pause(this, this.inp);
    this.L = SA.pick(SA.PIN_LAYOUTS);
    this.pin = SA.pick(this.L.pins);
    this.daylight = 150; this.digs = 0; this.busy = 0; this.done = false; this.t = 0;

    this.drawWorld();
    this.player = this.add.sprite(320, 372, 'p-surveyor0').setOrigin(0.5, 1);
    this.cameras.main.startFollow(this.player, true, 0.15, 0.15);
    this.ties = this.computeTies();
    this.buildMap();

    // HUD
    this.dark = this.add.graphics().setScrollFactor(0).setDepth(4000);
    this.hud = SA.text(this, 4, 3, '', C.white).setScrollFactor(0).setDepth(4500);
    this.hud2 = SA.text(this, SA.W - 4, 3, '', C.white).setOrigin(1, 0).setScrollFactor(0).setDepth(4500);
    this.msgBg = this.add.graphics().setScrollFactor(0).setDepth(4500);
    this.msg = SA.text(this, 160, 150, '', C.white).setOrigin(0.5, 0).setScrollFactor(0).setDepth(4501);
    this.say('PRESS M TO LOOK AT THE MAP', 3);
    SA.keyBar(this, [['ARROWS', 'MOVE'], ['M', 'MAP'], ['SPACE', 'DIG']]);
  }

  // ---------- the site ----------
  drawWorld() {
    const C = SA.C, L = this.L;
    const g = this.add.graphics().setDepth(-10);
    g.fillStyle(C.grass).fillRect(0, 0, this.WW, 350);
    for (let i = 0; i < 700; i++) g.fillStyle(i % 3 ? C.grassD : 0x5a8a30).fillRect((i * 97) % this.WW, (i * 61) % 348, 1, 2);
    const [gx, gy, gw, gh] = L.gravel;
    g.fillStyle(0xa09a88).fillRect(gx, gy, gw, gh);
    for (let i = 0; i < 120; i++) g.fillStyle(0x7a7568).fillRect(gx + (i * 13) % gw, gy + (i * 29) % gh, 1, 1);
    g.fillStyle(C.road).fillRect(0, 350, this.WW, 50);
    g.fillStyle(C.roadL).fillRect(0, 350, this.WW, 2);
    for (let x = 0; x < this.WW; x += 24) g.fillStyle(C.yellow).fillRect(x, 378, 12, 1);

    this.solids = []; this.slow = [];
    L.houses.forEach((h) => { this.add.image(h.x, h.y, 'house').setDisplaySize(h.w, h.h).setDepth(h.y + h.h / 2); this.solids.push(h); });
    L.sheds.forEach((h) => { this.add.image(h.x, h.y, 'shed').setDisplaySize(h.w, h.h).setDepth(h.y + h.h / 2); this.solids.push(h); });
    L.fences.forEach((f) => {
      const [a, b] = f, len = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.round(len / 12);
      g.lineStyle(1, C.wood).lineBetween(a[0], a[1] - 3, b[0], b[1] - 3).lineBetween(a[0], a[1] - 1, b[0], b[1] - 1);
      for (let i = 0; i <= n; i++) g.fillStyle(C.woodD).fillRect(a[0] + (b[0] - a[0]) * i / n - 1, a[1] + (b[1] - a[1]) * i / n - 5, 2, 6);
    });
    this.canopies = [];
    const tree = (x, y, key) => {
      g.fillStyle(C.woodD).fillRect(x - 2, y - 2, 4, 5);
      this.canopies.push(this.add.image(x, y - 8, key).setDepth(1000));
      this.solids.push({ x, y, r: 4 });
    };
    L.trees.forEach(([x, y, tag]) => {
      if (tag === 'stump') { g.fillStyle(C.wood).fillCircle(x, y, 4); g.fillStyle(0xc89a5c).fillCircle(x, y, 2); this.solids.push({ x, y, r: 3 }); }
      else tree(x, y, 'tree');
    });
    L.pines.forEach(([x, y]) => tree(x, y, 'pine'));
    L.berries.forEach(([x, y]) => { this.add.image(x, y, 'berries').setScale(1.6).setDepth(y + 4); this.slow.push({ x, y, r: 13 }); });
    L.poles.forEach(([x, y]) => { this.add.image(x, y, 'pole').setDepth(y); this.solids.push({ x, y, r: 3 }); });
  }

  computeTies() {
    const L = this.L, pts = [];
    L.trees.forEach(([x, y, tag]) => pts.push({ x, y, name: tag === 'stump' ? '24" MAPLE' : '18" MAPLE' }));
    L.pines.forEach(([x, y]) => pts.push({ x, y, name: '30" PINE' }));
    L.poles.forEach(([x, y]) => pts.push({ x, y, name: 'POWER POLE' }));
    const corners = (h, name) => [[-1, -1, 'NW'], [1, -1, 'NE'], [-1, 1, 'SW'], [1, 1, 'SE']].forEach(([sx, sy, c]) =>
      pts.push({ x: h.x + sx * h.w / 2, y: h.y + sy * h.h / 2, name: `${c} COR ${name}`, kind: name }));
    L.houses.forEach((h) => corners(h, 'BLDG'));
    L.sheds.forEach((h) => corners(h, 'SHED'));
    L.fences.filter((f) => f[2] !== 'new').forEach((f) => [f[0], f[1]].forEach(([x, y]) => pts.push({ x, y, name: 'FENCE COR' })));
    const [px, py] = this.pin;
    const dirs = ['E', 'SE', 'S', 'SW', 'W', 'NW', 'N', 'NE'];
    return pts.map((p) => ({ ...p, d: Math.hypot(px - p.x, py - p.y) }))
      .filter((p) => p.d > 12)
      .sort((a, b) => a.d - b.d)
      .filter((p, i, arr) => arr.findIndex((q) => (q.kind || q.name) === (p.kind || p.name)) === i)  // one tie per kind of thing
      .slice(0, 2)
      .map((p) => {
        const a = Math.atan2(py - p.y, px - p.x);
        const dir = dirs[(Math.round(a / (Math.PI / 4)) + 8) % 8];
        const ft = (p.d / 4 + SA.rand(-0.6, 0.6)).toFixed(1);
        return { text: `${ft}' ${dir}\nOF ${p.name}` };
      });
  }

  // ---------- the paper map (black linework, a little off) ----------
  buildMap() {
    const C = SA.C, L = this.L, s = 0.33, ox = 10, oy = 26;
    const j = () => SA.rand(-9, 9);  // drafting slop, in world pixels
    const M = (x, y, jit = true) => [ox + (x + (jit ? j() : 0)) * s, oy + (y + (jit ? j() : 0)) * s];
    this.map = this.add.container(0, 0).setScrollFactor(0).setDepth(5000).setVisible(false);
    const g = this.add.graphics();
    g.fillStyle(C.ink, 0.7).fillRect(0, 0, SA.W, SA.H);
    g.fillStyle(C.paper).fillRect(4, 4, 312, 164);
    for (let i = 0; i < 60; i++) g.fillStyle(0xe2d6b8).fillRect((i * 71) % 312 + 4, (i * 43) % 162 + 4, 3, 1); // coffee-stained, aged
    g.fillStyle(0xd8c49a, 0.6).fillCircle(280, 150, 12).fillStyle(C.paper).fillCircle(280, 150, 9);           // mug ring
    g.lineStyle(1, C.ink).strokeRect(6.5, 6.5, 307, 159);
    // lot boundary is the thing being surveyed: drawn as a heavy dashed line
    g.lineStyle(1, C.ink);
    const [rx, ry] = M(0, 350, false);
    g.lineBetween(ox, ry, ox + this.WW * s, ry);
    L.houses.concat(L.sheds).forEach((h) => { const [x, y] = M(h.x - h.w / 2, h.y - h.h / 2); g.strokeRect(x, y, h.w * s, h.h * s); });
    L.fences.filter((f) => f[2] !== 'new').forEach(([a, b]) => {
      const [x1, y1] = M(a[0], a[1]), [x2, y2] = M(b[0], b[1]);
      g.lineBetween(x1, y1, x2, y2);
      const n = Math.round(Math.hypot(x2 - x1, y2 - y1) / 8);
      for (let i = 1; i < n; i++) { const x = x1 + (x2 - x1) * i / n, y = y1 + (y2 - y1) * i / n; g.lineBetween(x - 1, y - 1, x + 1, y + 1).lineBetween(x - 1, y + 1, x + 1, y - 1); }
    });
    L.trees.concat(L.pines).forEach(([x, y]) => { const [mx, my] = M(x, y); g.strokeCircle(mx, my, 3.5); g.fillStyle(C.ink).fillRect(mx, my, 1, 1); });
    L.poles.forEach(([x, y]) => { const [mx, my] = M(x, y); g.strokeCircle(mx, my, 1.5); this.map.add(SA.text(this, mx + 3, my - 9, 'PP', C.ink)); });
    // the corner: circle-dot symbol + leader
    const [cx, cy] = M(this.pin[0], this.pin[1]);
    g.lineStyle(1, C.red).strokeCircle(cx, cy, 2.5);
    g.fillStyle(C.red).fillRect(cx, cy, 1, 1);
    this.map.addAt(g, 0);
    // right-hand title block
    const tx = 226;
    g.lineStyle(1, C.ink).lineBetween(tx - 3.5, 7, tx - 3.5, 165);
    this.map.add(SA.text(this, tx, 10, 'RECORD OF\nSURVEY\nBK 12 PG 34\n1987', C.ink));
    this.map.add(SA.text(this, tx, 52, 'CORNER:', C.red));
    this.map.add(SA.text(this, tx, 61, 'FND 5/8"\nREBAR W/YPC', C.ink));
    this.map.add(SA.text(this, tx, 83, 'TIES:', C.red));
    this.ties.forEach((t, i) => this.map.add(SA.text(this, tx, 92 + i * 21, t.text, C.ink)));
    // north arrow + scale bar
    g.lineStyle(1, C.ink).lineBetween(300, 156, 300, 142).lineBetween(300, 142, 297, 147).lineBetween(300, 142, 303, 147);
    this.map.add(SA.text(this, 297, 133, 'N', C.ink));
    g.lineBetween(tx, 158, tx + 13.2, 158).lineBetween(tx, 156, tx, 160).lineBetween(tx + 13.2, 156, tx + 13.2, 160);
    this.map.add(SA.text(this, tx + 16, 155, "10'", C.ink));
    this.map.add(SA.text(this, ox, 10, 'NOT TO SCALE (MOSTLY)', C.grayD));
    this.map.add(SA.text(this, ox + 2, ry + 2, 'ROAD', C.ink));
  }

  say(text, secs = 2.2) {
    this.msg.setText(SA.clean(text));
    this.msgBg.clear().fillStyle(SA.C.ink, 0.85).fillRect(160 - this.msg.width / 2 - 4, 147, this.msg.width + 8, 13);
    this.msgUntil = this.t + secs;
  }

  collide(o) {
    this.solids.forEach((b) => {
      if (b.r) {
        const ex = o.x - b.x, ey = o.y - b.y, d = Math.hypot(ex, ey), min = b.r + 4;
        if (d < min && d > 0.01) { o.x = b.x + ex / d * min; o.y = b.y + ey / d * min; }
      } else {
        const l = b.x - b.w / 2 - 4, r = b.x + b.w / 2 + 4, t = b.y - b.h / 2, bt = b.y + b.h / 2 + 3;
        if (o.x > l && o.x < r && o.y > t && o.y < bt) {
          const push = [[o.x - l, l, 'x'], [r - o.x, r, 'x'], [o.y - t, t, 'y'], [bt - o.y, bt, 'y']].sort((a, b2) => a[0] - b2[0])[0];
          o[push[2]] = push[1];
        }
      }
    });
  }

  update(time, delta) {
    this.inp.update();
    if (this.pause.update() || this.done) return;
    const dt = delta / 1000, p = this.player, C = SA.C;
    this.t += dt;
    this.daylight -= dt;

    if (this.inp.pressed('alt')) { this.map.setVisible(!this.map.visible); SA.sfx.paper(); }
    const reading = this.map.visible;

    if (this.busy > 0) {
      this.busy -= dt;
      if (this.busy <= 0) this.finishDig();
    } else if (!reading) {
      const d = this.inp.dir();
      const inBerries = this.slow.some((b) => Math.hypot(p.x - b.x, p.y - b.y) < b.r);
      const sp = inBerries ? 26 : 60;
      if (d.x || d.y) {
        p.x = SA.clamp(p.x + d.x * sp * dt, 6, this.WW - 6);
        p.y = SA.clamp(p.y + d.y * sp * dt, 10, 396);
        this.collide(p);
        if (d.x) p.setFlipX(d.x < 0);
        if (!p.anims.isPlaying) p.play('p-surveyor-walk');
        if (inBerries && Math.random() < dt * 2) this.say('OUCH. BLACKBERRIES.', 1);
      } else p.anims.stop();
      if (this.inp.pressed('action')) this.startDig();
    }
    p.setDepth(p.y);
    this.canopies.forEach((c) => c.setAlpha(Math.abs(c.x - p.x) < 14 && p.y < c.y + 12 && p.y > c.y - 10 ? 0.45 : 1));

    // dusk falls
    const dusk = SA.clamp(1 - this.daylight / 150, 0, 1);
    this.dark.clear().fillStyle(0x1a2050, dusk * 0.55).fillRect(0, 0, SA.W, SA.H);
    this.dark.fillStyle(C.ink, 0.65).fillRect(0, 0, SA.W, 11);
    this.hud.setText(SA.clean(`DAYLIGHT ${SA.fmtTime(this.daylight)}   HOLES: ${this.digs}`));
    this.hud2.setText(SA.clean(reading ? 'M: CLOSE MAP' : 'M: MAP'));
    if (this.msgUntil && this.t > this.msgUntil) { this.msg.setText(''); this.msgBg.clear(); this.msgUntil = 0; }
    if (this.daylight <= 0) this.sunset();
  }

  startDig() {
    this.busy = 0.9; this.digs++;
    SA.sfx.dig(); this.time.delayedCall(350, () => SA.sfx.dig());
    this.player.anims.stop();
    this.tweens.add({ targets: this.player, y: this.player.y - 2, yoyo: true, repeat: 1, duration: 110 });
    this.say('DIGGING...', 1);
  }

  finishDig() {
    const p = this.player, d = Math.hypot(p.x - this.pin[0], p.y - this.pin[1]);
    this.add.image(p.x, p.y, 'hole').setDepth(p.y - 1);
    if (d < 10) return this.found();
    if (d < 26) { this.say('OLD PINK FLAGGING IN THE DIRT. GETTING WARM!', 2.5); SA.sfx.alert(); return; }
    this.say('FOUND: ' + SA.pick(SA.TEXT.junk), 2.2); SA.sfx.thud();
  }

  found() {
    this.done = true; this.map.setVisible(false);
    SA.sfx.win();
    this.add.image(this.pin[0], this.pin[1] - 2, 'cap').setDepth(this.pin[1] + 1).setScale(1.5);
    this.say(SA.TEXT.pinFound[0], 3);
    const timeBonus = Math.round(Math.max(0, this.daylight) * 20);
    const digBonus = Math.max(0, 6 - this.digs) * 400;
    const score = 3000 + timeBonus + digBonus;
    this.time.delayedCall(2200, () => SA.goto(this, 'Results', {
      id: 'pin', win: true, score, ratio: SA.clamp(score / 6500, 0, 1), headline: 'MONUMENT FOUND!',
      lines: [...SA.TEXT.pinFound, `HOLES DUG: ${this.digs}  (+${digBonus})`, `DAYLIGHT LEFT: ${SA.fmtTime(this.daylight)}  (+${timeBonus})`],
    }));
  }

  sunset() {
    this.done = true; SA.sfx.lose();
    this.say('THE SUN WENT DOWN.', 3);
    this.time.delayedCall(1800, () => SA.goto(this, 'Results', {
      id: 'pin', win: false, score: 0, ratio: 0, headline: 'TOO DARK TO SEE',
      stamp: 'COME BACK TOMORROW', lines: [`YOU DUG ${this.digs} HOLES IN THE CLIENT'S YARD.`, 'THE PIN IS STILL OUT THERE.'],
    }));
  }
};
