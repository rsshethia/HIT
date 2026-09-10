import {
  users, type User, type InsertUser,
  diagrams, type Diagram, type InsertDiagram,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  getDiagrams(): Promise<Diagram[]>;
  getDiagram(id: number): Promise<Diagram | undefined>;
  createDiagram(diagram: InsertDiagram): Promise<Diagram>;
  deleteDiagram(id: number): Promise<boolean>;
}

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

  async getDiagram(id: number): Promise<Diagram | undefined> {
    return this.diagrams.get(id);
  }

  async createDiagram(insertDiagram: InsertDiagram): Promise<Diagram> {
    const id = this.currentDiagramId++;
    const diagram: Diagram = { ...insertDiagram, id };
    this.diagrams.set(id, diagram);
    return diagram;
  }

  async deleteDiagram(id: number): Promise<boolean> {
    return this.diagrams.delete(id);
  }
}

export class DatabaseStorage extends MemStorage {
  async getDiagrams(): Promise<Diagram[]> {
    return db.select().from(diagrams).orderBy(desc(diagrams.createdAt));
  }

  async getDiagram(id: number): Promise<Diagram | undefined> {
    const rows = await db.select().from(diagrams).where(eq(diagrams.id, id));
    return rows[0];
  }

  async createDiagram(insertDiagram: InsertDiagram): Promise<Diagram> {
    const rows = await db.insert(diagrams).values(insertDiagram).returning();
    return rows[0];
  }

  async deleteDiagram(id: number): Promise<boolean> {
    const rows = await db.delete(diagrams).where(eq(diagrams.id, id)).returning({ id: diagrams.id });
    return rows.length > 0;
  }
}

export const storage = new DatabaseStorage();
