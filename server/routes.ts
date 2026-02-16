import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertDiagramSchema } from "@shared/schema";
import fs from "fs";
import path from "path";

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

  app.get("/api/downloads/message-trace", (_req, res) => {
    const candidates = [
      path.resolve(import.meta.dirname, "../client/public/Search-HL7Message.ps1"),
      path.resolve(import.meta.dirname, "public/Search-HL7Message.ps1"),
      path.resolve(import.meta.dirname, "../attached_assets/Search-HL7Message_1771285045312.ps1"),
    ];
    const filePath = candidates.find(p => fs.existsSync(p));
    if (!filePath) {
      return res.status(404).json({ message: "Script file not found" });
    }
    res.setHeader("Content-Disposition", 'attachment; filename="Search-HL7Message.ps1"');
    res.setHeader("Content-Type", "text/plain");
    res.sendFile(filePath);
  });

  app.get("/api/downloads/message-trace/content", (_req, res) => {
    const candidates = [
      path.resolve(import.meta.dirname, "../client/public/Search-HL7Message.ps1"),
      path.resolve(import.meta.dirname, "public/Search-HL7Message.ps1"),
      path.resolve(import.meta.dirname, "../attached_assets/Search-HL7Message_1771285045312.ps1"),
    ];
    const filePath = candidates.find(p => fs.existsSync(p));
    if (!filePath) {
      return res.status(404).json({ message: "Script file not found" });
    }
    const content = fs.readFileSync(filePath, "utf-8");
    res.json({ content });
  });

  const server = createServer(app);

  return server;
}
