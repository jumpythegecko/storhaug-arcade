// The arcade floor: one cabinet per level. Left/right to choose, Space to play.
SA.Select = class extends Phaser.Scene {
  constructor() { super('Select'); }
  init(data) { this.sel = (data && data.sel) || SA.Select.last || 0; }
  create() {
    const C = SA.C;
    this.cameras.main.fadeIn(250, 19, 21, 32);
    this.inp = new SA.Input(this);
    const n = SA.LEVELS.length, gap = 96;
    const worldW = Math.max(SA.W, 64 + (n - 1) * gap + 64);
    this.cameras.main.setBounds(0, 0, worldW, SA.H);

    // Wall and carpet
    const g = this.add.graphics();
    g.fillStyle(0x1a2033).fillRect(0, 0, worldW, 112);
    for (let x = 0; x < worldW; x += 24) g.fillStyle(0x222a42).fillRect(x, 0, 12, 112);
    for (let y = 112; y < SA.H; y += 6) for (let x = (y / 6) % 2 ? 0 : 6; x < worldW; x += 12) g.fillStyle(0x3a2a4a).fillRect(x, y, 6, 6);
    g.fillStyle(0x2a1f38).fillRect(0, 112, worldW, 68);
    for (let y = 112; y < SA.H; y += 6) for (let x = (y / 6) % 2 ? 0 : 6; x < worldW; x += 12) g.fillStyle(0x352848).fillRect(x, y, 6, 6);

    this.cabs = SA.LEVELS.map((lv, i) => this.makeCabinet(lv, 64 + i * gap, i));
    this.arrow = SA.text(this, 0, 4, 'V', C.yellow).setOrigin(0.5, 0);

    // Info panel (fixed to the screen)
    SA.panel(this, 4, 120, SA.W - 8, 46).setScrollFactor(0);
    this.infoTitle = SA.text(this, 10, 125, '', C.yellow).setScrollFactor(0);
    this.infoTag = SA.text(this, 10, 136, '', C.white).setScrollFactor(0);
    this.infoCast = SA.text(this, 10, 147, '', C.slateL).setScrollFactor(0);
    this.infoBest = SA.text(this, 10, 156, '', C.green).setScrollFactor(0);
    SA.keyBar(this, [['< >', 'CHOOSE'], ['SPACE', 'PLAY']], { escLabel: 'TITLE' });

    this.input.on('pointerdown', (p) => {
      const i = this.cabs.findIndex((c) => Math.abs(c.x - p.worldX) < 40 && p.worldY < 115);
      if (i < 0) return;
      if (i === this.sel) this.play(); else { this.sel = i; SA.sfx.move(); }
    });
    this.refresh(true);
  }
  makeCabinet(lv, x, i) {
    const C = SA.C, g = this.add.graphics();
    const live = !!lv.scene;
    g.fillStyle(C.ink).fillRect(x - 39, 21, 78, 92);
    g.fillStyle(live ? C.slateD : C.grayD).fillRect(x - 38, 22, 76, 90);
    g.fillStyle(live ? C.slate : C.gray).fillRect(x - 38, 22, 4, 90).fillRect(x + 34, 22, 4, 90);
    // marquee
    g.fillStyle(C.ink).fillRect(x - 32, 26, 64, 21);
    g.fillStyle(live ? C.green : C.grayD).fillRect(x - 32, 46, 64, 1);
    const words = lv.title.split(' ');
    let best = 1, bestDiff = 99;
    for (let k = 1; k < words.length; k++) {
      const a = words.slice(0, k).join(' ').length, b = words.slice(k).join(' ').length;
      if (Math.abs(a - b) < bestDiff) { bestDiff = Math.abs(a - b); best = k; }
    }
    const lines = words.length > 1 ? [words.slice(0, best).join(' '), words.slice(best).join(' ')] : [lv.title];
    lines.forEach((s, k) => SA.text(this, x, 28 + k * 9 + (lines.length === 1 ? 5 : 0), s, live ? C.yellow : C.gray).setOrigin(0.5, 0));
    // screen
    g.fillStyle(0x0b0d14).fillRect(x - 27, 52, 54, 34);
    g.lineStyle(1, 0x4a5a78).strokeRect(x - 27.5, 51.5, 55, 35);
    if (live && lv.cast) {
      this.add.sprite(x, 69, 'p-' + lv.cast + '0').setScale(2).play('p-' + lv.cast + '-walk');
    } else {
      for (let k = 0; k < 60; k++) g.fillStyle(k % 2 ? 0x2a2e38 : 0x3a3e48).fillRect(x - 26 + ((k * 17) % 52), 53 + ((k * 7) % 32), 2, 1);
      SA.text(this, x, 65, 'SOON', C.gray).setOrigin(0.5, 0);
    }
    // control deck
    g.fillStyle(live ? C.slate : C.gray).fillRect(x - 34, 90, 68, 9);
    g.fillStyle(C.ink).fillRect(x - 24, 92, 2, 4); g.fillStyle(C.red).fillRect(x - 25, 91, 4, 2);
    g.fillStyle(C.red).fillRect(x + 8, 93, 3, 3); g.fillStyle(C.yellow).fillRect(x + 14, 93, 3, 3); g.fillStyle(C.green).fillRect(x + 20, 93, 3, 3);
    // coin slot
    g.fillStyle(C.ink).fillRect(x - 6, 103, 12, 6); g.fillStyle(C.orange).fillRect(x - 1, 104, 2, 4);
    const glow = this.add.graphics();
    return { x, lv, glow };
  }
  refresh(snap) {
    const cab = this.cabs[this.sel], lv = cab.lv, C = SA.C;
    this.cabs.forEach((c, i) => {
      c.glow.clear();
      if (i === this.sel) c.glow.lineStyle(1, C.green).strokeRect(c.x - 40.5, 19.5, 81, 95);
    });
    const camX = SA.clamp(cab.x - SA.W / 2, 0, this.cameras.main.getBounds().width - SA.W);
    if (snap) this.cameras.main.scrollX = camX; else this.tweens.add({ targets: this.cameras.main, scrollX: camX, duration: 200 });
    this.infoTitle.setText(SA.clean(lv.title));
    this.infoTag.setText(SA.clean(lv.tagline || ''));
    const who = lv.cast && SA.CAST[lv.cast];
    this.infoCast.setText(who ? SA.clean('STARRING: ' + who.name + ' - ' + who.title) : '');
    const best = lv.scene && SA.scores.best(lv.id);
    this.infoBest.setText(lv.scene ? SA.clean(best ? `BEST: ${best.name} ${best.score}` : 'BEST: NOBODY YET') : '');
  }
  play() {
    const lv = this.cabs[this.sel].lv;
    if (!lv.scene) { SA.sfx.thud(); return; }
    SA.Select.last = this.sel;
    SA.sfx.start();
    SA.goto(this, 'Intro', { id: lv.id });
  }
  update(time) {
    this.inp.update();
    const old = this.sel;
    if (this.inp.pressed('left')) this.sel = Math.max(0, this.sel - 1);
    if (this.inp.pressed('right')) this.sel = Math.min(this.cabs.length - 1, this.sel + 1);
    if (this.sel !== old) { SA.sfx.move(); this.refresh(); }
    else if (this._lastSel !== this.sel) this.refresh();
    this._lastSel = this.sel;
    this.arrow.setPosition(this.cabs[this.sel].x, 6 + Math.round(Math.sin(time / 150) * 2));
    if (this.inp.pressed('action')) this.play();
    if (this.inp.pressed('back')) SA.goto(this, 'Title');
  }
};
