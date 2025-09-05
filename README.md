# Render Scraper Service

This is a simple web scraping proxy service using **Express** and **DataImpulse proxy**,
designed to be deployed on [Render](https://render.com).

## Features
- Secure access with a shared secret (`Authorization: Bearer <SECRET>`)
- Rate limiting (2 requests per second, configurable)
- Timeout + retries for stability
- Returns raw HTML from target sites via DataImpulse proxies

## Deployment

1. Fork or push this repo to GitHub/GitLab/Bitbucket.
2. In Render Dashboard:
   - Click **New → Web Service**
   - Connect the repo
   - Render will auto-detect the `Dockerfile` and build using `node:22-alpine`
3. Set environment variables:

```bash
SCRAPER_SECRET=your-strong-secret
PROXY_HOST=proxy.dataimpulse.com
PROXY_PORT=12345
PROXY_USER=your-username
PROXY_PASS=your-password
SCRAPER_TIMEOUT=10000
SCRAPER_RETRIES=3
