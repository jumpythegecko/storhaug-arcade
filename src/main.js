// Game start-up.
window.addEventListener('load', () => {
  SA.game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: 'game',
    width: SA.W,
    height: SA.H,
    backgroundColor: SA.hex(SA.C.ink),
    pixelArt: true,
    roundPixels: true,
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    input: { gamepad: true },
    // Load images as <img> so the game also works when opened straight from disk.
    loader: { imageLoadType: 'HTMLImageElement' },
    scene: [SA.Boot, SA.Title, SA.Select, SA.Intro, SA.Results, SA.PostTheNotice, SA.FindThePin, SA.DeerResistant],
  });
  // Clicking the game gives it keyboard focus (needed when embedded in SharePoint).
  window.addEventListener('pointerdown', () => { window.focus(); SA.sfx.init(); });
  window.addEventListener('keydown', () => SA.sfx.init(), { once: false });
});
