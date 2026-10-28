import express, { type Express } from "express";
import fs from "fs";
import path from "path";
import { createServer as createViteServer, createLogger } from "vite";
import { type Server } from "http";
import viteConfig from "../vite.config";

const viteLogger = createLogger();

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      },
    },
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html",
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${crypto.randomUUID()}"`,
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  const distPath = path.resolve(import.meta.dirname, "public");

  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  app.use(express.static(distPath));

  // Dynamic rendering for crawlers / AI-agent fetchers: serve the prerendered
  // snapshot (identical titles, summaries, links as the SPA) when present.
  // Humans and all other traffic fall through to the SPA untouched.
  const botPattern =
    /googlebot|bingbot|slurp|duckduckbot|baiduspider|yandexbot|facebookexternalhit|twitterbot|linkedinbot|gptbot|chatgpt-user|claudebot|anthropic|perplexity|cohere|bytespider|applebot|semrushbot|ahrefsbot|mj12bot/i;
  const snapshotDir = path.resolve(distPath, "__snapshots");
  app.get("*", (req, res, next) => {
    const ua = req.get("user-agent") ?? "";
    if (!botPattern.test(ua)) return next();
    const slug =
      req.path === "/" ? "index" : req.path.replace(/\/$/, "").replace(/^\//, "").replace(/\//g, "-");
    if (!/^[a-z0-9-]+$/i.test(slug)) return next();
    const file = path.resolve(snapshotDir, `${slug}.html`);
    if (!file.startsWith(snapshotDir) || !fs.existsSync(file)) return next();
    res.status(200).set({ "Content-Type": "text/html; charset=utf-8" });
    res.sendFile(file);
  });

  // fall through to index.html if the file doesn't exist
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
