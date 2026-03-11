import {
  users, type User, type InsertUser,
  type Diagram, type InsertDiagram,
  type MapSystem, type InsertMapSystem,
  type MapSystemHistory, type InsertMapSystemHistory,
} from "@shared/schema";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  getDiagrams(): Promise<Diagram[]>;
  createDiagram(diagram: InsertDiagram): Promise<Diagram>;
  deleteDiagram(id: number): Promise<void>;

  getMapSystems(): Promise<MapSystem[]>;
  getMapSystem(id: number): Promise<MapSystem | undefined>;
  createMapSystem(data: InsertMapSystem): Promise<MapSystem>;
  updateMapSystem(id: number, data: InsertMapSystem): Promise<MapSystem | undefined>;
  getMapSystemHistory(systemId: number): Promise<MapSystemHistory[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private diagrams: Map<number, Diagram>;
  private mapSystems: Map<number, MapSystem>;
  private mapSystemHistory: Map<number, MapSystemHistory>;
  currentId: number;
  currentDiagramId: number;
  currentMapSystemId: number;
  currentMapSystemHistoryId: number;

  constructor() {
    this.users = new Map();
    this.diagrams = new Map();
    this.mapSystems = new Map();
    this.mapSystemHistory = new Map();
    this.currentId = 1;
    this.currentDiagramId = 1;
    this.currentMapSystemId = 1;
    this.currentMapSystemHistoryId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(u => u.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getDiagrams(): Promise<Diagram[]> {
    return Array.from(this.diagrams.values()).sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async createDiagram(insertDiagram: InsertDiagram): Promise<Diagram> {
    const id = this.currentDiagramId++;
    const diagram: Diagram = { ...insertDiagram, id };
    this.diagrams.set(id, diagram);
    return diagram;
  }

  async deleteDiagram(id: number): Promise<void> {
    this.diagrams.delete(id);
  }

  async getMapSystems(): Promise<MapSystem[]> {
    return Array.from(this.mapSystems.values()).sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async getMapSystem(id: number): Promise<MapSystem | undefined> {
    return this.mapSystems.get(id);
  }

  async createMapSystem(data: InsertMapSystem): Promise<MapSystem> {
    const id = this.currentMapSystemId++;
    const system: MapSystem = { ...data, id };
    this.mapSystems.set(id, system);
    return system;
  }

  async updateMapSystem(id: number, data: InsertMapSystem): Promise<MapSystem | undefined> {
    const existing = this.mapSystems.get(id);
    if (!existing) return undefined;

    // Archive current version to history
    const historyId = this.currentMapSystemHistoryId++;
    const historyEntry: MapSystemHistory = {
      id: historyId,
      systemId: existing.id,
      systemName: existing.systemName,
      vendor: existing.vendor,
      department: existing.department,
      organization: existing.organization,
      city: existing.city,
      state: existing.state,
      latitude: existing.latitude,
      longitude: existing.longitude,
      changeNote: (data as any).changeNote ?? "",
      changedAt: new Date().toISOString(),
    };
    this.mapSystemHistory.set(historyId, historyEntry);

    // Apply update
    const updated: MapSystem = { ...existing, ...data, id };
    this.mapSystems.set(id, updated);
    return updated;
  }

  async getMapSystemHistory(systemId: number): Promise<MapSystemHistory[]> {
    return Array.from(this.mapSystemHistory.values())
      .filter(h => h.systemId === systemId)
      .sort((a, b) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime());
  }
}

export const storage = new MemStorage();
