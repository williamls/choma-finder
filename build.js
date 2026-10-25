// Copies the site into dist/ and writes dist/config.js from .env or environment variables.
// Local:             node build.js && npx serve dist
// Cloudflare Pages:  build command "node build.js", output folder "dist",
//                    with the variables below set in the Pages settings.
const fs = require("fs");
const path = require("path");

const keys = ["SUPABASE_URL", "SUPABASE_ANON_KEY", "DEFAULT_COUNTRY_CODE"];

if (fs.existsSync(".env")) {
  for (const line of fs.readFileSync(".env", "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*?)\s*$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2];
  }
}

const config = {};
for (const k of keys) config[k] = process.env[k] || "";

fs.rmSync("dist", { recursive: true, force: true });
fs.mkdirSync("dist");
for (const f of fs.readdirSync(".")) {
  if (/\.(html|css|js)$/.test(f) && f !== "build.js") fs.copyFileSync(f, path.join("dist", f));
}
fs.writeFileSync(path.join("dist", "config.js"), "window.CONFIG = " + JSON.stringify(config) + ";\n");

console.log(config.SUPABASE_URL ? "Built with Supabase." : "Built with SAMPLE data (no SUPABASE_URL set).");
