const express = require("express");
const app = express();
const host = "0.0.0.0";
const port = 8000;

process.on("SIGINT", () => process.exit());
process.on("SIGTERM", () => process.exit());

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, host, () => {
  console.log(`Listening on ${host}:${port}`);
});
