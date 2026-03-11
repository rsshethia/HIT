import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertDiagramSchema, insertMapSystemSchema } from "@shared/schema";
import { z } from "zod";
import fs from "fs";
import path from "path";

export async function registerRoutes(app: Express): Promise<Server> {
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
    if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
    await storage.deleteDiagram(id);
    res.status(204).send();
  });

  // Map System Routes
  app.get("/api/map/systems", async (_req, res) => {
    const systems = await storage.getMapSystems();
    res.json(systems);
  });

  app.get("/api/map/systems/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
    const system = await storage.getMapSystem(id);
    if (!system) return res.status(404).json({ message: "System not found" });
    res.json(system);
  });

  app.post("/api/map/systems", async (req, res) => {
    try {
      const data = insertMapSystemSchema.parse(req.body);
      const created = await storage.createMapSystem(data);
      res.status(201).json(created);
    } catch (error) {
      res.status(400).json({ message: "Invalid system data" });
    }
  });

  app.put("/api/map/systems/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
      const data = insertMapSystemSchema.parse(req.body);
      const updated = await storage.updateMapSystem(id, data);
      if (!updated) return res.status(404).json({ message: "System not found" });
      res.json(updated);
    } catch (error) {
      res.status(400).json({ message: "Invalid system data" });
    }
  });

  app.get("/api/map/systems/:id/history", async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
    const history = await storage.getMapSystemHistory(id);
    res.json(history);
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

  const server = createServer(app);
  return server;
}
