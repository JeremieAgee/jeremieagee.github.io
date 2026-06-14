const fs = require("fs"), path = require("path");
const root = "AgeeArcade";
let missing = [];
function checkHtml(htmlPath) {
  const html = fs.readFileSync(htmlPath, "utf8");
  const dir = path.dirname(htmlPath);
  const re = /(?:src|href)\s*=\s*["']([^"']+)["']/g;
  let m;
  while ((m = re.exec(html))) {
    let u = m[1];
    if (/^(https?:|\/\/|#|mailto:|data:|javascript:)/.test(u)) continue;
    u = u.split(/[?#]/)[0];
    if (!u) continue;
    const p = u.startsWith("/") ? path.join(".", u) : path.join(dir, u);
    if (fs.existsSync(p)) continue;
    if (fs.existsSync(path.join(p, "index.html"))) continue;
    missing.push(htmlPath + " -> " + m[1]);
  }
}
checkHtml(path.join(root, "index.html"));
for (const g of fs.readdirSync(path.join(root, "games"))) {
  for (const sub of ["index.html", path.join("leaderboard", "index.html")]) {
    const p = path.join(root, "games", g, sub);
    if (fs.existsSync(p)) checkHtml(p);
  }
}
for (const d of ["about", "leaderboards", "admin", "advertise"]) {
  const p = path.join(root, d, "index.html");
  if (fs.existsSync(p)) checkHtml(p);
}
console.log(missing.length ? "MISSING:\n" + missing.join("\n") : "all referenced local paths exist");
