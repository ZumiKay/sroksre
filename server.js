// server.js

// const next = require("next");
// const http = require("http");
// const express = require("express");
// const { Server } = require("socket.io");

// const dev = process.env.NODE_ENV !== "production";
// const app = next({ dev });
// const handle = app.getRequestHandler();

// const PORT = process.env.PORT || 3000;

// app.prepare().then(() => {
//   const expressApp = express();
//   const server = http.createServer(expressApp);
//   const io = new Server(server, {
//     cors: {
//       origin: "*",
//       methods: ["GET", "POST"],
//     },
//   });

//   expressApp.all("/api/*", (req, res) => {
//     return handle(req, res);
//   });

//   expressApp.all("*", (req, res) => {
//     return handle(req, res);
//   });

//   io.on("connection", (socket) => {
//     console.log(`: ${socket.id} user just connected!`);

//     socket.on("sendnotify", async (data) => {
//       io.emit("getnotify", data);
//     });
//   });

//   server.listen(PORT, (err) => {
//     if (err) throw err;
//     console.log(`Server running on http://localhost:${PORT}`);
//   });
// });

const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");

const port = parseInt(process.env.PORT || "3000", 10);
const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer((req, res) => {
    const parsedUrl = parse(req?.url, true);
    handle(req, res, parsedUrl);
  }).listen(port);

  console.log(
    `> Server listening at http://localhost:${port} as ${
      dev ? "development" : process.env.NODE_ENV
    }`
  );
});
