const express = require("express");

const app = express();

const argPort = Number(process.argv[2]);
const port = Number.isInteger(argPort) && argPort > 0 ? argPort : Number(process.env.PORT) || 3000;
const serverId = process.argv[3] || process.env.SERVER_ID || `backend-${port}`;

app.get("/", (_req, res) => {
  res.json({
    message: "Response from backend server",
    server: serverId,
    port,
    handledAt: new Date().toISOString(),
  });
});

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    server: serverId,
    port,
  });
});

app.listen(port, () => {
  console.log(`${serverId} started on http://localhost:${port}`);
});
