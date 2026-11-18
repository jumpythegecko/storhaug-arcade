// Results: a plan-review style stamp, score, initials entry for high scores, then retry/arcade.
// Levels start it with: { id, win, score, ratio (0..1), headline, lines: [] , stamp (optional) }
SA.Results = class extends Phaser.Scene {
  constructor() { super('Results'); }
  init(d) { this.d = d; }
  create() {
    const C = SA.C, d = this.d, lv = SA.level(d.id);
    this.cameras.main.fadeIn(250, 19, 21, 32);
    this.inp = new SA.Input(this);
    // plan-sheet look: paper, border, title block on the right
    const g = this.add.graphics();
    g.fillStyle(C.paper).fillRect(0, 0, SA.W, SA.H);
    g.lineStyle(1, C.ink).strokeRect(3.5, 3.5, SA.W - 7, SA.H - 7);
    g.lineStyle(1, C.ink).lineBetween(236.5, 3, 236.5, SA.H - 3);
    SA.text(this, 241, 8, 'STORHAUG', C.slate);
    SA.text(this, 241, 17, 'ENGINEERING', C.slate);
    g.lineStyle(1, C.ink).lineBetween(237, 28.5, SA.W - 4, 28.5);
    SA.text(this, 241, 33, 'PROJECT:', C.grayD);
    SA.text(this, 241, 42, lv.title, C.ink).setMaxWidth(72);
    SA.text(this, 241, 66, 'SHEET 1 OF 1', C.grayD);

    SA.text(this, 10, 9, d.headline || (d.win ? 'LEVEL COMPLETE' : 'GAME OVER'), d.win ? C.greenD : C.red);
    let ly = 22;
    (d.lines || []).forEach((s) => { const t = SA.text(this, 10, ly, s, C.ink).setMaxWidth(220); ly += t.height + 3; });
    SA.text(this, 10, Math.max(76, ly + 4), 'SCORE: ' + d.score, C.ink, 2);

    // the stamp
    let grade = SA.TEXT.grades.find((gr) => (d.win ? d.ratio : 0) >= gr.min);
    if (d.stamp) grade = { label: d.stamp, color: C.red };
    const st = this.add.container(120, 124).setAngle(-6).setScale(5).setAlpha(0);
    const w = SA.clean(grade.label).length * 6 + 8;
    const sg = this.add.graphics();
    sg.lineStyle(1, grade.color).strokeRect(-w / 2, -7, w, 14).strokeRect(-w / 2 + 2, -5, w - 4, 10);
    st.add(sg);
    st.add(SA.text(this, 0, -3, grade.label, grade.color).setOrigin(0.5, 0));
    this.tweens.add({ targets: st, scale: SA.clamp(200 / w, 1, 2), alpha: 1, duration: 250, delay: 300, ease: 'Back.Out', onComplete: () => SA.sfx.hammer() });

    // high score entry
    this.entering = SA.scores.qualifies(d.id, d.score);
    this.letters = ['A', 'A', 'A']; this.slot = 0;
    this.entry = SA.text(this, 241, 90, '', C.ink);
    this.entryHelp = SA.text(this, 241, 80, this.entering ? 'HI-SCORE!' : '', C.red);
    this.menuTxt = SA.text(this, 10, 156, '', C.ink);
    this.board = SA.text(this, 241, 100, '', C.ink);
    this.sel = 0;
    this.input.on('pointerdown', () => this.confirm());
    if (!this.entering) this.showBoard();
    // refresh from the sheet so the board is current
    SA.scores.load().then(() => { if (this.scene.isActive() && !this.entering) this.showBoard(); });
    this.ready = false;
    this.time.delayedCall(600, () => { this.ready = true; });
  }
  showBoard() {
    const list = SA.scores.get(this.d.id);
    this.board.setText(SA.clean([SA.scores.isShared() ? 'FIRM TOP 5' : 'TOP 5', ...list.map((s, i) => `${i + 1} ${s.name} ${s.score}`)].join('\n')));
  }
  confirm() {
    if (!this.ready) return;
    SA.sfx.blip();
    if (this.entering) {
      if (this.slot < 2) { this.slot++; return; }
      SA.scores.add(this.d.id, this.letters.join(''), this.d.score).then(() => { if (this.scene.isActive()) this.showBoard(); });
      this.entering = false; this.entryHelp.setText(''); this.entry.setText('');
      this.showBoard();
      return;
    }
    if (this.sel === 0) SA.goto(this, SA.level(this.d.id).scene);
    else SA.goto(this, 'Select');
  }
  update(time) {
    this.inp.update();
    const ABC = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 ';
    if (this.entering) {
      const cur = ABC.indexOf(this.letters[this.slot]);
      if (this.inp.pressed('up')) { this.letters[this.slot] = ABC[(cur + 1) % ABC.length]; SA.sfx.move(); }
      if (this.inp.pressed('down')) { this.letters[this.slot] = ABC[(cur + ABC.length - 1) % ABC.length]; SA.sfx.move(); }
      if (this.inp.pressed('left') && this.slot > 0) this.slot--;
      if (this.inp.pressed('right') && this.slot < 2) this.slot++;
      const blink = Math.floor(time / 250) % 2;
      this.entry.setText(this.letters.map((l, i) => (i === this.slot && blink ? '_' : l)).join(' '));
      this.menuTxt.setText(SA.clean('UP/DOWN: LETTER  SPACE: NEXT'));
    } else {
      if (this.inp.pressed('left') || this.inp.pressed('right') || this.inp.pressed('up') || this.inp.pressed('down')) { this.sel = 1 - this.sel; SA.sfx.move(); }
      this.menuTxt.setText(SA.clean((this.sel === 0 ? '> RETRY     ARCADE' : '  RETRY   > ARCADE')));
    }
    if (this.inp.pressed('action')) this.confirm();
    if (this.inp.pressed('back')) SA.goto(this, 'Select');
  }
};
