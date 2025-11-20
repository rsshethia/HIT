import { users, type User, type InsertUser, type Diagram, type InsertDiagram } from "@shared/schema";

// Interface for storage operations
export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Diagram operations
  getDiagrams(): Promise<Diagram[]>;
  createDiagram(diagram: InsertDiagram): Promise<Diagram>;
  deleteDiagram(id: number): Promise<void>;
}

// In-memory storage implementation
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private diagrams: Map<number, Diagram>;
  currentId: number;
  currentDiagramId: number;

  constructor() {
    this.users = new Map();
    this.diagrams = new Map();
    this.currentId = 1;
    this.currentDiagramId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
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
}

export const storage = new MemStorage();
