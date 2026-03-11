import { pgTable, text, serial, integer, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const diagrams = pgTable("diagrams", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code").notNull(),
  createdAt: text("created_at").notNull(),
});

export const insertDiagramSchema = createInsertSchema(diagrams).pick({
  name: true,
  code: true,
  createdAt: true,
});

export type InsertDiagram = z.infer<typeof insertDiagramSchema>;
export type Diagram = typeof diagrams.$inferSelect;

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Map System records — healthcare digital systems across Australia
export const mapSystems = pgTable("map_systems", {
  id: serial("id").primaryKey(),
  systemName: text("system_name").notNull(),
  vendor: text("vendor").notNull(),
  department: text("department").notNull(),
  organization: text("organization").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull().default(""),
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const insertMapSystemSchema = createInsertSchema(mapSystems).omit({
  id: true,
});

export type InsertMapSystem = z.infer<typeof insertMapSystemSchema>;
export type MapSystem = typeof mapSystems.$inferSelect;

// Version history for each map system record
export const mapSystemHistory = pgTable("map_system_history", {
  id: serial("id").primaryKey(),
  systemId: integer("system_id").notNull(),
  systemName: text("system_name").notNull(),
  vendor: text("vendor").notNull(),
  department: text("department").notNull(),
  organization: text("organization").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull().default(""),
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  changeNote: text("change_note").notNull().default(""),
  changedAt: text("changed_at").notNull(),
});

export const insertMapSystemHistorySchema = createInsertSchema(mapSystemHistory).omit({
  id: true,
});

export type InsertMapSystemHistory = z.infer<typeof insertMapSystemHistorySchema>;
export type MapSystemHistory = typeof mapSystemHistory.$inferSelect;
