import express from "express";
import fetch from "node-fetch";
import { google } from "googleapis";

const app = express();
app.use(express.json({ limit: "5mb" }));
// Simple shared-secret check
app.use((req, res, next) => {
  const need = process.env.PROXY_SECRET;
  if (!need) return next();
  if (req.headers["x-proxy-secret"] === need) return next();
  return res.status(401).json({ error: "Unauthorized" });
});

// --- Health check ---
app.get("/health", (_req, res) => res.json({ ok: true }));

// --- Google Search Console: quick clicks/impressions by page ---
app.get("/gsc/summary", async (req, res) => {
  try {
    const siteUrl = process.env.GSC_SITE_URL; // e.g. https://www.brand63.com
    if (!siteUrl) throw new Error("Missing GSC_SITE_URL");

    const key = JSON.parse(process.env.GOOGLE_KEY || "{}");
    const scopes = ["https://www.googleapis.com/auth/webmasters.readonly"];
    const jwt = new google.auth.JWT(key.client_email, null, key.private_key, scopes);
    await jwt.authorize();
    const webmasters = google.webmasters({ version: "v3", auth: jwt });

    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 28);

    const rq = {
      startDate: start.toISOString().slice(0, 10),
      endDate: end.toISOString().slice(0, 10),
      dimensions: ["page"],
      rowLimit: 50
    };

    const { data } = await webmasters.searchanalytics.query({ siteUrl, requestBody: rq });
    res.json({ siteUrl, rows: data.rows || [] });
  } catch (e) {
    res.status(500).json({ error: String(e.message || e) });
  }
});

// --- Shopify: set SEO title/description for one product (global namespace) ---
app.post("/shopify/product/seo", async (req, res) => {
  try {
    const { product_id, title_tag, description_tag } = req.body;
    const store = process.env.SHOPIFY_STORE; // e.g. brand63.myshopify.com
    const token = process.env.SHOPIFY_TOKEN; // shpat_...

    if (!store || !token) throw new Error("Missing SHOPIFY_STORE or SHOPIFY_TOKEN");
    if (!product_id) throw new Error("Missing product_id");

    const base = `https://${store}/admin/api/2024-04`;
    const headers = {
      "X-Shopify-Access-Token": token,
      "Content-Type": "application/json"
    };

    async function upsertMetafield(key, value) {
      const body = {
        metafield: {
          namespace: "global",
          key,
          value,
          type: "single_line_text_field",
          owner_resource: "product",
          owner_id: product_id
        }
      };
      const r = await fetch(`${base}/metafields.json`, { method: "POST", headers, body: JSON.stringify(body) });
      if (!r.ok) {
        const txt = await r.text();
        throw new Error(`Shopify error: ${txt}`);
      }
    }

    if (title_tag) await upsertMetafield("title_tag", title_tag);
    if (description_tag) await upsertMetafield("description_tag", description_tag);

    res.json({ ok: true, product_id });
  } catch (e) {
    res.status(500).json({ error: String(e.message || e) });
  }
});

// Fallback
app.all("*", (_req, res) => res.status(404).json({ error: "Not found" }));

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Proxy running on ${port}`));
