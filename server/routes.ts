import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

export async function registerRoutes(app: Express): Promise<Server> {
  // For now, we don't need any API routes as the assessment tool
  // operates fully client-side

  // API route for future extensions, e.g., saving assessment results
  app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  const httpServer = createServer(app);

  return httpServer;
}
