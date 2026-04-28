const express = require("express");
const os = require("os");

const app = express();

const port = Number(process.env.PORT) || 3000;
const serverId = process.env.SERVER_ID || os.hostname();

app.get("/", (_req, res) => {
  res.json({
    message: "Response from Docker backend",
    server: serverId,
    hostname: os.hostname(),
    port,
    handledAt: new Date().toISOString(),
  });
});

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    server: serverId,
    hostname: os.hostname(),
  });
});

app.listen(port, () => {
  console.log(`${serverId} started inside container on port ${port}`);
});
