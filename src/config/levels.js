// THE CABINETS — one entry per level, in the order they appear in the arcade.
// To add a level: write its scene in src/levels/, add a <script> line in index.html,
// and add an entry here. Entries with scene: null show as "COMING SOON".
//
// intro: pages shown before the level. Each page has text, and optionally an image
// (e.g. 'assets/cutscenes/notice-1.png' from the comic artist) shown instead of the sprite.
SA.LEVELS = [
  {
    id: 'notice', scene: 'PostTheNotice', title: 'POST THE NOTICE', cast: 'planner',
    tagline: 'POST THE SIGN. ESCAPE UNSEEN.',
    intro: [
      { text: 'THE LAND USE APPLICATION IS IN. CODE SAYS A NOTICE BOARD GOES UP ON THE SITE.' },
      { text: 'THE NEIGHBORS DO NOT KNOW YET. LET\'S KEEP IT THAT WAY UNTIL THE COMMENT PERIOD.' },
      { text: 'CARRY THE SIGN TO THE PINK FLAG, HAMMER IT IN, AND GET BACK TO THE CAR.\nHIDE IN TALL GRASS. TREES BLOCK THEIR VIEW. HAMMERING IS LOUD. DOGS ARE SNITCHES.' },
    ],
    controls: 'ARROWS/WASD: MOVE   HOLD SPACE AT FLAG: HAMMER   SPACE AT CAR: DRIVE AWAY',
  },
  {
    id: 'pin', scene: 'FindThePin', title: 'FIND THE PIN', cast: 'surveyor',
    tagline: 'THE MAP SAYS IT\'S RIGHT HERE. PROBABLY.',
    intro: [
      { text: 'THE CLIENT WANTS THE CORNER FOUND BEFORE THEY BUILD THE FENCE.' },
      { text: 'THE OLD RECORD OF SURVEY SHOWS TIES TO NEARBY STUFF. THE MAP IS OLD. THINGS CHANGE.' },
      { text: 'COMPARE THE MAP TO THE SITE AND DIG WHERE THE PIN SHOULD BE. YOU ONLY HAVE SO MUCH DAYLIGHT.' },
    ],
    controls: 'ARROWS/WASD: MOVE   M: MAP   SPACE: DIG',
  },
  {
    id: 'deer', scene: 'DeerResistant', title: 'DEER RESISTANT', cast: 'la',
    tagline: '"DEER RESISTANT" IS A SUGGESTION.',
    intro: [
      { text: 'THE CLINIC OPENS MONDAY. THE PLANTING PLAN SAYS "DEER RESISTANT." THE DEER HAVE NOT READ IT.' },
      { text: 'EACH PLANT HAS TIME (TO PLANT), LOOK (HOW NICE) AND YUM (HOW TASTY TO DEER). MIX THEM UP. CLIENTS LOVE VARIETY.' },
      { text: 'WALK AT DEER TO SHOO THEM. WELL-FED DEER MAKE MORE DEER. THE TRUCK HAS 26 PLANTS. THE WALKTHROUGH IS IN 90 SECONDS.' },
    ],
    controls: 'ARROWS/WASD: MOVE   M OR 1-4: PLANT TYPE   HOLD SPACE ON A SPOT: PLANT',
  },
  { id: 'soon1', scene: null, title: 'COMING SOON', cast: null, tagline: 'MORE CABINETS ARRIVING SOON.' },
];
SA.level = (id) => SA.LEVELS.find((l) => l.id === id);
