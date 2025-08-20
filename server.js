// server.js
import express from "express";
import { google } from "googleapis";

const app = express();
app.use(express.json({ limit: "5mb" }));

// --- PUBLIC: health check (no secret required)
app.get("/health", (_req, res) => res.json({ ok: true }));

// --- SECRET GATE: everything below requires x-proxy-secret
app.use((req, res, next) => {
  const secret = req.headers["x-proxy-secret"];
  if (!secret || secret !== process.env.PROXY_SECRET) {
    return res.status(403).json({ error: "Unauthorized" });
  }
  next();
});

// --- helper: get authenticated Google client from env
function getOauthClient() {
  const cid = process.env.GOOGLE_CLIENT_ID;
  const csecret = process.env.GOOGLE_CLIENT_SECRET;
  const refresh = process.env.GOOGLE_REFRESH_TOKEN;
  if (!cid || !csecret || !refresh) {
    throw new Error("Missing GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET / GOOGLE_REFRESH_TOKEN");
  }
  const oauth2 = new google.auth.OAuth2(cid, csecret);
  oauth2.setCredentials({ refresh_token: refresh });
  return oauth2;
}

// --- GET /gsc/summary -> top pages last 28 days
app.get("/gsc/summary", async (req, res) => {
  try {
    const siteUrl = process.env.GSC_SITE_URL; // e.g. https://www.brand63.com
    if (!siteUrl) throw new Error("Missing GSC_SITE_URL");

    const auth = getOauthClient();
    const webmasters = google.webmasters({ version: "v3", auth });

    // date range: last 28 days
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 28);
    const fmt = (d) => d.toISOString().slice(0, 10);

    const resp = await webmasters.searchanalytics.query({
      siteUrl,
      requestBody: {
        startDate: fmt(start),
        endDate: fmt(end),
        dimensions: ["page"],
        rowLimit: 10
      }
    });

    res.json({
      siteUrl,
      startDate: fmt(start),
      endDate: fmt(end),
      rows: resp.data.rows || []
    });
  } catch (err) {
    res.status(401).json({ error: String(err.message || err) });
  }
});

// --- start (Vercel will handle the listener in serverless env, but keeping for local)
app.listen(3000, () => console.log("Server running"));
