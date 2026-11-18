// Mission briefing: comic-panel pages before a level. Uses a cutscene image if one
// is set for the page in levels.js, otherwise the character sprite.
SA.Intro = class extends Phaser.Scene {
  constructor() { super('Intro'); }
  init(data) { this.lv = SA.level(data.id); this.page = 0; }
  create() {
    const C = SA.C;
    this.cameras.main.fadeIn(250, 19, 21, 32);
    this.inp = new SA.Input(this);
    this.add.graphics().fillStyle(C.paper).fillRect(0, 0, SA.W, SA.H);
    SA.text(this, 6, 4, this.lv.title, C.ink);
    SA.text(this, SA.W - 6, 4, 'MISSION BRIEFING', C.slate).setOrigin(1, 0);
    this.layer = this.add.container(0, 0);
    this.hint = SA.text(this, SA.W - 6, SA.H - 10, '', C.slate).setOrigin(1, 0);
    this.input.on('pointerdown', () => this.next());
    this.show();
  }
  show() {
    const C = SA.C, pages = this.lv.intro || [], p = pages[this.page];
    this.layer.removeAll(true);
    const add = (o) => { this.layer.add(o); return o; };
    // comic panel: thick ink border, slate sky, green ground
    const g = add(this.add.graphics());
    g.fillStyle(C.ink).fillRect(6, 14, 120, 120);
    g.fillStyle(0x9fc3e0).fillRect(9, 17, 114, 80);
    g.fillStyle(C.grass).fillRect(9, 97, 114, 34);
    const key = `cut-${this.lv.id}-${this.page}`;
    if (p.image && this.textures.exists(key)) {
      const img = add(this.add.image(66, 74, key));
      img.setScale(Math.min(114 / img.width, 114 / img.height));
    } else {
      const who = 'p-' + this.lv.cast;
      add(this.add.sprite(66, 92, who + '0').setScale(4).play(who + '-walk'));
    }
    // speech box with a tail pointing at the panel
    g.fillStyle(C.ink).fillRect(134, 14, 180, 120);
    g.fillStyle(C.white).fillRect(136, 16, 176, 116);
    g.fillStyle(C.white).fillTriangle(136, 60, 126, 70, 136, 76);
    g.lineStyle(1, C.ink).lineBetween(136, 60, 126, 70).lineBetween(126, 70, 136, 76);
    const t = add(SA.text(this, 142, 22, p.text, C.ink));
    t.setMaxWidth(164);
    const last = this.page === pages.length - 1;
    if (last && this.lv.controls) {
      const c = add(SA.text(this, 6, 142, 'CONTROLS: ' + this.lv.controls + '   ESC: PAUSE', C.slateD));
      c.setMaxWidth(SA.W - 12);
    }
    this.hint.setText(SA.clean(`${this.page + 1}/${pages.length}  SPACE: ${last ? 'START!' : 'NEXT'}`));
  }
  next() {
    SA.sfx.paper();
    const pages = this.lv.intro || [];
    if (this.page < pages.length - 1) { this.page++; this.show(); } else SA.goto(this, this.lv.scene);
  }
  update() {
    this.inp.update();
    if (this.inp.pressed('action')) this.next();
    if (this.inp.pressed('back')) SA.goto(this, 'Select');
  }
};
