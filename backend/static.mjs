import { existsSync, readFileSync, copyFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import { PORTRAIT_CSS } from "./config.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WEB_DIST  = path.join(__dirname, "../frontend/dist");

/**
 * Registers static file serving and SPA catch-all route on the given Express app.
 * No-ops silently if the frontend build directory does not exist.
 * @param {import("express").Application} app
 */
export function registerStaticServing(app) {
  if (!existsSync(WEB_DIST)) return;

  const logoSrc  = path.join(__dirname, "../frontend/assets/images/logo.png");
  const logoDest = path.join(WEB_DIST, "logo.png");
  if (existsSync(logoSrc) && !existsSync(logoDest)) {
    try { copyFileSync(logoSrc, logoDest); } catch { /* non-critical */ }
  }

  const indexHtmlPath = path.join(WEB_DIST, "index.html");
  let cachedHtml = null;

  const getPortraitHtml = () => {
    if (!cachedHtml) {
      try {
        const raw = readFileSync(indexHtmlPath, "utf8");
        cachedHtml = raw
          .replace(/<link rel="icon" href="\/favicon\.ico" ?\/?>/gi, "")
          .replace("</head>", `${PORTRAIT_CSS}</head>`);
      } catch {
        cachedHtml = `<!DOCTYPE html><html><body><p>App loading…</p></body></html>`;
      }
    }
    return cachedHtml;
  };

  app.use(express.static(WEB_DIST, { index: false }));

  const API_PREFIXES = ["/api/", "/tonconnect-manifest.json", "/health"];

  app.get("/{*splat}", (req, res, next) => {
    if (API_PREFIXES.some((p) => req.path.startsWith(p))) return next();
    res.setHeader("Content-Type",  "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Pragma",        "no-cache");
    res.send(getPortraitHtml());
  });

  console.log("[Static] Serving Expo web build from:", WEB_DIST);
}
