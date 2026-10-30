const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "../dist");
const types = {
  ".js": "application/javascript",
  ".html": "text/html",
  ".css": "text/css",
  ".json": "application/json",
  ".ttf": "font/ttf",
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".wav": "audio/wav",
  ".ico": "image/x-icon",
};
http
  .createServer((req, res) => {
    let url;
    try {
      url = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
    } catch {
      res.writeHead(400);
      res.end();
      return;
    }
    let target = path.resolve(root, "." + url);
    if (target !== root && !target.startsWith(root + path.sep)) {
      res.writeHead(403);
      res.end();
      return;
    }
    if (!fs.existsSync(target) || fs.statSync(target).isDirectory())
      target = path.join(root, "index.html");
    res.writeHead(200, {
      "Content-Type": types[path.extname(target)] || "application/octet-stream",
      "Cache-Control": "no-store",
    });
    fs.createReadStream(target).pipe(res);
  })
  .listen(Number(process.argv[2] || 4176), "127.0.0.1", () =>
    process.stdout.write(
      `CorpTimer mobile preview: http://127.0.0.1:${process.argv[2] || 4176}\n`,
    ),
  );
