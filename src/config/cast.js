// THE CAST — generic roles only (no employee names; the game is on a public site).
// name: shown on the arcade screen. title: their department. look: sprite colors and gear.
// hat: 'none' | 'hardhat' | 'beanie' | 'cap' | 'sunhat'.  beard / vest: true or false.
SA.CAST = {
  planner: {
    name: 'THE PLANNER', title: 'LAND USE PLANNER',
    look: { hair: 0x5a3a1e, skin: 0xf2c79b, shirt: 0x587193, pants: 0x3d3f46, hat: 'none' },
  },
  surveyor: {
    name: 'THE CREW CHIEF', title: 'SURVEY FIELD CREW',
    look: { hair: 0x9a4a1e, skin: 0xf2c79b, shirt: 0x86a126, pants: 0x5e4527, hat: 'hardhat', hatColor: 0xf4f1e8, beard: true, beardColor: 0xb05a24, vest: true },
  },
  la: {
    name: 'THE LANDSCAPE ARCHITECT', title: 'LANDSCAPE ARCHITECTURE',
    look: { hair: 0x2a1d14, skin: 0xd9a77a, shirt: 0x86a126, pants: 0x6b5a3e, hat: 'sunhat', hatColor: 0xd8c27a },
  },
};

// Neighbors who walk the field in Post The Notice (colors only, no names).
SA.NEIGHBOR_LOOKS = [
  { hair: 0xd8d8d8, skin: 0xf2c79b, shirt: 0xc0392b, pants: 0x3a4b63, hat: 'none' },
  { hair: 0x1e1e24, skin: 0xc98c5a, shirt: 0x8e44ad, pants: 0x3d3f46, hat: 'cap', hatColor: 0x2c6e9e },
  { hair: 0xe0c070, skin: 0xf2c79b, shirt: 0x16a085, pants: 0x5e4527, hat: 'beanie', hatColor: 0xe67e22 },
];
