import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertDiagramSchema } from "@shared/schema";
import fs from "fs";
import path from "path";

export async function registerRoutes(app: Express): Promise<Server> {
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  // Diagram Routes
  app.get("/api/diagrams", async (_req, res) => {
    try {
      const diagrams = await storage.getDiagrams();
      res.json(diagrams);
    } catch (error) {
      res.status(500).json({ message: "Failed to load diagrams" });
    }
  });

  app.get("/api/diagrams/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
    try {
      const diagram = await storage.getDiagram(id);
      if (!diagram) return res.status(404).json({ message: "Diagram not found" });
      res.json(diagram);
    } catch (error) {
      res.status(500).json({ message: "Failed to load diagram" });
    }
  });

  app.post("/api/diagrams", async (req, res) => {
    try {
      // Server stamps createdAt so ordering is reliable (client clocks vary)
      const diagram = insertDiagramSchema.parse({
        ...req.body,
        createdAt: new Date().toISOString(),
      });
      const created = await storage.createDiagram(diagram);
      res.status(201).json(created);
    } catch (error) {
      res.status(400).json({ message: "Invalid diagram data" });
    }
  });

  app.delete("/api/diagrams/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
    try {
      const deleted = await storage.deleteDiagram(id);
      if (!deleted) return res.status(404).json({ message: "Diagram not found" });
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete diagram" });
    }
  });

  // Download Routes
  app.get("/api/downloads/message-trace", (_req, res) => {
    const candidates = [
      path.resolve(import.meta.dirname, "../client/public/Search-HL7Message.ps1"),
      path.resolve(import.meta.dirname, "public/Search-HL7Message.ps1"),
      path.resolve(import.meta.dirname, "../attached_assets/Search-HL7Message_1771285045312.ps1"),
    ];
    const filePath = candidates.find(p => fs.existsSync(p));
    if (!filePath) return res.status(404).json({ message: "Script file not found" });
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
    if (!filePath) return res.status(404).json({ message: "Script file not found" });
    const content = fs.readFileSync(filePath, "utf-8");
    res.json({ content });
  });

  // GeoKit SA2 sample downloads (tiny synthetic CSVs for 5-min trial)
  const geoKitFiles: Record<string, string> = {
    "sample-GNAF-1000.csv": "sample-GNAF-1000.csv",
    "sample-MB-to-SA.csv": "sample-MB-to-SA.csv",
  };
  app.get("/api/downloads/geo-kit/:name", (req, res) => {
    const mapped = geoKitFiles[req.params.name];
    if (!mapped) return res.status(404).json({ message: "Unknown kit file" });
    const candidates = [
      path.resolve(import.meta.dirname, "../client/public", mapped),
      path.resolve(import.meta.dirname, "public", mapped),
    ];
    const filePath = candidates.find(p => fs.existsSync(p));
    if (!filePath) return res.status(404).json({ message: "Kit file not found" });
    res.setHeader("Content-Disposition", `attachment; filename="${mapped}"`);
    res.setHeader("Content-Type", "text/csv");
    res.sendFile(filePath);
  });

  const server = createServer(app);
  return server;
}
