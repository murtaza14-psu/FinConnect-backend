import { pgTable, text, serial, integer, boolean, timestamp, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User model
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  password: text("password").notNull(),
  role: text("role").notNull().default("developer"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Subscription model
export const subscriptions = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  plan: text("plan").notNull(), // standard
  active: boolean("active").notNull().default(true),
  startDate: timestamp("start_date").notNull().defaultNow(),
  endDate: timestamp("end_date"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Transaction model
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  type: text("type").notNull(), // credit, debit
  amount: doublePrecision("amount").notNull(),
  description: text("description"),
  status: text("status").notNull(), // pending, completed, failed
  fromAccount: text("from_account"),
  toAccount: text("to_account"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// API Logs model
export const apiLogs = pgTable("api_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  endpoint: text("endpoint").notNull(),
  method: text("method").notNull(),
  statusCode: integer("status_code").notNull(),
  responseTime: integer("response_time").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  name: true,
  password: true,
  role: true,
});

export const insertSubscriptionSchema = createInsertSchema(subscriptions).pick({
  userId: true,
  plan: true,
  active: true,
  startDate: true,
  endDate: true,
});

export const insertTransactionSchema = createInsertSchema(transactions).pick({
  userId: true,
  type: true,
  amount: true,
  description: true,
  status: true,
  fromAccount: true,
  toAccount: true,
});

export const insertApiLogSchema = createInsertSchema(apiLogs).pick({
  userId: true,
  endpoint: true,
  method: true,
  statusCode: true,
  responseTime: true,
});

// Login schema
export const loginSchema = z.object({
  email: z.string().email({message: "Please enter a valid email address"}),
  password: z.string().min(6, {message: "Password must be at least 6 characters"}),
});

// Transfer schema
export const transferSchema = z.object({
  fromAccount: z.string(),
  toAccount: z.string(),
  amount: z.number().positive(),
  description: z.string().optional(),
});

// Subscription schema
export const subscriptionSchema = z.object({
  plan: z.enum(["standard"]),
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
export type Subscription = typeof subscriptions.$inferSelect;

export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactions.$inferSelect;

export type InsertApiLog = z.infer<typeof insertApiLogSchema>;
export type ApiLog = typeof apiLogs.$inferSelect;

export type Login = z.infer<typeof loginSchema>;
export type Transfer = z.infer<typeof transferSchema>;
