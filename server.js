import express from "express";
import rateLimit from "express-rate-limit";
import fetch from "node-fetch";
import HttpsProxyAgent from "https-proxy-agent";

// === ENVIRONMENT CONFIG ===
const SCRAPER_SECRET = process.env.SCRAPER_SECRET || "changeme";
const PROXY_HOST = process.env.PROXY_HOST || "proxy.dataimpulse.com";
const PROXY_PORT = process.env.PROXY_PORT || "12345";
const PROXY_USER = process.env.PROXY_USER || "your-username";
const PROXY_PASS = process.env.PROXY_PASS || "your-password";

const SCRAPER_TIMEOUT = parseInt(process.env.SCRAPER_TIMEOUT || "10000", 10); // ms
const SCRAPER_RETRIES = parseInt(process.env.SCRAPER_RETRIES || "3", 10); // attempts

// Rate limit: 2 requests per second (per IP)
const limiter = rateLimit({
  windowMs: 1000,
  max: 2,
  standardHeaders: true,
  legacyHeaders: false
});

const app = express();
app.use(express.json());
app.use(limiter);

// === AUTH MIDDLEWARE ===
app.use((req, res, next) => {
  const authHeader = req.headers["authorization"];
  if (!authHeader || authHeader !== `Bearer ${SCRAPER_SECRET}`) {
    return res.status(403).json({ error: "Forbidden" });
  }
  next();
});

// === Helper: fetch with timeout & retries ===
async function fetchWithRetry(url, options, retries, timeout) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timer);

      if (!response.ok) {
        throw new Error(`Bad status ${response.status}`);
      }

      return response;
    } catch (err) {
      clearTimeout(timer);
      console.warn(`Attempt ${attempt} failed: ${err.message}`);
      if (attempt === retries) throw err;
    }
  }
}

// === SCRAPE ENDPOINT ===
app.post("/scrape", async (req, res) => {
  const { url } = req.body;

  if (!url || !/^https?:\/\//i.test(url)) {
    return res.status(400).json({ error: "Invalid or missing URL" });
  }

  try {
    const proxyUrl = `http://${PROXY_USER}:${PROXY_PASS}@${PROXY_HOST}:${PROXY_PORT}`;
    const agent = new HttpsProxyAgent(proxyUrl);

    const response = await fetchWithRetry(
      url,
      { agent },
      SCRAPER_RETRIES,
      SCRAPER_TIMEOUT
    );

    const html = await response.text();
    res.set("Content-Type", "text/html; charset=utf-8");
    return res.send(html);
  } catch (err) {
    console.error("Scraping failed:", err.message);
    return res.status(500).json({ error: "Failed to fetch target site" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Scraper listening on port ${PORT}`);
});
