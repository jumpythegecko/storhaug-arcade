// Pixel-art sprites drawn in code at startup. Real art (e.g. from Gemini, cleaned up)
// can replace any of these later by loading a PNG under the same texture key.

// Make a texture by drawing rectangles: draw(px) where px(x, y, w, h, color).
SA.canvasTex = function (scene, key, w, h, draw) {
  if (scene.textures.exists(key)) scene.textures.remove(key);
  const tex = scene.textures.createCanvas(key, w, h);
  const ctx = tex.getContext();
  const px = (x, y, ww = 1, hh = 1, color = SA.C.black) => { ctx.fillStyle = SA.hex(color); ctx.fillRect(x, y, ww, hh); };
  draw(px, ctx);
  tex.refresh();
  return tex;
};

// Make a texture from rows of characters + a palette (char -> color). '.' = clear.
SA.gridTex = function (scene, key, rows, pal) {
  return SA.canvasTex(scene, key, rows[0].length, rows.length, (px) => {
    rows.forEach((row, y) => row.split('').forEach((c, x) => { if (pal[c] !== undefined) px(x, y, 1, 1, pal[c]); }));
  });
};

// ---------- People ----------
// h hair/hat, s skin, e eyes, m mouth, c shirt, v vest stripe, p pants, b shoes, r beard
SA.PERSON_TOP = {
  none: ['...hhhh...', '..hhhhhh..', '..hssssh..'],
  hardhat: ['...HHHH...', '..HHHHHH..', '.HHHHHHHH.'],
  beanie: ['...HHHH...', '..HHHHHH..', '..HHHHHH..'],
  cap: ['...HHHH...', '..HHHHHH..', '..HHHHHHHH'],
  sunhat: ['...HHHH...', '..HHHHHH..', 'HHHHHHHHHH'],
};
SA.PERSON_BODY = (beard, vest) => [
  '..sesses..',
  '..ssssss..',
  beard ? '..rrmmrr..' : '...smms...',
  beard ? '...rrrr...' : '....ss....',
  vest ? '..vcvvcv..' : '..cccccc..',
  vest ? '.svvvvvvs.' : '.sccccccs.',
  vest ? '.svcvvcvs.' : '.sccccccs.',
  '.sccccccs.',
  '..pppppp..',
];
SA.PERSON_LEGS = [
  ['..pp..pp..', '..pp..pp..', '.bbb..bbb.'],
  ['..pp..pp..', '.pp....pp.', 'bbb....bbb'],
];
// look: { hair, skin, shirt, pants, shoes, hat:'none'|'hardhat'|'beanie'|'cap', hatColor, beard, vest }
SA.makePerson = function (scene, key, look) {
  const pal = {
    h: look.hair, H: look.hatColor || look.hair, s: look.skin, e: SA.C.ink, m: 0x8a4a3a,
    c: look.shirt, v: look.vest ? SA.C.orange : look.shirt, p: look.pants, b: look.shoes || SA.C.ink,
    r: look.beardColor || look.hair,
  };
  if (look.vest) pal.c = SA.C.yellow;
  const top = SA.PERSON_TOP[look.hat || 'none'];
  const body = SA.PERSON_BODY(look.beard, look.vest);
  SA.PERSON_LEGS.forEach((legs, i) => SA.gridTex(scene, key + i, [...top, ...body, ...legs], pal));
  if (!scene.anims.exists(key + '-walk')) {
    scene.anims.create({ key: key + '-walk', frames: [{ key: key + '0' }, { key: key + '1' }], frameRate: 6, repeat: -1 });
  }
};

// ---------- Round things (tree canopies, bushes) ----------
SA.blobTex = function (scene, key, r, base, dark, light) {
  const d = r * 2;
  return SA.canvasTex(scene, key, d, d, (px) => {
    for (let y = 0; y < d; y++) for (let x = 0; x < d; x++) {
      const dx = x - r + 0.5, dy = y - r + 0.5, dist = Math.sqrt(dx * dx + dy * dy);
      // lumpy edge
      const edge = r - 0.6 - (Math.sin(Math.atan2(dy, dx) * 5) + 1) * 0.6;
      if (dist > edge) continue;
      let c = base;
      if (dist > edge - 1.2) c = dark;
      else if (dx + dy < -r * 0.6) c = light;
      else if (dx + dy > r * 0.5) c = dark;
      else if ((x * 7 + y * 13) % 11 === 0) c = dark;
      px(x, y, 1, 1, c);
    }
  });
};

