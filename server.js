// server.js
const express = require("express");
const http = require("http");
const next = require("next");

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

const expressApp = express();
const server = http.createServer(expressApp);

const PORT = process.env.PORT || 3000;

app.prepare().then(() => {
  expressApp.all("*", (req, res) => {
    return handle(req, res);
  });

  server.listen(PORT, (err) => {
    if (err) throw err;
    console.log(`Server running on http://localhost:${PORT}`);
  });
});
