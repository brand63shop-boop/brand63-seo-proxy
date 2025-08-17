# Brand63 SEO Proxy (starter)
Endpoints:
- GET /health
- GET /gsc/summary  (uses GOOGLE_KEY + GSC_SITE_URL)
- POST /shopify/product/seo  (uses SHOPIFY_STORE + SHOPIFY_TOKEN)

Environment variables required:
- SHOPIFY_STORE = your-store.myshopify.com
- SHOPIFY_TOKEN = shpat_xxx
- GSC_SITE_URL  = https://www.brand63.com
- GOOGLE_KEY    = (paste JSON contents from your Google service account)
