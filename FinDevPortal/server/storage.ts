import Database from 'better-sqlite3';
import {
  User, InsertUser, 
  Subscription, InsertSubscription,
  Transaction, InsertTransaction,
  ApiLog, InsertApiLog
} from "@shared/schema";

// Modify the interface with any CRUD methods
// you might need
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  
  // Subscription methods
  createSubscription(subscription: InsertSubscription): Promise<Subscription>;
  getSubscriptionById(id: number): Promise<Subscription | undefined>;
  getSubscriptionsByUserId(userId: number): Promise<Subscription[]>;
  getActiveSubscriptionByUserId(userId: number): Promise<Subscription | undefined>;
  cancelSubscription(id: number): Promise<Subscription>;
  
  // Transaction methods
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  getTransactionById(id: number): Promise<Transaction | undefined>;
  getTransactionsByUserId(userId: number, page?: number, pageSize?: number): Promise<{ transactions: Transaction[], total: number }>;
  
  // API Logs methods
  createApiLog(log: InsertApiLog): Promise<ApiLog>;
  getApiLogs(page?: number, pageSize?: number): Promise<{ logs: ApiLog[], total: number }>;
  getUserApiLogs(userId: number, page?: number, pageSize?: number): Promise<{ logs: ApiLog[], total: number }>;
  
  // Auth methods
  hasUserSubscription(userId: number): Promise<boolean>;
}

// SQLite storage implementation
export class SQLiteStorage implements IStorage {
  private db: Database.Database;
  
  constructor() {
    // Use a fresh database file
    this.db = new Database('finconnect_new.db');
    this.initializeDatabase();
  }
  
  private initializeDatabase() {
    // Drop dependent tables first (foreign key constraints)
    this.db.exec(`DROP TABLE IF EXISTS api_logs`);
    this.db.exec(`DROP TABLE IF EXISTS transactions`);
    this.db.exec(`DROP TABLE IF EXISTS subscriptions`);
    
    // Drop users table if it exists to recreate it with correct schema
    this.db.exec(`DROP TABLE IF EXISTS users`);
    
    // Create users table with correct schema
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        email TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'developer',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create subscriptions table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS subscriptions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        plan TEXT NOT NULL,
        active BOOLEAN NOT NULL DEFAULT 1,
        start_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        end_date TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `);
    
    // Create transactions table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        type TEXT NOT NULL,
        amount REAL NOT NULL,
        description TEXT,
        status TEXT NOT NULL,
        from_account TEXT,
        to_account TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `);
    