SA.buildSprites = function (scene) {
  const C = SA.C;
  SA.blobTex(scene, 'tree', 14, C.grass, C.grassD, C.tall);
  SA.blobTex(scene, 'pine', 11, 0x2f5a2a, 0x1f3d1c, 0x3f7a35);
  SA.blobTex(scene, 'bush', 7, 0x3f6b22, 0x2c4d17, C.tall);
  SA.blobTex(scene, 'berries', 8, 0x2f5220, 0x1f3815, 0x48702b); // blackberry bramble
  // purple berry dots
  const bt = scene.textures.get('berries').getSourceImage().getContext('2d');
  bt.fillStyle = '#3a1f4a';
  [[4, 5], [9, 3], [11, 9], [6, 11], [3, 8], [12, 6]].forEach(([x, y]) => bt.fillRect(x, y, 1, 1));
  scene.textures.get('berries').refresh();

  // Tall grass tuft (hiding spot)
  SA.canvasTex(scene, 'tall', 16, 16, (px) => {
    px(0, 0, 16, 16, C.tall);
    for (let i = 0; i < 22; i++) { const x = (i * 7) % 16, y = (i * 11) % 14; px(x, y, 1, 3, C.grassD); px((x + 3) % 16, (y + 5) % 14, 1, 2, 0x8fbf4a); }
  });

  // Dog (side view), 2 frames
  const dogPal = { h: 0x8a5a2b, k: C.ink, w: C.white, t: 0x6a3f1a };
  SA.gridTex(scene, 'dog0', ['........h.', 't......hhh', '.hhhhhhhhk', '.hhhhhhh..', '.h.h..h.h.', '.h.h..h.h.'], dogPal);
  SA.gridTex(scene, 'dog1', ['........h.', 't......hhh', '.hhhhhhhhk', '.hhhhhhh..', 'h...h..h.h', '..........'], dogPal);
  scene.anims.create({ key: 'dog-walk', frames: [{ key: 'dog0' }, { key: 'dog1' }], frameRate: 8, repeat: -1 });

  // Notice of development sign (4' x 8' plywood on two posts), in hand and posted
  SA.canvasTex(scene, 'sign', 18, 14, (px) => {
    px(0, 0, 18, 10, C.white); px(0, 0, 18, 1, C.grayD); px(0, 9, 18, 1, C.grayD); px(0, 0, 1, 10, C.grayD); px(17, 0, 1, 10, C.grayD);
    px(2, 2, 14, 1, C.red); px(2, 4, 10, 1, C.ink); px(2, 6, 12, 1, C.ink); px(2, 8, 7, 1, C.ink);
    px(3, 10, 2, 4, C.woodD); px(13, 10, 2, 4, C.woodD);
  });
  // Survey stake with pink flagging (marks where the sign goes)
  SA.canvasTex(scene, 'stake', 7, 12, (px) => {
    px(3, 2, 1, 10, C.wood); px(4, 1, 3, 2, C.pink); px(4, 3, 2, 1, C.pink); px(3, 0, 1, 2, C.pink);
  });

  // Planner's car (top-down, facing up)
  SA.canvasTex(scene, 'car', 14, 24, (px) => {
    px(0, 4, 2, 5, C.ink); px(12, 4, 2, 5, C.ink); px(0, 16, 2, 5, C.ink); px(12, 16, 2, 5, C.ink);
    px(1, 1, 12, 22, C.slate); px(2, 0, 10, 1, C.slate); px(2, 23, 10, 1, C.slateD);
    px(3, 5, 8, 4, 0x9fd3e8); px(3, 17, 8, 3, 0x7fb3c8); px(2, 10, 10, 6, C.slateL);
    px(2, 1, 2, 1, C.yellow); px(10, 1, 2, 1, C.yellow);
  });

  // House roof (top-down) and shed
  SA.canvasTex(scene, 'house', 56, 40, (px) => {
    px(0, 0, 56, 40, 0x7a4a3a); px(0, 19, 56, 2, 0x5a3328);
    for (let y = 2; y < 40; y += 4) px(0, y, 56, 1, 0x6a3d30);
    px(40, 4, 6, 8, 0x8a8f99); px(40, 4, 6, 1, 0x4a4e57);
  });
  SA.canvasTex(scene, 'shed', 24, 20, (px) => {
    px(0, 0, 24, 20, 0x9a9a8a); px(0, 9, 24, 2, 0x6a6a5a);
    for (let x = 2; x < 24; x += 3) px(x, 0, 1, 20, 0x8a8a7a);
  });
  // Power pole (top-down: round top with crossarm)
  SA.canvasTex(scene, 'pole', 12, 12, (px) => { px(0, 5, 12, 2, C.woodD); px(4, 4, 4, 4, C.wood); px(5, 3, 2, 6, C.wood); });

  // Holes, dirt, rebar w/ yellow cap
  SA.canvasTex(scene, 'hole', 10, 7, (px) => { px(1, 0, 8, 7, C.dirt); px(0, 1, 10, 5, C.dirt); px(2, 1, 6, 5, C.dirtD); px(3, 2, 4, 3, 0x3a2a18); });
  SA.canvasTex(scene, 'cap', 7, 7, (px) => { px(1, 0, 5, 7, C.yellow); px(0, 1, 7, 5, C.yellow); px(2, 2, 3, 3, 0xd4a80c); px(3, 3, 1, 1, C.ink); });

  // Alert "!" and question "?" icons
  SA.gridTex(scene, 'alert', ['.kkk.', '.kyk.', '.kyk.', '.kyk.', '.kkk.', '.kyk.', '.kkk.'], { k: C.ink, y: C.yellow });
  SA.gridTex(scene, 'huh', ['kkkkk', 'kwwwk', 'kkkwk', '.kwwk', '.kkk.', '.kwk.', '.kkk.'], { k: C.ink, w: C.white });

  // People: neighbors + generic cast (cast members are built from cast.js)
  Object.entries(SA.CAST).forEach(([id, p]) => SA.makePerson(scene, 'p-' + id, p.look));
  SA.NEIGHBOR_LOOKS.forEach((look, i) => SA.makePerson(scene, 'nb' + i, look));

  // 1x1 white pixel for drawing tinted rectangles
  SA.canvasTex(scene, 'px', 1, 1, (px) => px(0, 0, 1, 1, C.white));
};
