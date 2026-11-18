// Title / attract mode: logo, blinking "insert coffee", and a rotating high-score board.
SA.Title = class extends Phaser.Scene {
  constructor() { super('Title'); }
  create() {
    const C = SA.C;
    this.cameras.main.fadeIn(300, 19, 21, 32);
    this.inp = new SA.Input(this);

    // Night sky bands + stars, a field, and a road
    const g = this.add.graphics();
    [[0, 0x131520], [30, 0x1a2033], [60, 0x222a42], [90, 0x2c3652]].forEach(([y, c]) => g.fillStyle(c).fillRect(0, y, SA.W, 30));
    for (let i = 0; i < 40; i++) g.fillStyle(i % 5 ? 0x8fa3c0 : 0xf4f1e8).fillRect((i * 83) % SA.W, (i * 37) % 100, 1, 1);
    g.fillStyle(C.grassD).fillRect(0, 120, SA.W, 60);
    g.fillStyle(C.grass).fillRect(0, 120, SA.W, 3);
    g.fillStyle(C.road).fillRect(0, 160, SA.W, 20);
    for (let x = 0; x < SA.W; x += 20) g.fillStyle(C.yellow).fillRect(x, 169, 10, 1);
    this.add.image(250, 113, 'sign');
    this.add.image(60, 112, 'tree').setScale(1.2);

    // Logo
    this.logo = this.add.container(0, 0);
    const bar = this.add.graphics();
    bar.fillStyle(C.slate).fillRect(20, 18, 280, 52);
    bar.fillStyle(C.green).fillRect(20, 66, 280, 4);
    bar.lineStyle(1, C.white).strokeRect(20.5, 18.5, 279, 51);
    this.logo.add(bar);
    [[25, SA.TEXT.titleTop, C.white], [47, SA.TEXT.titleBottom, C.yellow]].forEach(([y, s, c]) => {
      const t = SA.ctext(this, 160, y, s, c, 2);
      this.logo.add([t.shadow, t]);
    });

    this.coin = SA.ctext(this, 160, 88, SA.TEXT.insertCoin, C.white);
    SA.ctext(this, 160, 100, 'PRESS SPACE OR CLICK', C.slateL);
    SA.text(this, 2, SA.H - 9, SA.TEXT.copyright, C.gray);
    SA.muteTag(this);

    // High-score board: shown every few seconds instead of the logo, one level at a time
    this.board = this.add.container(0, 0).setVisible(false);
    this.board.add(SA.panel(this, 60, 14, 200, 86));
    this.boardHead = SA.text(this, 160, 20, '', C.yellow).setOrigin(0.5, 0);
    this.boardLevel = SA.text(this, 160, 32, '', C.green).setOrigin(0.5, 0);
    this.boardRows = SA.text(this, 84, 46, '', C.white);
    this.board.add([this.boardHead, this.boardLevel, this.boardRows]);
    this.boardLevels = SA.LEVELS.filter((l) => l.scene);
    this.boardShown = -1;

    // Cast strolls across the bottom
    this.walkers = Object.keys(SA.CAST).map((id, i) =>
      this.add.sprite(-20 - i * 30, 150, 'p-' + id + '0').play('p-' + id + '-walk'));

    this.t = 0;
    this.input.on('pointerdown', () => this.go());
  }
  go() {
    SA.sfx.init(); SA.sfx.start();
    SA.goto(this, 'Select');
  }
  fillBoard(n) {
    const lv = this.boardLevels[n % this.boardLevels.length];
    const list = SA.scores.get(lv.id);
    this.boardHead.setText(SA.scores.isShared() ? 'FIRM-WIDE HIGH SCORES' : 'HIGH SCORES');
    this.boardLevel.setText(SA.clean(lv.title));
    this.boardRows.setText(list.length ? list.map((s, i) => `${i + 1}. ${s.name}  ${String(s.score).padStart(6, ' ')}`).join(String.fromCharCode(10)) : ' NO SCORES YET');
  }
  update(time, delta) {
    this.inp.update();
    this.t += delta;
    this.coin.setVisible(Math.floor(this.t / 500) % 2 === 0);
    if (this.coin.shadow) this.coin.shadow.setVisible(this.coin.visible);
    const cycle = Math.floor(this.t / 6000), showBoard = cycle % 2 === 1;
    this.board.setVisible(showBoard); this.logo.setVisible(!showBoard);
    if (showBoard && this.boardShown !== cycle) { this.boardShown = cycle; this.fillBoard((cycle - 1) / 2); }
    this.walkers.forEach((w) => { w.x += delta * 0.025; if (w.x > SA.W + 20) w.x = -20; });
    if (this.inp.pressed('action')) this.go();
  }
};
