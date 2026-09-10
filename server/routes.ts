import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertDiagramSchema, insertMapSystemSchema } from "@shared/schema";
import fs from "fs";
import path from "path";

export async function registerRoutes(app: Express): Promise<Server> {
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  // Geocoding proxy — keeps the MapBox token server-side so it is always available at runtime
  app.get("/api/geocode", async (req, res) => {
    const query = req.query.query as string;
    if (!query) return res.status(400).json({ message: "query param required" });
    const token = process.env.VITE_MAPBOX_TOKEN || process.env.MAPBOX_TOKEN;
    if (!token) return res.status(500).json({ message: "Geocoding not configured" });
    try {
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?country=AU&limit=1&access_token=${token}`;
      const response = await fetch(url);
      if (!response.ok) return res.status(response.status).json({ message: "Geocoding API error" });
      const data = await response.json();
      res.json(data);
    } catch (err) {
      res.status(500).json({ message: "Geocoding request failed" });
    }
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
      // Extract changeNote before Zod parses and strips unknown fields
      const changeNote = typeof req.body.changeNote === "string" ? req.body.changeNote.trim() : "";
      const data = insertMapSystemSchema.parse(req.body);
      const updated = await storage.updateMapSystem(id, data, changeNote);
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