    // Create api_logs table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS api_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        endpoint TEXT NOT NULL,
        method TEXT NOT NULL,
        status_code INTEGER NOT NULL,
        response_time INTEGER NOT NULL,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `);
    
    // Check if we have any users, if not create default ones
    const userCount = this.db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
    
    if (userCount.count === 0) {
      // Create admin user - password: admin123
      this.db.prepare(`
        INSERT INTO users (username, email, name, password, role)
        VALUES (?, ?, ?, ?, ?)
      `).run('admin', 'admin@finconnect.com', 'Admin User', '$2b$10$JKbGkMa7ZoHFZZ.KARvbR.E6iRyiLxFFHJFXVV.F7fFX6p85TUHWS', 'admin');
      
      // Create developer user - password: developer123
      this.db.prepare(`
        INSERT INTO users (username, email, name, password, role)
        VALUES (?, ?, ?, ?, ?)
      `).run('developer', 'developer@finconnect.com', 'Developer User', '$2b$10$3QWMxcMvkZC9LgyLLsIPdu2dST7SLuVhK5QCLBHCwE3VJrK7oDl1.', 'developer');
    }
  }
  
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const user = this.db.prepare('SELECT * FROM users WHERE id = ?').get(id) as any;
    
    if (!user) return undefined;
    
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      name: user.name,
      password: user.password,
      role: user.role,
      createdAt: new Date(user.created_at)
    };
  }
  
  async getUserByUsername(username: string): Promise<User | undefined> {
    const user = this.db.prepare('SELECT * FROM users WHERE username = ?').get(username) as any;
    
    if (!user) return undefined;
    
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      name: user.name,
      password: user.password,
      role: user.role,
      createdAt: new Date(user.created_at)
    };
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    const user = this.db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;
    
    if (!user) return undefined;
    
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      name: user.name,
      password: user.password,
      role: user.role,
      createdAt: new Date(user.created_at)
    };
  }
  
  async createUser(insertUser: InsertUser): Promise<User> {
    const stmt = this.db.prepare(`
      INSERT INTO users (username, email, name, password, role)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      insertUser.username,
      insertUser.email,
      insertUser.name,
      insertUser.password,
      insertUser.role || 'developer'
    );
    
    return {
      id: result.lastInsertRowid as number,
      username: insertUser.username,
      email: insertUser.email,
      name: insertUser.name,
      password: insertUser.password,
      role: insertUser.role || 'developer',
      createdAt: new Date()
    };
  }
  
  async getAllUsers(): Promise<User[]> {
    const users = this.db.prepare('SELECT * FROM users').all() as any[];
    
    // Convert created_at strings to Date objects
    return users.map(user => ({
      id: user.id,
      username: user.username,
      email: user.email,
      name: user.name,
      password: user.password,
      role: user.role,
      createdAt: new Date(user.created_at)
    }));
  }
  
  // Subscription methods
  async createSubscription(insertSubscription: InsertSubscription): Promise<Subscription> {
    const stmt = this.db.prepare(`
      INSERT INTO subscriptions (user_id, plan, active, start_date, end_date)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    const startDate = insertSubscription.startDate ? insertSubscription.startDate.toISOString() : new Date().toISOString();
    const endDate = insertSubscription.endDate ? insertSubscription.endDate.toISOString() : null;
    
    const result = stmt.run(
      insertSubscription.userId,
      insertSubscription.plan,
      insertSubscription.active !== undefined ? (insertSubscription.active ? 1 : 0) : 1,
      startDate,
      endDate
    );
    
    return {
      id: result.lastInsertRowid as number,
      userId: insertSubscription.userId,
      plan: insertSubscription.plan,
      active: insertSubscription.active !== undefined ? insertSubscription.active : true,
      startDate: insertSubscription.startDate || new Date(),
      endDate: insertSubscription.endDate || null,
      createdAt: new Date()
    };
  }
  
  async getSubscriptionById(id: number): Promise<Subscription | undefined> {
    const subscription = this.db.prepare('SELECT * FROM subscriptions WHERE id = ?').get(id) as any;
    
    if (!subscription) return undefined;
    
    return {
      id: subscription.id,
      userId: subscription.user_id,
      plan: subscription.plan,
      active: !!subscription.active,
      startDate: new Date(subscription.start_date),
      endDate: subscription.end_date ? new Date(subscription.end_date) : null,
      createdAt: new Date(subscription.created_at)
    };
  }
  
  async getSubscriptionsByUserId(userId: number): Promise<Subscription[]> {
    const subscriptions = this.db.prepare('SELECT * FROM subscriptions WHERE user_id = ?').all(userId) as any[];
    
    return subscriptions.map(subscription => ({
      id: subscription.id,
      userId: subscription.user_id,
      plan: subscription.plan,
      active: !!subscription.active,
      startDate: new Date(subscription.start_date),
      endDate: subscription.end_date ? new Date(subscription.end_date) : null,
      createdAt: new Date(subscription.created_at)
    }));
  }
  
  async getActiveSubscriptionByUserId(userId: number): Promise<Subscription | undefined> {
    const subscription = this.db.prepare('SELECT * FROM subscriptions WHERE user_id = ? AND active = 1').get(userId) as any;
    
    if (!subscription) return undefined;
    
    return {
      id: subscription.id,
      userId: subscription.user_id,
      plan: subscription.plan,
      active: true,
      startDate: new Date(subscription.start_date),
      endDate: subscription.end_date ? new Date(subscription.end_date) : null,
      createdAt: new Date(subscription.created_at)
    };
  }
  
  async cancelSubscription(id: number): Promise<Subscription> {
    // First get the subscription to make sure it exists
    const subscription = await this.getSubscriptionById(id);
    if (!subscription) {
      throw new Error('Subscription not found');
    }
    
    // Update the subscription
    const endDate = new Date().toISOString();
    this.db.prepare(`
      UPDATE subscriptions 
      SET active = 0, end_date = ? 
      WHERE id = ?
    `).run(endDate, id);
    
    // Return the updated subscription
    return {
      ...subscription,
      active: false,
      endDate: new Date()
    };
  }
  
  // Transaction methods
  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const stmt = this.db.prepare(`
      INSERT INTO transactions (user_id, type, amount, description, status, from_account, to_account)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      insertTransaction.userId,
      insertTransaction.type,
      insertTransaction.amount,
      insertTransaction.description || null,
      insertTransaction.status,
      insertTransaction.fromAccount || null,
      insertTransaction.toAccount || null
    );
    
    return {
      id: result.lastInsertRowid as number,
      userId: insertTransaction.userId,
      type: insertTransaction.type,
      amount: insertTransaction.amount,
      description: insertTransaction.description || null,
      status: insertTransaction.status,
      fromAccount: insertTransaction.fromAccount || null,
      toAccount: insertTransaction.toAccount || null,
      createdAt: new Date()
    };
  }
  
  async getTransactionById(id: number): Promise<Transaction | undefined> {
    const transaction = this.db.prepare('SELECT * FROM transactions WHERE id = ?').get(id) as any;
    
    if (!transaction) return undefined;
    
    return {
      id: transaction.id,
      userId: transaction.user_id,
      type: transaction.type,
      amount: transaction.amount,
      description: transaction.description,
      status: transaction.status,
      fromAccount: transaction.from_account,
      toAccount: transaction.to_account,
      createdAt: new Date(transaction.created_at)
    };
  }
  
  async getTransactionsByUserId(
    userId: number,
    page: number = 1,
    pageSize: number = 10
  ): Promise<{ transactions: Transaction[], total: number }> {
    // Get total count
    const totalResult = this.db.prepare('SELECT COUNT(*) as count FROM transactions WHERE user_id = ?').get(userId) as { count: number };
    const total = totalResult.count;
    
    // Calculate pagination
    const offset = (page - 1) * pageSize;
    
    // Get transactions
    const transactionsResult = this.db.prepare(`
      SELECT * FROM transactions 
      WHERE user_id = ? 
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `).all(userId, pageSize, offset) as any[];
    
    const transactions = transactionsResult.map(transaction => ({
      id: transaction.id,
      userId: transaction.user_id,
      type: transaction.type,
      amount: transaction.amount,
      description: transaction.description,
      status: transaction.status,
      fromAccount: transaction.from_account,
      toAccount: transaction.to_account,
      createdAt: new Date(transaction.created_at)
    }));
    
    return { transactions, total };
  }
  
  // API Logs methods
  async createApiLog(insertLog: InsertApiLog): Promise<ApiLog> {
    const stmt = this.db.prepare(`
      INSERT INTO api_logs (user_id, endpoint, method, status_code, response_time)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      insertLog.userId,
      insertLog.endpoint,
      insertLog.method,
      insertLog.statusCode,
      insertLog.responseTime
    );
    
    return {
      id: result.lastInsertRowid as number,
      ...insertLog,
      timestamp: new Date()
    };
  }
  
  async getApiLogs(
    page: number = 1,
    pageSize: number = 10
  ): Promise<{ logs: ApiLog[], total: number }> {
    // Get total count
    const totalResult = this.db.prepare('SELECT COUNT(*) as count FROM api_logs').get() as { count: number };
    const total = totalResult.count;
    
    // Calculate pagination
    const offset = (page - 1) * pageSize;
    
    // Get logs
    const logsResult = this.db.prepare(`
      SELECT * FROM api_logs 
      ORDER BY timestamp DESC 
      LIMIT ? OFFSET ?
    `).all(pageSize, offset) as any[];
    
    const logs = logsResult.map(log => ({
      id: log.id,
      userId: log.user_id,
      endpoint: log.endpoint,
      method: log.method,
      statusCode: log.status_code,
      responseTime: log.response_time,
      timestamp: new Date(log.timestamp)
    }));
    
    return { logs, total };
  }
  
  async getUserApiLogs(
    userId: number,
    page: number = 1,
    pageSize: number = 10
  ): Promise<{ logs: ApiLog[], total: number }> {
    // Get total count
    const totalResult = this.db.prepare('SELECT COUNT(*) as count FROM api_logs WHERE user_id = ?').get(userId) as { count: number };
    const total = totalResult.count;
    
    // Calculate pagination
    const offset = (page - 1) * pageSize;
    
    // Get logs
    const logsResult = this.db.prepare(`
      SELECT * FROM api_logs 
      WHERE user_id = ? 
      ORDER BY timestamp DESC 
      LIMIT ? OFFSET ?
    `).all(userId, pageSize, offset) as any[];
    
    const logs = logsResult.map(log => ({
      id: log.id,
      userId: log.user_id,
      endpoint: log.endpoint,
      method: log.method,
      statusCode: log.status_code,
      responseTime: log.response_time,
      timestamp: new Date(log.timestamp)
    }));
    
    return { logs, total };
  }
  
  // Auth methods
  async hasUserSubscription(userId: number): Promise<boolean> {
    const subscription = await this.getActiveSubscriptionByUserId(userId);
    return !!subscription;
  }
}

// In-memory storage implementation
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private subscriptions: Map<number, Subscription>;
  private transactions: Map<number, Transaction>;
  private apiLogs: Map<number, ApiLog>;
  
  private currentUserId: number;
  private currentSubscriptionId: number;
  private currentTransactionId: number;
  private currentLogId: number;

  constructor() {
    this.users = new Map();
    this.subscriptions = new Map();
    this.transactions = new Map();
    this.apiLogs = new Map();
    
    this.currentUserId = 1;
    this.currentSubscriptionId = 1;
    this.currentTransactionId = 1;
    this.currentLogId = 1;
    
    // Pre-seed admin and developer users
    this.seedUsers();
  }
  
  private seedUsers() {
    // Admin user
    this.users.set(1, {
      id: 1,
      username: "admin",
      email: "admin@finconnect.com",
      name: "Admin User",
      password: "$2b$10$JKbGkMa7ZoHFZZ.KARvbR.E6iRyiLxFFHJFXVV.F7fFX6p85TUHWS", // password: admin123
      role: "admin",
      createdAt: new Date()
    });
    this.currentUserId++;
    
    // Developer user
    this.users.set(2, {
      id: 2,
      username: "developer",
      email: "developer@finconnect.com",
      name: "Developer User",
      password: "$2b$10$3QWMxcMvkZC9LgyLLsIPdu2dST7SLuVhK5QCLBHCwE3VJrK7oDl1.", // password: developer123
      role: "developer",
      createdAt: new Date()
    });
    this.currentUserId++;
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = {
      id,
      username: insertUser.username,
      email: insertUser.email,
      name: insertUser.name,
      password: insertUser.password,
      role: insertUser.role || 'developer',
      createdAt: new Date()
    };
    this.users.set(id, user);
    return user;
  }
  
  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }
  
  // Subscription methods
  async createSubscription(insertSubscription: InsertSubscription): Promise<Subscription> {
    const id = this.currentSubscriptionId++;
    const subscription: Subscription = {
      id,
      userId: insertSubscription.userId,
      plan: insertSubscription.plan,
      active: insertSubscription.active !== undefined ? insertSubscription.active : true,
      startDate: insertSubscription.startDate || new Date(),
      endDate: insertSubscription.endDate || null,
      createdAt: new Date()
    };
    this.subscriptions.set(id, subscription);
    return subscription;
  }
  
  async getSubscriptionById(id: number): Promise<Subscription | undefined> {
    return this.subscriptions.get(id);
  }
  
  async getSubscriptionsByUserId(userId: number): Promise<Subscription[]> {
    return Array.from(this.subscriptions.values())
      .filter(sub => sub.userId === userId);
  }
  
  async getActiveSubscriptionByUserId(userId: number): Promise<Subscription | undefined> {
    return Array.from(this.subscriptions.values())
      .find(sub => sub.userId === userId && sub.active === true);
  }
  
  async cancelSubscription(id: number): Promise<Subscription> {
    const subscription = this.subscriptions.get(id);
    if (!subscription) {
      throw new Error('Subscription not found');
    }
    
    const updatedSubscription: Subscription = {
      ...subscription,
      active: false,
      endDate: new Date()
    };
    
    this.subscriptions.set(id, updatedSubscription);
    return updatedSubscription;
  }
  
  // Transaction methods
  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const id = this.currentTransactionId++;
    const transaction: Transaction = {
      id,
      userId: insertTransaction.userId,
      type: insertTransaction.type,
      amount: insertTransaction.amount,
      description: insertTransaction.description || null,
      status: insertTransaction.status,
      fromAccount: insertTransaction.fromAccount || null,
      toAccount: insertTransaction.toAccount || null,
      createdAt: new Date()
    };
    this.transactions.set(id, transaction);
    return transaction;
  }
  
  async getTransactionById(id: number): Promise<Transaction | undefined> {
    return this.transactions.get(id);
  }
  
  async getTransactionsByUserId(
    userId: number,
    page: number = 1,
    pageSize: number = 10
  ): Promise<{ transactions: Transaction[], total: number }> {
    const userTransactions = Array.from(this.transactions.values())
      .filter(tx => tx.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    const total = userTransactions.length;
    const startIdx = (page - 1) * pageSize;
    const endIdx = startIdx + pageSize;
    const paginatedTransactions = userTransactions.slice(startIdx, endIdx);
    
    return { transactions: paginatedTransactions, total };
  }
  
  // API Logs methods
  async createApiLog(insertLog: InsertApiLog): Promise<ApiLog> {
    const id = this.currentLogId++;
    const log: ApiLog = { ...insertLog, id, timestamp: new Date() };
    this.apiLogs.set(id, log);
    return log;
  }
  
  async getApiLogs(
    page: number = 1,
    pageSize: number = 10
  ): Promise<{ logs: ApiLog[], total: number }> {
    const allLogs = Array.from(this.apiLogs.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    
    const total = allLogs.length;
    const startIdx = (page - 1) * pageSize;
    const endIdx = startIdx + pageSize;
    const paginatedLogs = allLogs.slice(startIdx, endIdx);
    
    return { logs: paginatedLogs, total };
  }
  
  async getUserApiLogs(
    userId: number,
    page: number = 1,
    pageSize: number = 10
  ): Promise<{ logs: ApiLog[], total: number }> {
    const userLogs = Array.from(this.apiLogs.values())
      .filter(log => log.userId === userId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    
    const total = userLogs.length;
    const startIdx = (page - 1) * pageSize;
    const endIdx = startIdx + pageSize;
    const paginatedLogs = userLogs.slice(startIdx, endIdx);
    
    return { logs: paginatedLogs, total };
  }
  
  // Auth methods
  async hasUserSubscription(userId: number): Promise<boolean> {
    const subscription = await this.getActiveSubscriptionByUserId(userId);
    return !!subscription;
  }
}

// Use SQLite storage instead of in-memory
export const storage = new SQLiteStorage();
