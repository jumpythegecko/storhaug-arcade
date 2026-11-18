# Storhaug Engineering: The Video Game

A retro arcade of short minigames. Plain HTML + JavaScript + Phaser 3, no build step.

## Play it
- Double-click `index.html`, or
- From this folder run `python -m http.server 8765` and open http://localhost:8765

Controls: arrows/WASD move, Space acts, M opens the map / changes plant, Esc pauses, N mutes. Game controllers work too.
A key of the controls stays along the bottom of the screen in every level.

## Where to change things
| To change... | Edit |
|---|---|
| Character roles, sprite colors, hats/beards/vests | `src/config/cast.js` |
| Jokes: complaints, dig junk, grades, title text | `src/config/text.js` |
| Which cabinets appear, their order, intro pages | `src/config/levels.js` |
| A level's gameplay | `src/levels/<LevelName>.js` |
| Deer Resistant plant stats and balance knobs | top of `src/levels/DeerResistant.js` (`SA.PLANTS`, `SA.DEER_TUNING`) |

## Adding comic art (cutscenes)
Put a PNG in `assets/cutscenes/` and add `image: 'assets/cutscenes/<file>.png'` to that
intro page in `src/config/levels.js`. It shows in the comic panel instead of the sprite.

## Adding a level
1. Copy a file in `src/levels/` and rename the class and scene key.
2. Add its `<script>` line to `index.html` and its class to the `scene:` list in `src/main.js`.
3. Add an entry to `src/config/levels.js` (it becomes a cabinet).
   Add `SA.keyBar(this, [['ARROWS', 'MOVE'], ['SPACE', 'WHATEVER']])` in its `create()` for the controls key.
4. When it ends, start `Results` with `{ id, win, score, ratio, headline, lines }`.


## Online
Live at https://jumpythegecko.github.io/storhaug-arcade/ (GitHub Pages, from the `main` branch of
jumpythegecko/storhaug-arcade). Push a change to `main` and the site updates in a minute or two.

## Shared high scores (Google Sheet)
Until this is set up, each player's scores stay in their own browser.
1. Make a new Google Sheet (any name, e.g. "Storhaug Arcade Scores").
2. In the sheet: **Extensions > Apps Script**. Delete what's there, paste in all of
   `leaderboard/Code.gs`, and click **Save**.
3. Click **Deploy > New deployment**. Gear icon > **Web app**.
   - Execute as: **Me**
   - Who has access: **Anyone**
4. Click **Deploy**, approve the permissions it asks for, and copy the **Web app URL**
   (ends in `/exec`).
5. Paste that URL into `src/config/leaderboard.js` (`SA.LEADERBOARD_URL = '...'`) and push.

Scores then appear on a "Scores" tab in the sheet. Delete a row to remove a score.
If you edit the script later, use **Deploy > Manage deployments > Edit > New version** so the URL stays the same.

## Putting it on SharePoint (image + link)
1. Edit the SharePoint home page and add an **Image** web part.
2. Upload `assets/share/banner.png`.
3. In the image's settings, set the **Link** to https://jumpythegecko.github.io/storhaug-arcade/
   and turn on opening it in a new tab if offered.
4. Republish the page.
