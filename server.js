import express from "express";
import fetch from "node-fetch";
import { google } from "googleapis";

const app = express();
app.use(express.json({ limit: "5mb" }));

// PUBLIC health check (no secret required)
app.get("/health", (_req, res) => res.json({ ok: true }));

// Protect everything else with your secret
app.use((req, res, next) => {
  const secret = req.headers["x-proxy-secret"];
  if (!secret || secret !== process.env.PROXY_SECRET) {
    return res.status(403).json({ error: "Unauthorized" });
  }
  next();
});

// Example protected route
app.get("/gsc/summary", (req, res) => {
  res.json({ message: "This will show GSC data once hooked up" });
});

app.listen(3000, () => console.log("Server running"));
