import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertDiagramSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check endpoint
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  // Diagram Routes
  app.get("/api/diagrams", async (_req, res) => {
    const diagrams = await storage.getDiagrams();
    res.json(diagrams);
  });

  app.post("/api/diagrams", async (req, res) => {
    try {
      const diagram = insertDiagramSchema.parse(req.body);
      const created = await storage.createDiagram(diagram);
      res.status(201).json(created);
    } catch (error) {
      res.status(400).json({ message: "Invalid diagram data" });
    }
  });

  app.delete("/api/diagrams/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid ID" });
    }
    await storage.deleteDiagram(id);
    res.status(204).send();
  });

  const server = createServer(app);

  return server;
}
