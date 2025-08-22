import { GoogleAuth } from "google-auth-library";

export default async function handler(req, res) {
  try {
    const auth = new GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON),
      scopes: ["https://www.googleapis.com/auth/webmasters.readonly"],
    });

    const client = await auth.getClient();

    // Example: call Search Console API
    const url = "https://www.googleapis.com/webmasters/v3/sites/https%3A%2F%2Fbrand63.com/searchAnalytics/query";
    const body = {
      startDate: "2024-07-01",
      endDate: "2024-07-31",
      dimensions: ["page"],
      rowLimit: 10,
    };

    const response = await client.request({ url, method: "POST", data: body });

    res.status(200).json(response.data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
}

