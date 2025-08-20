import express from "express";
import { google } from "googleapis";

const app = express();
app.use(express.json({ limit: "5mb" }));

// --- Public health check (no secret required)
app.get("/health", (_req, res) => res.json({ ok: true }));

// --- Require your proxy secret for everything else
app.use((req, res, next) => {
  const secret = req.headers["x-proxy-secret"];
  if (!secret || secret !== process.env.PROXY_SECRET) {
    return res.status(403).json({ error: "Unauthorized" });
  }
  next();
});

// --- Google OAuth2 client using your env vars from Vercel
const oauth2 = new google.auth.OAuth2(
  process.env.GSC_CLIENT_ID,
  process.env.GSC_CLIENT_SECRET,
  // must match what you used to get the refresh token
  "https://developers.google.com/oauthplayground"
);
oauth2.setCredentials({ refresh_token: process.env.GSC_REFRESH_TOKEN });

const webmasters = google.webmasters({ version: "v3", auth: oauth2 });

// --- Pull top pages from Search Console (last 28 days)
app.get("/gsc/summary", async (_req, res) => {
  try {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 28);

    const fmt = (d) => d.toISOString().slice(0, 10);

    const response = await webmasters.searchanalytics.query({
      siteUrl: process.env.GSC_SITE_URL, // e.g. https://www.brand63.com
      requestBody: {
        startDate: fmt(start),
        endDate: fmt(end),
        dimensions: ["page"],
        rowLimit: 10
      }
    });

    res.json(response.data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: String(err && err.message ? err.message : err) });
  }
});

// --- Start server (Vercel Node runtime supports this)
app.listen(3000, () => console.log("Server running"));
