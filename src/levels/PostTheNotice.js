// LEVEL: POST THE NOTICE — sneak the notice board onto the site and get back to the car
// without a neighbor seeing you. Tall grass hides you, trees block line of sight,
// dogs bark when you get close, and hammering the sign in is LOUD.
SA.PostTheNotice = class extends Phaser.Scene {
  constructor() { super('PostTheNotice'); }

  create() {
    const C = SA.C;
    this.WW = 480; this.WH = 270;
    this.cameras.main.fadeIn(250, 19, 21, 32);
    this.cameras.main.setBounds(0, 0, this.WW, this.WH + 10);  // +10: room for the controls bar
    this.inp = new SA.Input(this);
    this.pause = new SA.Pause(this, this.inp);
    this.state = 'carry';      // carry -> post -> escape -> done
    this.t = 0; this.maxSus = 0; this.hammer = 0; this.nextBang = 0;

    // ---- ground ----
    const g = this.add.graphics().setDepth(-10);
    g.fillStyle(C.grass).fillRect(0, 0, this.WW, 232);
    for (let i = 0; i < 400; i++) g.fillStyle(i % 2 ? C.grassD : 0x5a8a30).fillRect((i * 97) % this.WW, (i * 53) % 230, 1, 2);
    // neighbor backyards + fence along the top
    for (let x = 0; x < this.WW; x += 80) { g.fillStyle(0x7a4a3a).fillRect(x + 10, 0, 56, 18); g.fillStyle(0x5a3328).fillRect(x + 10, 9, 56, 1); }
    g.fillStyle(C.woodD).fillRect(0, 24, this.WW, 2);
    for (let x = 0; x < this.WW; x += 8) g.fillStyle(C.wood).fillRect(x, 22, 2, 6);
    // worn dog-walking trail
    g.lineStyle(6, 0x9a8a5a, 0.6).strokeRect(100, 60, 200, 90);
    g.lineStyle(6, 0x9a8a5a, 0.6).strokeRect(360, 40, 100, 80);
    // sidewalk + road
    g.fillStyle(C.gray).fillRect(0, 232, this.WW, 8);
    for (let x = 0; x < this.WW; x += 16) g.fillStyle(C.grayD).fillRect(x, 232, 1, 8);
    g.fillStyle(C.road).fillRect(0, 240, this.WW, 30);
    for (let x = 0; x < this.WW; x += 24) g.fillStyle(C.yellow).fillRect(x, 255, 12, 1);

    // ---- hiding spots, trees, bushes ----
    this.grass = [[50, 160, 80, 56], [190, 176, 96, 44], [320, 140, 56, 60], [170, 76, 64, 40], [400, 130, 60, 40]]
      .map(([x, y, w, h]) => { this.add.tileSprite(x, y, w, h, 'tall').setOrigin(0).setDepth(-5); return { x, y, w, h }; });
    this.blockers = [];
    const tree = (x, y) => { this.add.image(x, y, 'tree').setDepth(y + 6); this.blockers.push({ x, y, r: 12 }); };
    const bush = (x, y) => { this.add.image(x, y, 'bush').setDepth(y + 3); this.blockers.push({ x, y, r: 7 }); };
    [[150, 120], [250, 140], [420, 196], [70, 100], [330, 70], [455, 160]].forEach(([x, y]) => tree(x, y));
    [[300, 214], [120, 226], [240, 60], [380, 100]].forEach(([x, y]) => bush(x, y));

    // ---- car, stake, player ----
    this.car = this.add.image(36, 250, 'car').setAngle(90).setDepth(250);
    this.stake = { x: 392, y: 222 };
    this.stakeImg = this.add.image(this.stake.x, this.stake.y - 4, 'stake').setDepth(this.stake.y);
    this.marker = this.add.graphics().setDepth(999);
    this.player = this.add.sprite(70, 236, 'p-planner0').setOrigin(0.5, 1);
    this.carried = this.add.image(0, 0, 'sign').setOrigin(0.5, 1);
    this.cameras.main.startFollow(this.player, true, 0.15, 0.15);

    // ---- neighbors (patrol loops) + one dog ----
    const routes = [
      [[100, 60], [300, 60], [300, 150], [100, 150]],
      [[470, 236], [150, 236]],
      [[360, 40], [460, 40], [460, 120], [360, 120]],
    ];
    this.cones = this.add.graphics().setDepth(-4);
    this.neighbors = routes.map((pts, i) => {
      const s = this.add.sprite(pts[0][0], pts[0][1], `nb${i}0`).setOrigin(0.5, 1).play(`nb${i}-walk`);
      const icon = this.add.image(0, 0, 'huh').setVisible(false).setDepth(1000);
      return { s, icon, pts, wp: 1, speed: [18, 22, 16][i], face: 0, wait: 0, look: 0, sus: 0, x: pts[0][0], y: pts[0][1] };
    });
    this.dog = this.add.sprite(0, 0, 'dog0').play('dog-walk');
    this.dogOwner = this.neighbors[0];
    this.barkText = SA.text(this, 0, 0, 'WOOF!', C.white).setDepth(1001).setVisible(false);
    this.barkCool = 0;
    this.rings = this.add.graphics().setDepth(998);

    // ---- HUD ----
    this.hudBg = this.add.graphics().setScrollFactor(0).setDepth(1499);
    this.hudObj = SA.text(this, 4, 3, '', C.white).setScrollFactor(0).setDepth(1500);
    this.hudTime = SA.text(this, SA.W - 4, 3, '', C.white).setOrigin(1, 0).setScrollFactor(0).setDepth(1500);
    this.hudHide = SA.text(this, 4, 13, '', C.green).setScrollFactor(0).setDepth(1500);
    this.bar = this.add.graphics().setScrollFactor(0).setDepth(1500);
    this.keys = SA.keyBar(this, [['ARROWS', 'MOVE'], ['SPACE', 'HOLD: HAMMER']]);
  }

  inGrass(x, y) { return this.grass.some((r) => x > r.x + 2 && x < r.x + r.w - 2 && y > r.y + 4 && y < r.y + r.h); }

  moveActor(o, dx, dy) {
    o.x = SA.clamp(o.x + dx, 6, this.WW - 6);
    o.y = SA.clamp(o.y + dy, 30, 238);
    this.blockers.forEach((b) => {
      const ex = o.x - b.x, ey = o.y - 2 - b.y, d = Math.hypot(ex, ey), min = b.r + 4;
      if (d < min && d > 0.01) { o.x = b.x + ex / d * min; o.y = b.y + 2 + ey / d * min; }
    });
  }

  // Neighbor turns toward a point and stares for a while.
  turnToward(n, x, y, secs) { n.face = Math.atan2(y - (n.y - 6), x - n.x); n.look = secs; }

  update(time, delta) {
    this.inp.update();
    if (this.pause.update() || this.state === 'done') return;
    const dt = delta / 1000, C = SA.C, p = this.player;
    this.t += dt;

    // ---- player ----
    const dir = this.inp.dir();
    const hammering = this.state === 'carry' && this.inp.held('action') && Phaser.Math.Distance.Between(p.x, p.y, this.stake.x, this.stake.y) < 16;
    const speed = this.state === 'carry' ? 42 : 66;
    if (!hammering && (dir.x || dir.y)) {
      this.moveActor(p, dir.x * speed * dt, dir.y * speed * dt);
      if (dir.x) p.setFlipX(dir.x < 0);
      if (!p.anims.isPlaying) p.play('p-planner-walk');
    } else p.anims.stop();
    p.setDepth(p.y);
    const hidden = this.inGrass(p.x, p.y);
    p.setAlpha(hidden ? 0.55 : 1);
    this.carried.setVisible(this.state === 'carry').setPosition(p.x, p.y - 13).setDepth(p.y + 1);

    // ---- hammering the sign in ----
    if (hammering) {
      this.hammer += dt / 2.6;
      if (this.t >= this.nextBang) {
        this.nextBang = this.t + 0.4; SA.sfx.hammer();
        this.cameras.main.shake(60, 0.004);
        this.ringR = 4;
        this.neighbors.forEach((n) => {
          if (Phaser.Math.Distance.Between(n.x, n.y, p.x, p.y) < 110) this.turnToward(n, p.x, p.y, 1.4);
        });
      }
      if (this.hammer >= 1) {
        this.state = 'escape'; SA.sfx.win();
        this.stakeImg.setVisible(false);
        this.add.image(this.stake.x, this.stake.y, 'sign').setOrigin(0.5, 1).setDepth(this.stake.y);
      }
    }
    // noise ring
    this.rings.clear();
    if (this.ringR) {
      this.ringR += dt * 260;
      this.rings.lineStyle(1, C.white, Math.max(0, 1 - this.ringR / 110)).strokeCircle(this.stake.x, this.stake.y - 6, this.ringR);
      if (this.ringR > 110) this.ringR = 0;
    }

    // ---- neighbors ----
    this.cones.clear();
    let seenBy = null;
    this.neighbors.forEach((n) => {
      if (n.look > 0) { n.look -= dt; n.s.anims.pause(); }
      else if (n.wait > 0) {
        n.wait -= dt; n.s.anims.pause();
        n.face += dt * 1.6;  // glance around at corners
      } else {
        n.s.anims.resume();
        const [tx, ty] = n.pts[n.wp];
        const dx = tx - n.x, dy = ty - n.y, d = Math.hypot(dx, dy);
        if (d < 1) { n.wp = (n.wp + 1) % n.pts.length; n.wait = 1.2; }
        else { const st = Math.min(d, n.speed * dt); n.x += dx / d * st; n.y += dy / d * st; n.face = Math.atan2(dy, dx); }
        n.s.setFlipX(Math.cos(n.face) < 0);
      }
      n.s.setPosition(n.x, n.y).setDepth(n.y);

      // vision cone
      const range = 72, half = 0.6, ex = n.x, ey = n.y - 6;
      const tint = n.sus > 0.5 ? C.red : n.sus > 0 ? C.orange : C.yellow;
      this.cones.fillStyle(tint, 0.16).slice(ex, ey, range, n.face - half, n.face + half).fillPath();
      const pdx = p.x - ex, pdy = (p.y - 6) - ey, pd = Math.hypot(pdx, pdy);
      const ang = Math.abs(Phaser.Math.Angle.Wrap(Math.atan2(pdy, pdx) - n.face));
      const sees = pd < range && ang < half && !SA.blocked(ex, ey, p.x, p.y - 6, this.blockers) && (!hidden || pd < 16);
      if (sees) { n.sus += dt * (1.6 - pd / range); if (n.sus > 0.25) this.turnToward(n, p.x, p.y, 0.6); }
      else n.sus = Math.max(0, n.sus - dt * 0.35);
      this.maxSus = Math.max(this.maxSus, n.sus);
      n.icon.setVisible(n.sus > 0.05).setTexture(n.sus > 0.5 ? 'alert' : 'huh').setPosition(n.x, n.y - 22);
      if (n.sus >= 1) seenBy = n;
    });

    // ---- the dog: trails its owner, barks if you get close ----
    const o = this.dogOwner;
    this.dog.setPosition(o.x + Math.cos(o.face) * 14, o.y - 1 + Math.sin(o.face) * 6).setFlipX(Math.cos(o.face) < 0).setDepth(o.y);
    this.barkCool -= dt;
    if (Phaser.Math.Distance.Between(this.dog.x, this.dog.y, p.x, p.y) < 40 && this.barkCool <= 0) {
      this.barkCool = 1.2; SA.sfx.bark();
      this.turnToward(o, p.x, p.y, 1.8);
      this.barkText.setVisible(true).setPosition(this.dog.x - 12, this.dog.y - 16);
      this.time.delayedCall(600, () => this.barkText.setVisible(false));
    }

    // ---- objective, escape, HUD ----
    this.marker.clear();
    const blink = Math.floor(time / 300) % 2;
    const goal = this.state === 'carry' ? this.stake : { x: 36, y: 240 };
    if (blink) this.marker.lineStyle(1, C.pink).strokeCircle(goal.x, goal.y - 4, 10);
    if (this.state === 'escape' && Phaser.Math.Distance.Between(p.x, p.y, 40, 238) < 22) {
      this.hudObj.setText(SA.clean('SPACE: DRIVE AWAY!'));
      if (this.inp.pressed('action')) return this.escape();
    } else this.hudObj.setText(SA.clean(this.state === 'carry' ? (hammering ? 'HAMMERING... (LOUD!)' : 'POST THE SIGN AT THE PINK FLAG') : 'GET BACK TO THE CAR'));
    this.keys.set(this.state === 'carry' ? [['ARROWS', 'MOVE'], ['SPACE', 'HOLD: HAMMER']] : [['ARROWS', 'MOVE'], ['SPACE', 'DRIVE AWAY']]);
    this.hudTime.setText(SA.fmtTime(this.t));
    this.hudHide.setText(hidden ? 'HIDDEN IN TALL GRASS' : '');
    this.hudBg.clear().fillStyle(C.ink, 0.65).fillRect(0, 0, SA.W, 11);
    if (hidden) this.hudBg.fillRect(0, 11, 124, 10);
    this.bar.clear();
    if (this.state === 'carry' && this.hammer > 0) {
      this.bar.fillStyle(C.ink).fillRect(110, 14, 100, 6).fillStyle(C.green).fillRect(111, 15, 98 * this.hammer, 4);
    }
    if (seenBy) this.caught(seenBy);
  }

  caught(n) {
    this.state = 'done';
    this.neighbors.forEach((m) => m.s.anims.pause());
    this.player.anims.stop();
    SA.sfx.complain(); this.time.delayedCall(500, () => SA.sfx.lose());
    this.cameras.main.shake(200, 0.01);
    const C = SA.C, line = SA.pick(SA.TEXT.complaints);
    const g = this.add.graphics().setScrollFactor(0).setDepth(3000);
    g.fillStyle(C.ink, 0.6).fillRect(0, 0, SA.W, SA.H);
    g.fillStyle(C.ink).fillRect(48, 20, 264, 84);
    g.fillStyle(C.white).fillRect(50, 22, 260, 80).fillTriangle(70, 102, 60, 124, 96, 102);
    this.add.sprite(46, 172, n.s.texture.key).setOrigin(0.5, 1).setScale(4).setScrollFactor(0).setDepth(3001);
    const sc = line.length > 30 ? 1 : 2;
    const t = SA.text(this, 180, 62, line, C.ink, sc).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(3001);
    t.setMaxWidth(244 / sc).setCenterAlign();
    const posted = this.hammer >= 1;
    this.time.delayedCall(3200, () => SA.goto(this, 'Results', {
      id: 'notice', win: false, score: posted ? 500 : 0, ratio: 0,
      headline: 'SPOTTED BY A NEIGHBOR', stamp: 'COMPLAINT FILED',
      lines: [`"${line}"`, posted ? 'THE SIGN IS UP, AT LEAST.' : 'THE SIGN NEVER WENT UP.'],
    }));
  }

  escape() {
    this.state = 'done';
    SA.sfx.start();
    this.player.setVisible(false);
    this.tweens.add({ targets: this.car, x: -40, duration: 1200, ease: 'Quad.In' });
    const timeBonus = Math.max(0, Math.round(2000 - this.t * 15));
    const stealth = Math.round(1000 * (1 - this.maxSus));
    const score = 1000 + timeBonus + stealth;
    this.time.delayedCall(1400, () => SA.goto(this, 'Results', {
      id: 'notice', win: true, score, ratio: score / 4000,
      headline: 'NOTICE POSTED!',
      lines: [...SA.TEXT.noticeWin, `TIME: ${SA.fmtTime(this.t)}  (+${timeBonus})`,
        `STEALTH: ${this.maxSus < 0.05 ? 'GHOST' : this.maxSus < 0.5 ? 'SNEAKY' : 'CLOSE CALL'}  (+${stealth})`],
    }));
  }
};
