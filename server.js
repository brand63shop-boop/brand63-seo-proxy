import { GoogleAuth } from "google-auth-library";

export default async function handler(req, res) {
  try {
    // 1. Basic check: credentials exist
    if (!process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
      return res.status(200).json({
        ok: false,
        message: "Missing GOOGLE_APPLICATION_CREDENTIALS_JSON env variable",
      });
    }

    const auth = new GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON),
      scopes: ["https://www.googleapis.com/auth/webmasters.readonly"],
    });

    const client = await auth.getClient();

    // 2. Optional: Try a lightweight GSC API call
    const url =
      "https://www.googleapis.com/webmasters/v3/sites/https%3A%2F%2Fwww.brand63.com";
    try {
      await client.request({ url, method: "GET" });
      return res.status(200).json({ ok: true, message: "Connected to GSC ✅" });
    } catch (apiError) {
      console.error("Health check GSC error:", apiError.message);
      return res.status(200).json({
        ok: false,
        message: "Connected to Google, but no permission for https://www.brand63.com",
      });
    }
  } catch (error) {
    console.error("Health check error:", error.message);
    return res.status(200).json({ ok: false, message: error.message });
  }
}


    res.status(500).json({ error: error.message });
  }
}

