// Boot: build the font and sprites, load any cutscene images, then show the title.
SA.Boot = class extends Phaser.Scene {
  constructor() { super('Boot'); }
  preload() {
    SA.LEVELS.forEach((lv) => (lv.intro || []).forEach((page, i) => {
      if (page.image) this.load.image(`cut-${lv.id}-${i}`, page.image);
    }));
    this.load.on('loaderror', (f) => console.warn('Could not load', f.src));
  }
  create() {
    SA.buildFont(this);
    SA.buildSprites(this);
    SA.scores.load();   // firm-wide scores arrive in the background
    this.scene.start('Title');
  }
};
