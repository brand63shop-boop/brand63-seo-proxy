import { GoogleAuth } from "google-auth-library";

export default async function handler(req, res) {
  try {
    // Load credentials from environment
    if (!process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
      return res.status(500).json({ error: "Missing Google credentials env var" });
    }

    const auth = new GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON),
      scopes: ["https://www.googleapis.com/auth/webmasters.readonly"],
    });

    const client = await auth.getClient();

    // ✅ Make sure we query the right property: https://www.brand63.com
    const url =
      "https://www.googleapis.com/webmasters/v3/sites/https%3A%2F%2Fwww.brand63.com/searchAnalytics/query";

    // Dynamic: last 28 days
    const today = new Date();
    const endDate = today.toISOString().split("T")[0];
    const startDate = new Date(today.setDate(today.getDate() - 28))
      .toISOString()
      .split("T")[0];

    const body = {
      startDate,
      endDate,
      dimensions: ["page"],
      rowLimit: 10,
    };

    const response = await client.request({
      url,
      method: "POST",
      data: body,
    });

    return res.status(200).json(response.data);
  } catch (error) {
    console.error("GSC function error:", error);
    return res.status(500).json({ error: error.message });
  }
}

    res.status(500).json({ error: error.message });
  }
}

