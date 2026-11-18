// LEVEL: DEER RESISTANT — the landscape architect plants the bed before the client
// walkthrough while deer eat everything. Well-fed deer make more deer.

// ---- THE PLANTS — stats are 1 to 5 pips ----
// TIME: how long it takes to plant.  LOOK: how nice it looks (score).  YUM: how tasty to deer.
// Deer go for the yummiest plant nearby, and yummier plants feed them more (more fawns).
SA.PLANTS = [
  { id: 'hosta', name: 'HOSTA', time: 1, look: 3, yum: 5, note: 'DEER CANDY' },
  { id: 'lavender', name: 'LAVENDER', time: 2, look: 2, yum: 1, note: 'DEER HATE IT' },
  { id: 'rose', name: 'ROSE', time: 3, look: 5, yum: 4, note: 'THE SHOWPIECE' },
  { id: 'boulder', name: 'BOULDER', time: 4, look: 2, yum: 0, note: 'LAS LOVE A BOULDER' },
];

// ---- BALANCE KNOBS ----
SA.DEER_TUNING = {
  roundSecs: 90,                        // time until the client walkthrough
  plantSecs: [0, 0.7, 1.3, 2.0, 2.8, 3.6], // seconds to plant, by TIME pips
  eatSecs: 3.5,                         // seconds for a deer to eat a YUM 5 plant...
  eatSlower: 2.5,                       // ...plus this many seconds per YUM pip below 5
  truck: 26,                            // plants on the truck (18 spots, so 8 spares for replanting)
  breedAt: 12,                          // nutrients for a new deer (a plant gives YUM nutrients)
  maxDeer: 8,
  arrivals: [3, 18, 33, 48, 63],        // seconds when a wild deer wanders in
  deerSpeed: 22, fleeSpeed: 80, playerSpeed: 72,
  shooRadius: 20,                       // walk this close to a deer to shoo it
  scaredSecs: 5,                        // how long a shooed deer hovers at the edge
  variety: [1, 1, 1.25, 1.5, 1.75],       // score multiplier by number of plant kinds alive
  pointsPerLook: 10,
  clientSpeed: 45,                      // end scene: client walking speed...
  clientPause: 2.2,                     // ...and seconds they stop to comment
  goodScore: 800,                       // score that earns STAMPED & APPROVED-ish grades
};

