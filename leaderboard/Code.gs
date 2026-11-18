// Storhaug Arcade — firm-wide high scores.
// Paste this into a Google Sheet's Extensions > Apps Script editor and deploy it as a web app
// (steps in the README, "Shared high scores"). Scores land on a "Scores" tab you can edit freely:
// delete a row to remove a score.

var KEEP = 10; // scores per level sent back to the game

function doGet() {
  return json_(top_());
}

function doPost(e) {
  var d = JSON.parse(e.postData.contents);
  var name = String(d.name || '???').toUpperCase().replace(/[^A-Z0-9 ]/g, '').slice(0, 3) || '???';
  var score = Math.round(Number(d.score)) || 0;
  var level = String(d.id || '').toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 20);
  if (level && score > 0) {
    var lock = LockService.getScriptLock();
    lock.waitLock(5000);
    try { sheet_().appendRow([new Date(), level, name, score]); } finally { lock.releaseLock(); }
  }
  return json_(top_());
}

function sheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName('Scores');
  if (!sh) {
    sh = ss.insertSheet('Scores');
    sh.appendRow(['When', 'Level', 'Name', 'Score']);
    sh.setFrozenRows(1);
  }
  return sh;
}

// { levelId: [{ name, score }, ...] }, best first
function top_() {
  var rows = sheet_().getDataRange().getValues().slice(1);
  var out = {};
  rows.forEach(function (r) {
    var level = String(r[1]), score = Number(r[3]);
    if (!level || !(score > 0)) return;
    (out[level] = out[level] || []).push({ name: String(r[2]), score: score });
  });
  Object.keys(out).forEach(function (k) {
    out[k].sort(function (a, b) { return b.score - a.score; });
    out[k] = out[k].slice(0, KEEP);
  });
  return out;
}

function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
