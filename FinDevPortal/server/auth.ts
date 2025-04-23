import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import { storage } from './storage';
import { User, loginSchema } from '@shared/schema';

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'finconnect_secret_key';
const JWT_EXPIRES_IN = '24h';

// Generate JWT token
export const generateToken = (user: Omit<User, 'password'>) => {
  return jwt.sign(
    { 
      id: user.id, 
      username: user.username,
      email: user.email,
      role: user.role 
    }, 
    JWT_SECRET, 
    { expiresIn: JWT_EXPIRES_IN }
  );
};

// Validate and hash password
export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

// Compare password
export const comparePassword = async (
  plainPassword: string,
  hashedPassword: string
): Promise<boolean> => {
  return await bcrypt.compare(plainPassword, hashedPassword);
};

// Authenticate middleware
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'Authentication token missing' });
    }
    
    const decoded = jwt.verify(token, JWT_SECRET) as { id: number; username: string; email: string; role: string };
    
    const user = await storage.getUser(decoded.id);
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid authentication token' });
    }
    
    // Add user to request object
    req.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role
    };
    
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid authentication token' });
  }
};

// Role-based access control middleware
export const authorizeRoles = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
    }
    
    next();
  };
};

// Register a new user
export const register = async (req: Request, res: Response) => {
  try {
    const { username, email, name, password } = req.body;
    
    // Check if user with this email already exists
    const existingUserByEmail = await storage.getUserByEmail(email);
    if (existingUserByEmail) {
      return res.status(400).json({ message: 'Email already in use' });
    }
    
    // Check if username already exists
    const existingUserByUsername = await storage.getUserByUsername(username);
    if (existingUserByUsername) {
      return res.status(400).json({ message: 'Username already exists' });
    }
    
    // Hash password
    const hashedPassword = await hashPassword(password);
    
    // Create user
    const user = await storage.createUser({
      username,
      email,
      name,
      password: hashedPassword,
      role: 'developer' // Default role
    });
    
    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;
    
    // Generate token
    const token = generateToken(userWithoutPassword);
    
    return res.status(201).json({
      message: 'User registered successfully',
      user: userWithoutPassword,
      token
    });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Login user
export const login = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ 
        message: 'Username/email and password are required' 
      });
    }
    
    // Try to find user by username first, and if that fails, try by email
    let user = await storage.getUserByUsername(username);
    
    // If not found by username, try email
    if (!user) {
      try {
        user = await storage.getUserByEmail(username);
      } catch (error) {
        console.error('Error finding user by email:', error);
        // If there's a database error (like email column not existing),
        // just continue with null user which will return invalid credentials
      }
    }
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Check password
    const isMatch = await comparePassword(password, user.password);
    
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;
    
    // Generate token
    const token = generateToken(userWithoutPassword);
    
    return res.status(200).json({
      message: 'Login successful',
      user: userWithoutPassword,
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Get current user
export const getCurrentUser = async (req: Request, res: Response) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const user = await storage.getUser(req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;
    
    return res.status(200).json(userWithoutPassword);
  } catch (error) {
    console.error('Get current user error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Add type extension for Request
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        username: string;
        email: string;
        role: string;
      };
      startTime?: number;
    }
  }
}