SA.DeerResistant = class extends Phaser.Scene {
  constructor() { super('DeerResistant'); }

  create() {
    const C = SA.C, T = SA.DEER_TUNING;
    this.cameras.main.fadeIn(250, 19, 21, 32);
    this.inp = new SA.Input(this);
    this.pause = new SA.Pause(this, this.inp);
    this.numKeys = this.input.keyboard.addKeys('ONE,TWO,THREE,FOUR');
    this.buildArt();
    this.left = T.roundSecs; this.t = 0; this.done = false;
    this.sel = 0; this.prog = 0; this.truck = T.truck; this.eaten = 0; this.planted = 0; this.arrivalIdx = 0;
    this.munchCool = 0; this.shooCool = 0;
    this.client = null; this.final = null; this.verdict = null; this.finished = false;

    // ---- the site: clinic wall at the top, lawn, mulch bed ----
    const g = this.add.graphics().setDepth(-10);
    g.fillStyle(C.grass).fillRect(0, 0, SA.W, SA.H);
    for (let i = 0; i < 300; i++) g.fillStyle(i % 2 ? C.grassD : 0x5a8a30).fillRect((i * 97) % SA.W, 40 + (i * 53) % 130, 1, 2);
    g.fillStyle(0xb8b2a2).fillRect(0, 26, SA.W, 12);
    for (let x = 0; x < SA.W; x += 10) g.fillStyle(0xa09a8a).fillRect(x, 26, 1, 12);
    for (let x = 14; x < SA.W; x += 40) { g.fillStyle(0x9fd3e8).fillRect(x, 28, 18, 7); g.fillStyle(C.slateD).fillRect(x + 8, 28, 1, 7); }
    g.fillStyle(C.slate).fillRect(146, 27, 28, 11); g.fillStyle(0x9fd3e8).fillRect(149, 29, 10, 9).fillRect(161, 29, 10, 9);
    g.fillStyle(C.gray).fillRect(0, 38, SA.W, 4);
    g.fillStyle(C.ink).fillRoundedRect(63, 53, 194, 98, 14);
    g.fillStyle(0x6e4a2c).fillRoundedRect(64, 54, 192, 96, 14);
    for (let i = 0; i < 260; i++) g.fillStyle(i % 2 ? 0x5a3a20 : 0x845a36).fillRect(70 + (i * 37) % 180, 58 + (i * 23) % 88, 2, 1);

    // ---- planting spots ----
    this.spots = [];
    for (let r = 0; r < 3; r++) for (let c = 0; c < 6; c++) {
      const x = 85 + c * 30, y = 74 + r * 28;
      g.fillStyle(0x4a2e18).fillEllipse(x, y, 14, 6);
      this.spots.push({ x, y, plant: null, hp: 0, img: null });
    }
    this.ring = this.add.graphics().setDepth(900);

    // ---- player ----
    this.player = this.add.sprite(160, 166, 'p-la0').setOrigin(0.5, 1);
    this.bar = this.add.graphics().setDepth(1200);

    // ---- deer ----
    this.deer = [];
    this.popups = [];

    // ---- HUD: status line + plant picker ----
    this.hudBg = this.add.graphics().setDepth(1500);
    this.hudBg.fillStyle(C.ink, 0.85).fillRect(0, 0, SA.W, 26).fillStyle(C.slateD).fillRect(0, 25, SA.W, 1);
    this.hudL = SA.text(this, 4, 2, '', C.white).setDepth(1501);
    this.hudR = SA.text(this, SA.W - 4, 2, '', C.white).setOrigin(1, 0).setDepth(1501);
    this.pickBox = this.add.graphics().setDepth(1501);
    SA.PLANTS.forEach((p, i) => {
      this.add.image(10 + i * 16, 24, 'pl-' + p.id).setOrigin(0.5, 1).setDepth(1502);
      SA.text(this, 2 + i * 16, 15, String(i + 1), C.grayD).setDepth(1503);
    });
    this.pickName = SA.text(this, 70, 14, '', C.yellow).setDepth(1502);
    this.pips = this.add.graphics().setDepth(1502);
    SA.text(this, 126, 14, 'TIME', C.slateL).setDepth(1502);
    SA.text(this, 176, 14, 'LOOK', C.slateL).setDepth(1502);
    SA.text(this, 226, 14, 'YUM', C.slateL).setDepth(1502);
    this.msg = SA.text(this, 160, 156, '', C.white).setOrigin(0.5, 0).setDepth(1600);
    this.msgBg = this.add.graphics().setDepth(1599);
    this.msgT = 0;
    this.say('PICK A PLANT (M), HOLD SPACE ON A SPOT', 3.5);
    this.keys = SA.keyBar(this, [['ARROWS', 'MOVE'], ['M', 'PICK PLANT'], ['SPACE', 'PLANT']]);
  }

  // ---------- art for this level (drawn in code, swappable for PNGs) ----------
  buildArt() {
    const C = SA.C;
    if (!this.textures.exists('p-client0')) {
      SA.makePerson(this, 'p-client', { hair: 0x9a9a9a, skin: 0xf2c79b, shirt: 0xf4f1e8, pants: 0x2a2d36, shoes: 0x1a1a1a, hat: 'none' });
    }
    if (this.textures.exists('deer0')) return;
    const dp = { b: 0x9a6a3a, d: 0x6e4826, w: C.white, k: C.ink, a: 0xc8b08a };
    SA.gridTex(this, 'deer0', ['.a...a..........', '..a.a...........', '..bbk...........', '.bbbbb..........', 'kbbbbb.........w', '...bbbbbbbbbbbww', '...bbbbbbbbbbbb.', '...wbbbbbbbbbbb.', '....bbbbbbbbbb..', '....d.d....d.d..', '....d.d....d.d..', '....d.d....d.d..', '....k.k....k.k..'], dp);
    SA.gridTex(this, 'deer1', ['.a...a..........', '..a.a...........', '..bbk...........', '.bbbbb..........', 'kbbbbb.........w', '...bbbbbbbbbbbww', '...bbbbbbbbbbbb.', '...wbbbbbbbbbbb.', '....bbbbbbbbbb..', '....d..d..d...d.', '...d...d..d...d.', '...d....d.d....d', '...k....k.k....k'], dp);
    SA.gridTex(this, 'deer-eat', ['................', '................', '................', '...............w', '..a.bbbbbbbbbbww', '.abbbbbbbbbbbbb.', 'bbbkbbbbbbbbbbb.', 'bbb.wbbbbbbbbbb.', 'k...bbbbbbbbbb..', '....d.d....d.d..', '....d.d....d.d..', '....d.d....d.d..', '....k.k....k.k..'], dp);
    SA.gridTex(this, 'fawn0', ['.bbk........', 'bbbbb.......', 'k..bbbbbbbbw', '...bwbbwbbb.', '...bbbwbbwb.', '...bbbbbbbb.', '...d.d..d.d.', '...d.d..d.d.', '...k.k..k.k.'], dp);
    SA.gridTex(this, 'fawn1', ['.bbk........', 'bbbbb.......', 'k..bbbbbbbbw', '...bwbbwbbb.', '...bbbwbbwb.', '...bbbbbbbb.', '..d..d..d..d', '..d...d.d...', '..k...k.k...'], dp);
    SA.gridTex(this, 'fawn-eat', ['............', '...........w', '...bbbbbbbbw', '.bbbwbbwbbb.', 'bbkbbbwbbwb.', 'k..bbbbbbbb.', '...d.d..d.d.', '...d.d..d.d.', '...k.k..k.k.'], dp);
    this.anims.create({ key: 'deer-walk', frames: [{ key: 'deer0' }, { key: 'deer1' }], frameRate: 7, repeat: -1 });
    this.anims.create({ key: 'fawn-walk', frames: [{ key: 'fawn0' }, { key: 'fawn1' }], frameRate: 9, repeat: -1 });
    // plants, 12 x 12
    SA.gridTex(this, 'pl-hosta', ['............', '..l.....l...', '.lgl...lgl..', '.lgwl.lwgl..', '..lgwlwgl.l.', 'l..lgwgl.lgl', 'lglllgllgwl.', '.lgwlglwgl..', '..lgwgwgl...', '...lgggl....', '....ggg.....', '............'], { l: 0x2f6a2a, g: 0x4f9a3a, w: 0xc8e0a0 });
    SA.gridTex(this, 'pl-lavender', ['..p...p..p..', '.pp.p.pp.pp.', '.p.pp..p.p..', '.p..p.p..p..', '.g.pg.p.gp..', '.g..g.g.g...', '..g.g.g.g...', '..g.ggg.g...', '...ggggg....', '...gg.gg....', '....ggg.....', '............'], { p: 0x9a6ad0, g: 0x6a8a5a });
    SA.gridTex(this, 'pl-rose', ['............', '...rr..rr...', '..rRr.rRr...', '..rrlgrrl...', '.lgglgglgl..', 'lgrrglglrrg.', 'lgrRglgrRrl.', '.lggglgglgl.', '..lgrrgggl..', '...lgRrgl...', '....lggl....', '............'], { r: 0xd0304a, R: 0xff7a8a, g: 0x3f7a35, l: 0x2a5524 });
    SA.gridTex(this, 'pl-boulder', ['............', '............', '............', '....kkkk....', '..kkwwggkk..', '.kwwggggggk.', '.kwggggggdk.', 'kggggggggddk', 'kgggggggdddk', '.kddddddddk.', '..kkkkkkkk..', '............'], { k: 0x3a3e48, w: 0xc8ccd4, g: 0x9a9ea8, d: 0x6a6e78 });
    SA.gridTex(this, 'pl-stub', ['............', '............', '............', '............', '............', '............', '............', '...g..g.....', '...g.g..g...', '..d.gd.g....', '..dddddd....', '............'], { g: 0x5a6a3a, d: 0x4a2e18 });
  }

  say(s, secs = 2) { this.msg.setText(SA.clean(s)); this.msgT = secs; }

  popup(x, y, s, color = SA.C.white) {
    const t = SA.text(this, x, y, s, color).setOrigin(0.5, 1).setDepth(1300);
    this.tweens.add({ targets: t, y: y - 10, alpha: 0, duration: 900, delay: 300, onComplete: () => t.destroy() });
  }

  // ---------- deer ----------
  addDeer(x, y, fawn) {
    const T = SA.DEER_TUNING;
    if (this.deer.length >= T.maxDeer) return null;
    const k = fawn ? 'fawn' : 'deer';
    const s = this.add.sprite(x, y, k + '0').setOrigin(0.5, 1).play(k + '-walk');
    const icon = this.add.image(0, 0, 'alert').setVisible(false).setDepth(1100);
    const d = { s, icon, k, x, y, state: 'seek', target: null, nut: 0, t: 0, hx: 0, hy: 0, side: 1, wx: x, wy: y };
    this.deer.push(d);
    return d;
  }

  // A wild deer walks in from the left, right or bottom edge.
  arrive() {
    const e = Phaser.Math.Between(0, 2);
    const x = e === 0 ? -8 : e === 1 ? SA.W + 8 : Phaser.Math.Between(40, 280);
    const y = e === 2 ? SA.H + 4 : Phaser.Math.Between(60, 160);
    if (this.addDeer(x, y, false)) this.say('A DEER WANDERS IN...', 2);
  }

  // Best plant for this deer: yummy, healthy and close. Ignores YUM 0 and plants another deer is eating.
  pickTarget(d) {
    let best = null, bestU = 0;
    this.spots.forEach((sp) => {
      if (!sp.plant || sp.plant.yum === 0 || sp.hp <= 0) return;
      const taken = this.deer.some((o) => o !== d && o.target === sp && (o.state === 'seek' || o.state === 'eat'));
      const u = (sp.plant.yum * sp.plant.yum * sp.hp) / (1 + Phaser.Math.Distance.Between(d.x, d.y, sp.x, sp.y) / 60) * (taken ? 0.3 : 1);
      if (u > bestU) { bestU = u; best = sp; }
    });
    return best;
  }

  // Nearest point along the left, right or bottom edge.
  edgePoint(x, y) {
    const opts = [[10, SA.clamp(y, 50, 160)], [SA.W - 10, SA.clamp(y, 50, 160)], [SA.clamp(x, 20, 300), 166]];
    return opts.reduce((a, b) => (Phaser.Math.Distance.Between(x, y, a[0], a[1]) <= Phaser.Math.Distance.Between(x, y, b[0], b[1]) ? a : b));
  }

  stepToward(d, tx, ty, speed, dt) {
    const dx = tx - d.x, dy = ty - d.y, dist = Math.hypot(dx, dy);
    if (dist < 1.5) return true;
    const st = Math.min(dist, speed * dt);
    d.x += dx / dist * st; d.y += dy / dist * st;
    if (Math.abs(dx) > 0.5) d.s.setFlipX(dx > 0);
    return false;
  }

  updateDeer(dt) {
    const T = SA.DEER_TUNING, p = this.player;
    let munching = false;
    this.deer.slice().forEach((d) => {
      const near = Phaser.Math.Distance.Between(d.x, d.y, p.x, p.y) < T.shooRadius;
      if (near && d.state !== 'flee') {
        if (d.state !== 'hide') {
          if (this.shooCool <= 0) { this.popup(p.x, p.y - 22, SA.pick(SA.TEXT.shoo), SA.C.yellow); SA.sfx.shoo(); this.shooCool = 0.8; }
          [d.hx, d.hy] = this.edgePoint(d.x, d.y);
        }
        d.state = 'flee'; d.target = null;
      }
      if (d.state === 'flee') {
        if (this.stepToward(d, d.hx, d.hy, T.fleeSpeed, dt)) { d.state = 'hide'; d.t = T.scaredSecs; d.wx = d.x; d.wy = d.y; }
      } else if (d.state === 'hide') {
        d.t -= dt;
        // hover nervously near the edge
        if (this.stepToward(d, d.wx, d.wy, 12, dt)) {
          const along = d.hy > 160 ? [Phaser.Math.Between(-14, 14), 0] : [0, Phaser.Math.Between(-14, 14)];
          d.wx = SA.clamp(d.hx + along[0], 8, SA.W - 8); d.wy = SA.clamp(d.hy + along[1], 48, 168);
        }
        if (d.t <= 0) d.state = 'seek';
      } else if (d.state === 'seek' || d.state === 'graze') {
        if (!d.target || !d.target.plant) d.target = this.pickTarget(d);
        if (d.target) {
          d.state = 'seek';
          const sp = d.target; d.side = d.x < sp.x ? -1 : 1;
          if (this.stepToward(d, sp.x + d.side * 9, sp.y + 1, T.deerSpeed, dt)) { d.state = 'eat'; d.s.setFlipX(d.side < 0); }
        } else {
          // nothing tasty: wander the lawn
          d.state = 'graze';
          if (this.stepToward(d, d.wx, d.wy, T.deerSpeed * 0.5, dt)) { d.wx = Phaser.Math.Between(20, 300); d.wy = Phaser.Math.Between(50, 165); }
        }
      } else if (d.state === 'eat') {
        const sp = d.target;
        if (!sp || !sp.plant) { d.state = 'seek'; d.target = null; }
        else {
          munching = true;
          const bite = Math.min(sp.hp, dt / (T.eatSecs + (5 - sp.plant.yum) * T.eatSlower));
          sp.hp -= bite; d.nut += bite * sp.plant.yum;
          if (sp.hp <= 0.001) this.chewed(sp);
          if (d.nut >= T.breedAt && this.deer.length < T.maxDeer) {
            d.nut -= T.breedAt;
            this.addDeer(d.x + (d.side * -8), d.y + 2, true);
            this.popup(d.x, d.y - 18, 'A FAWN!', SA.C.pink); SA.sfx.fawn();
            this.say('WELL-FED DEER MAKE MORE DEER', 2);
          }
        }
      }
      // sprite
      const walking = d.state !== 'eat' && !(d.state === 'hide' && Math.hypot(d.wx - d.x, d.wy - d.y) < 1.5);
      if (d.state === 'eat') { d.s.anims.stop(); d.s.setTexture(d.k + (Math.floor(this.t * 3) % 2 ? '-eat' : '0')); }
      else if (walking) { if (!d.s.anims.isPlaying) d.s.play(d.k + '-walk'); }
      else { d.s.anims.stop(); d.s.setTexture(d.k + '0'); }
      d.s.setPosition(Math.round(d.x), Math.round(d.y)).setDepth(d.y);
      d.icon.setVisible(d.state === 'flee' || (d.state === 'hide' && Math.floor(this.t * 4) % 2 === 0))
        .setTexture(d.state === 'flee' ? 'alert' : 'huh').setPosition(d.x, d.y - (d.k === 'fawn' ? 15 : 19));
    });
    this.munchCool -= dt;
    if (munching && this.munchCool <= 0) { SA.sfx.munch(); this.munchCool = 0.7; }
  }

  // ---------- plants ----------
  chewed(sp) {
    sp.plant = null; sp.hp = 0; this.eaten++;
    if (sp.img) sp.img.destroy();
    sp.img = this.add.image(sp.x, sp.y + 3, 'pl-stub').setOrigin(0.5, 1).setDepth(sp.y);
    this.deer.forEach((d) => { if (d.target === sp) { d.target = null; if (d.state === 'eat') d.state = 'seek'; } });
  }

  plantAt(sp, pl) {
    if (sp.img) sp.img.destroy();
    sp.plant = pl; sp.hp = 1; this.planted++; this.truck--;
    sp.img = this.add.image(sp.x, sp.y + 3, 'pl-' + pl.id).setOrigin(0.5, 1).setDepth(sp.y).setScale(0.2);
    this.tweens.add({ targets: sp.img, scale: 1, duration: 220, ease: 'Back.Out' });
    SA.sfx.plant();
  }

  nearestSpot() {
    const p = this.player;
    let best = null, bd = 13;
    this.spots.forEach((sp) => { const d = Phaser.Math.Distance.Between(p.x, p.y, sp.x, sp.y + 2); if (d < bd) { bd = d; best = sp; } });
    return best;
  }

  tally() {
    const T = SA.DEER_TUNING;
    let look = 0, alive = 0; const kinds = new Set();
    this.spots.forEach((sp) => { if (sp.plant) { look += sp.plant.look * sp.hp; alive++; kinds.add(sp.plant.id); } });
    const mult = T.variety[Math.min(kinds.size, T.variety.length - 1)];
    return { look: Math.round(look), alive, kinds: kinds.size, mult, score: Math.round(look * mult * T.pointsPerLook) };
  }

  // ---------- main loop ----------
  update(time, delta) {
    this.inp.update();
    if (this.pause.update()) return;
    if (this.done) { if (this.client) this.updateEnding(delta / 1000); return; }
    const dt = delta / 1000, C = SA.C, T = SA.DEER_TUNING, p = this.player;
    this.t += dt; this.left -= dt; this.shooCool -= dt;

    // wild deer arrive on a schedule
    if (this.arrivalIdx < T.arrivals.length && this.t >= T.arrivals[this.arrivalIdx]) { this.arrivalIdx++; this.arrive(); }

    // pick a plant type
    const nk = this.numKeys;
    [nk.ONE, nk.TWO, nk.THREE, nk.FOUR].forEach((k, i) => { if (Phaser.Input.Keyboard.JustDown(k)) { this.sel = i; this.prog = 0; SA.sfx.move(); } });
    if (this.inp.pressed('alt')) { this.sel = (this.sel + 1) % SA.PLANTS.length; this.prog = 0; SA.sfx.move(); }
    const pl = SA.PLANTS[this.sel];

    // move (stand still while planting)
    const sp = this.nearestSpot();
    const canPlant = sp && !sp.plant && this.truck > 0;
    const planting = canPlant && this.inp.held('action');
    const dir = this.inp.dir();
    if (!planting && (dir.x || dir.y)) {
      p.x = SA.clamp(p.x + dir.x * T.playerSpeed * dt, 6, SA.W - 6);
      p.y = SA.clamp(p.y + dir.y * T.playerSpeed * dt, 46, SA.H - 10);
      if (dir.x) p.setFlipX(dir.x < 0);
      if (!p.anims.isPlaying) p.play('p-la-walk');
    } else p.anims.stop();
    p.setDepth(p.y + 0.5);

    // planting
    this.bar.clear(); this.ring.clear();
    if (planting) {
      this.prog += dt / T.plantSecs[pl.time];
      if (Math.floor(this.t * 6) !== Math.floor((this.t - dt) * 6)) SA.sfx.dig();
      this.bar.fillStyle(C.ink).fillRect(p.x - 11, p.y - 22, 22, 4).fillStyle(C.green).fillRect(p.x - 10, p.y - 21, 20 * Math.min(1, this.prog), 2);
      if (this.prog >= 1) { this.plantAt(sp, pl); this.prog = 0; }
    } else this.prog = 0;
    if (this.inp.pressed('action') && sp && sp.plant) this.say('SPOT TAKEN. FIND AN EMPTY ONE.', 1.5);
    else if (this.inp.pressed('action') && sp && this.truck <= 0) this.say('THE TRUCK IS EMPTY. PROTECT WHAT YOU HAVE!', 2);
    if (sp && Math.floor(time / 250) % 2) this.ring.lineStyle(1, canPlant ? C.yellow : C.gray).strokeEllipse(sp.x, sp.y, 18, 9);

    this.updateDeer(dt);

    // plants look chewed as they lose health
    this.spots.forEach((s) => { if (s.plant && s.img && s.hp < 1) s.img.setScale(0.55 + 0.45 * s.hp).setTint(s.hp < 0.5 ? 0xc8b878 : 0xffffff); });

    // HUD
    const tl = this.tally();
    this.hudL.setText(SA.clean(`WALKTHROUGH IN ${SA.fmtTime(this.left)}`)).setTint(this.left < 10 && Math.floor(time / 250) % 2 ? C.red : C.white);
    this.hudR.setText(SA.clean(`LOOK ${tl.look} X${tl.mult.toFixed(2)} DEER ${this.deer.length} TRUCK ${this.truck}`));
    this.pickBox.clear().lineStyle(1, C.green).strokeRect(2.5 + this.sel * 16, 12.5, 15, 13);
    this.pickName.setText(SA.clean(pl.name));
    this.pips.clear();
    [[pl.time, 152], [pl.look, 202], [pl.yum, 246]].forEach(([n, x]) => {
      for (let i = 0; i < 5; i++) this.pips.fillStyle(i < n ? C.yellow : C.grayD).fillRect(x + i * 4, 15, 3, 6);
    });
    this.msgT -= dt;
    this.msg.setVisible(this.msgT > 0);
    this.msgBg.clear();
    if (this.msgT > 0) this.msgBg.fillStyle(C.ink, 0.8).fillRect(160 - this.msg.width / 2 - 4, 153, this.msg.width + 8, 13);

    if (this.left <= 0) this.walkthrough();
  }

  // ---------- time's up: the client walkthrough (end scene) ----------
  walkthrough() {
    const C = SA.C;
    this.done = true;
    this.left = 0;
    this.player.anims.stop();
    this.deer.forEach((d) => { d.s.anims.stop(); d.s.setTexture(d.k + '0'); d.icon.setVisible(false); });
    this.bar.clear(); this.ring.clear(); this.msgT = 0; this.msg.setVisible(false); this.msgBg.clear();
    this.final = this.tally();                   // score is locked in when time runs out
    const f = this.final, ratio = f.score / SA.DEER_TUNING.goodScore;
    this.verdict = SA.pick(f.alive === 0 ? SA.TEXT.client.verdictNone : SA.TEXT.client.verdict.find((x) => ratio >= x.min).lines);
    SA.sfx.alert();
    this.hudL.setText(SA.clean('TIME! CLIENT WALKTHROUGH')).setTint(C.yellow);
    this.hudR.setText(SA.clean(`SCORE ${this.final.score}`));
    this.keys.set([['SPACE', 'SKIP']]);
    const s = this.add.sprite(-10, 164, 'p-client0').setOrigin(0.5, 1).play('p-client-walk');
    const bubble = this.add.graphics().setDepth(1400);
    const txt = SA.text(this, 0, 0, '', C.ink).setDepth(1401).setMaxWidth(120);
    this.client = { s, bubble, txt, x: -10, stops: [70, 130, 190, 250], i: 0, wait: 0, talk: 0, used: new Set(), phase: 'walk', t: 0 };
  }

  updateEnding(dt) {
    const T = SA.DEER_TUNING, c = this.client, p = this.player;
    c.t += dt;
    if (c.t > 0.6 && this.inp.pressed('action')) return this.finish();
    if (c.phase === 'walk') {
      const tx = c.i < c.stops.length ? c.stops[c.i] : 285;
      c.x = Math.min(tx, c.x + T.clientSpeed * dt);
      c.s.setFlipX(false);
      if (!c.s.anims.isPlaying) c.s.play('p-client-walk');
      if (c.x >= tx) {
        c.s.anims.stop(); c.s.setTexture('p-client0');
        if (c.i < c.stops.length) { c.i++; c.wait = this.clientComment(c) ? T.clientPause : 0.2; c.phase = 'stop'; }
        else { c.s.setFlipX(true); this.clientVerdict(c); c.wait = T.clientPause + 1.6; c.phase = 'verdict'; }
      }
    } else {
      c.wait -= dt;
      if (c.wait <= 0) { if (c.phase === 'verdict') return this.finish(); c.phase = 'walk'; }
    }
    c.s.setPosition(Math.round(c.x), 164).setDepth(164);
    // the LA tags along behind the client, nervously
    const fx = Math.max(-10, c.x - 18), dx = fx - p.x, dy = 166 - p.y, d = Math.hypot(dx, dy);
    if (d > 2) { const st = Math.min(d, 60 * dt); p.x += dx / d * st; p.y += dy / d * st; p.setFlipX(dx < 0); if (!p.anims.isPlaying) p.play('p-la-walk'); }
    else { p.anims.stop(); p.setFlipX(false); }
    p.setDepth(p.y + 0.5);
    // speech bubble
    c.talk -= dt;
    c.bubble.clear(); c.txt.setVisible(c.talk > 0);
    if (c.talk > 0) {
      const w = c.txt.width + 8, h = c.txt.height + 6;
      const bx = SA.clamp(c.x - w / 2, 2, SA.W - w - 2), by = 164 - 19 - h;
      c.bubble.fillStyle(SA.C.ink).fillRect(bx - 1, by - 1, w + 2, h + 2);
      c.bubble.fillStyle(SA.C.white).fillRect(bx, by, w, h).fillTriangle(c.x - 3, by + h, c.x + 3, by + h, c.x, by + h + 4);
      c.txt.setPosition(bx + 4, by + 3);
    }
  }

  say2(c, line, secs) {
    c.txt.setText(SA.clean(line)); c.talk = secs;
    SA.sfx.tone(520, 0.05, 'square', 0.05); SA.sfx.tone(440, 0.05, 'square', 0.05, null, 0.07);
  }

  // Look at what's near and pick something to say. Deer and damage first, then the plants.
  clientComment(c) {
    const near = this.spots.filter((sp) => Math.abs(sp.x - c.x) < 35);
    const has = {
      deer: this.deer.some((d) => Math.abs(d.x - c.x) < 45),
      stub: near.some((sp) => !sp.plant && sp.img),
      chewed: near.some((sp) => sp.plant && sp.hp < 0.6),
      empty: near.some((sp) => !sp.plant && !sp.img),
    };
    ['rose', 'boulder', 'hosta', 'lavender'].forEach((id) => { has[id] = near.some((sp) => sp.plant && sp.plant.id === id); });
    const order = ['deer', 'stub', 'chewed', 'rose', 'boulder', 'empty', 'hosta', 'lavender'];
    const key = order.find((k) => has[k] && !c.used.has(k)) || order.find((k) => has[k]);
    if (!key) return false;
    c.used.add(key);
    this.say2(c, SA.pick(SA.TEXT.client[key]), SA.DEER_TUNING.clientPause);
    return true;
  }

  // The final word, based on how it went.
  clientVerdict(c) {
    this.say2(c, this.verdict, 99);
    SA.sfx.hammer();
  }

  finish() {
    if (this.finished) return;
    this.finished = true;
    const T = SA.DEER_TUNING, tl = this.final, n = this.deer.length, win = tl.alive > 0;
    SA.goto(this, 'Results', {
      id: 'deer', win, score: tl.score, ratio: tl.score / T.goodScore,
      headline: win ? 'WALKTHROUGH DONE' : 'NOTHING LEFT TO SEE',
      stamp: win ? undefined : 'DEER BUFFET',
      lines: [`ALIVE: ${tl.alive}/${this.spots.length}  EATEN: ${this.eaten}  DEER: ${n}`,
        `LOOK ${tl.look}  VARIETY X${tl.mult.toFixed(2)} (${tl.kinds} KIND${tl.kinds === 1 ? '' : 'S'})`,
        `CLIENT: "${this.verdict}"`],
    });
  }
};
