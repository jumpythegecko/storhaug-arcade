// ALL THE JOKES — edit freely. Keep to plain letters, numbers and . , ! ? ' " - + : / ( ) # & % = > < * $
SA.TEXT = {
  titleTop: 'STORHAUG ENGINEERING',
  titleBottom: 'THE VIDEO GAME',
  insertCoin: 'INSERT COFFEE TO START',
  copyright: '(C) 1993 STORHAUG ENGINEERING PLLC',

  // Post The Notice: what a neighbor yells when they spot you
  complaints: [
    "I'VE WALKED MY DOG HERE FOR YEARS, YOU CAN'T BUILD HERE!",
    'WHAT ABOUT THE TRAFFIC?!',
    'THE DEER LIVE HERE! WHERE WILL THE DEER GO?',
    'I WAS TOLD THIS WOULD ALWAYS BE A FIELD!',
    'IS THIS GOING TO BE APARTMENTS?!',
    "I'M CALLING THE COUNTY. AND MY CITY COUNCILMAN.",
    'MY KIDS SLED ON THIS HILL!',
    'THIS WILL RUIN MY VIEW OF THE OTHER HOUSES!',
    "I DIDN'T GET A MAILED NOTICE! (YOU DID.)",
    'MY PROPERTY VALUES!!',
  ],
  noticeWin: [
    'NOTICE POSTED. COMMENT PERIOD BEGINS.',
    'NOBODY SAW A THING.',
  ],

  // Find the Pin: what you dig up when you miss
  junk: [
    'A BEER CAN (CIRCA 1987)', 'A ROCK', 'ANOTHER ROCK', 'A SPRINKLER LINE. OOPS.',
    'AN OLD HORSESHOE', 'A GOLF BALL', 'SOMEONE ELSE\'S REBAR (NO CAP)', 'A BURIED DOG TOY',
    'NOTHING BUT DIRT', 'A HOT WHEELS CAR', 'BASALT. LOTS OF BASALT.',
  ],
  pinFound: [
    'FOUND 5/8" REBAR W/ YELLOW PLASTIC CAP',
    'CAP STAMPED "LS 12345"',
  ],

  // Deer Resistant: what the LA yells when shooing deer
  shoo: ['SHOO!', 'GIT!', 'NOT THE HOSTAS!', 'THAT WAS $40!', 'SPEC SAYS NO!', 'BAD DEER!', 'HEY! HEY!'],

  // Deer Resistant: at the end the client walks the site and comments on whatever they pass
  client: {
    deer: ['ARE THE DEER PART OF THE DESIGN?', 'OH! IS THAT ONE OURS?', 'DO THE DEER COME WITH A WARRANTY?'],
    stub: ['WHAT WAS THIS ONE SUPPOSED TO BE?', 'THIS ONE LOOKS... ARTISTIC.', 'IS THIS THE "NATIVE" LOOK?'],
    chewed: ['SOMETHING BIT THIS ONE.', 'IS IT SUPPOSED TO LOOK CHEWED?'],
    empty: ['WHAT GOES HERE?', 'IS THIS SPOT DONE?', 'I SEE... DIRT.'],
    rose: ['OOH, ROSES! VERY FANCY.', 'ROSES! NOW THAT IS CURB APPEAL.'],
    hosta: ['BIG LEAVES. I LIKE BIG LEAVES.', 'MY NEIGHBOR HAS THESE. THE DEER LOVE THEM.'],
    lavender: ['SMELLS LIKE A CANDLE STORE.', 'LAVENDER! VERY CALMING.'],
    boulder: ['WE PAID FOR ROCKS?', 'OH. A BOULDER.', 'HOW MUCH WAS THIS ROCK?'],
    // the final word at the end of the walkthrough, best to worst
    verdict: [
      { min: 0.85, lines: ['STUNNING. SEND ME THE INVOICE.', 'MY CEO IS GOING TO LOVE THIS.'] },
      { min: 0.6, lines: ['LOOKS GOOD! I HAVE A FEW COMMENTS.', 'NICE. CAN WE ADD MORE ROSES?'] },
      { min: 0.3, lines: ["HMM. LET'S SCHEDULE ANOTHER MEETING.", 'I THOUGHT IT WOULD BE... FULLER.'] },
      { min: 0, lines: ['I WILL BE CALLING YOUR BOSS.', 'WAS THIS THE CHEAP OPTION?'] },
    ],
    verdictNone: ['I THOUGHT WE PAID FOR PLANTS?', 'SO... WHERE IS THE LANDSCAPING?'],
  },

  // Grades on the results screen, best to worst
  grades: [
    { min: 0.85, label: 'STAMPED & APPROVED', color: 0x86a126 },
    { min: 0.6, label: 'APPROVED W/ COMMENTS', color: 0xf1c40f },
    { min: 0.3, label: 'REVISE & RESUBMIT', color: 0xe67e22 },
    { min: 0, label: 'REDLINED', color: 0xc0392b },
  ],
};
