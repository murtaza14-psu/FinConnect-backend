import { Request, Response, NextFunction } from 'express';
import { storage } from './storage';

// Rate limit middleware
// Limit to 10 requests per minute per user
const requestCounts = new Map<number, { count: number, resetTime: number }>();

export const rateLimit = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  const userId = req.user.id;
  const now = Date.now();
  const oneMinute = 60 * 1000;
  
  if (!requestCounts.has(userId)) {
    requestCounts.set(userId, { count: 1, resetTime: now + oneMinute });
    return next();
  }
  
  const userRateLimit = requestCounts.get(userId)!;
  
  // Reset count if the minute has passed
  if (now > userRateLimit.resetTime) {
    userRateLimit.count = 1;
    userRateLimit.resetTime = now + oneMinute;
    return next();
  }
  
  // Check if rate limit exceeded
  if (userRateLimit.count >= 10) {
    return res.status(429).json({ 
      message: 'Rate limit exceeded. Try again in a minute.',
      resetInSeconds: Math.ceil((userRateLimit.resetTime - now) / 1000)
    });
  }
  
  // Increment count
  userRateLimit.count++;
  return next();
};

// Check subscription middleware
export const checkSubscription = async (req: Request, res: Response, next: NextFunction) => {
  // List of paths that don't require a subscription
  const openPaths = [
    '/api/auth',
    '/api/pricing',
    '/api/create-payment-intent',
    '/api/check-payment-status',
    '/api/webhook',
    '/api/subscriptions/subscribe',
    '/api/subscriptions/active',
    '/api/user',
    '/pricing',
    '/auth',
    '/checkout',
    '/subscription-success'
  ];
  
  // Skip subscription check for open routes
  const path = req.path;
  if (openPaths.some(openPath => path.startsWith(openPath) || path === openPath)) {
    return next();
  }
  
  // Enforce authentication
  if (!req.user) {
    if (req.path.startsWith('/api/')) {
      // For API requests, return 401 status
      return res.status(401).json({ message: 'Authentication required' });
    } else {
      // For browser requests, redirect to auth page
      return res.redirect('/auth');
    }
  }
  
  const userId = req.user.id;
  
  // Skip check for admin users
  if (req.user.role === 'admin') {
    return next();
  }
  
  // Explicitly check if the path is a protected dashboard route or API endpoint
  const isDashboardRoute = path.startsWith('/dashboard') || 
                          ['/balance', '/transfer', '/transactions', '/invoice', '/subscription'].includes(path);
  const isProtectedApiEndpoint = path.startsWith('/api/') && !openPaths.some(p => path.startsWith(p));
  
  if (isDashboardRoute || isProtectedApiEndpoint) {
    // Check for bypass parameter (only for non-API routes and only right after payment)
    const bypassParam = !req.path.startsWith('/api/') && req.query.bypass === 'true';
    
    // If there's a bypass parameter, try to create a subscription if needed
    if (bypassParam) {
      console.log('Bypassing subscription check due to bypass parameter');
      // Clean up URL by removing bypass parameter
      if (req.url.includes('?bypass=true')) {
        req.url = req.url.replace('?bypass=true', '');
      } else if (req.url.includes('&bypass=true')) {
        req.url = req.url.replace('&bypass=true', '');
      }
      return next();
    }
    
    // Regular subscription check
    const activeSubscription = await storage.getActiveSubscriptionByUserId(userId);
    
    if (!activeSubscription) {
      if (req.path.startsWith('/api/')) {
        // For API requests, return 403 status
        return res.status(403).json({ 
          message: 'Subscription required to access this resource',
          subscriptionRequired: true,
          redirectTo: '/pricing'
        });
      } else {
        // For browser requests, redirect to pricing page
        return res.redirect('/pricing');
      }
    }
  }
  
  return next();
};

// Request logging middleware
export const logRequest = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return next();
  }
  
  // Store start time
  req.startTime = Date.now();
  
  // Continue with request
  // We'll log after the response in a response middleware
  next();
};

// Response logging middleware - logs after response
export const logResponse = async (req: Request, res: Response, next: NextFunction) => {
  const originalEnd = res.end;
  
  res.end = function(chunk?: any, encoding?: any, callback?: any): any {
    if (req.user && req.startTime) {
      const responseTime = Date.now() - req.startTime;
      const userId = req.user.id;
      const endpoint = req.originalUrl;
      const method = req.method;
      const statusCode = res.statusCode;
      
      // Log the API request asynchronously without blocking the response
      storage.createApiLog({
        userId,
        endpoint,
        method,
        statusCode,
        responseTime
      }).catch(error => {
        console.error('Failed to log API request', error);
      });
    }
    
    // Call the original end method
    return originalEnd.call(this, chunk, encoding, callback);
  };
  
  next();
};
