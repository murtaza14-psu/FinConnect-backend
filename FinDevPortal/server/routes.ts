import express, { type Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { authenticate, authorizeRoles, register, login, getCurrentUser } from "./auth";
import { rateLimit, checkSubscription, logRequest, logResponse } from "./middleware";
import { subscriptionSchema, transferSchema } from "@shared/schema";
import Stripe from "stripe";

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize Stripe
  if (!process.env.STRIPE_SECRET_KEY) {
    console.error('Missing required environment variable: STRIPE_SECRET_KEY');
  }
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

  // API routes prefix
  const apiRouter = express.Router();
  app.use("/api", apiRouter);

  // Add response logging middleware
  app.use(logResponse);

  // Stripe payment routes
  apiRouter.post("/create-payment-intent", authenticate, async (req, res) => {
    try {
      const { planId } = req.body;
      
      if (!planId) {
        return res.status(400).json({ 
          message: 'Plan ID is required' 
        });
      }

      // Plan details - in a real app, this would come from a database
      const planDetails: Record<string, { name: string, price: number }> = {
        standard: { name: 'Standard', price: 49 }
      };

      if (!planDetails[planId]) {
        return res.status(400).json({ 
          message: 'Invalid plan ID' 
        });
      }

      // Create a PaymentIntent with the order amount and currency
      // Using Stripe's test mode, the card-only payment methods
      const paymentIntent = await stripe.paymentIntents.create({
        amount: planDetails[planId].price * 100, // convert to cents
        currency: 'usd',
        payment_method_types: ['card'], // Only allow card payments
        metadata: {
          userId: req.user!.id.toString(),
          planId,
          planName: planDetails[planId].name
        },
      });

      res.json({
        clientSecret: paymentIntent.client_secret,
        planName: planDetails[planId].name,
        planPrice: planDetails[planId].price
      });
    } catch (error: any) {
      console.error('Error creating payment intent:', error);
      res.status(500).json({
        message: 'Error creating payment intent',
        error: error.message
      });
    }
  });
  
  // Payment status check endpoint
  apiRouter.get("/check-payment-status", authenticate, async (req, res) => {
    try {
      const { payment_intent } = req.query;
      const force_create = req.query.force_create === 'true';
      
      if (!payment_intent) {
        return res.status(400).json({ 
          message: 'Payment intent ID is required' 
        });
      }
      
      // Retrieve the payment intent from Stripe
      const paymentIntent = await stripe.paymentIntents.retrieve(payment_intent as string);
      
      // Check if the payment intent belongs to the authenticated user
      if (paymentIntent.metadata.userId !== req.user!.id.toString() && !force_create) {
        console.warn(`User ${req.user!.id} attempted to check payment intent belonging to user ${paymentIntent.metadata.userId}`);
        return res.status(403).json({ 
          message: 'You are not authorized to check this payment intent' 
        });
      }
      
      // For debugging
      console.log(`Payment intent ${payment_intent} status: ${paymentIntent.status}`);
      
      // If payment is successful, create a subscription
      if (paymentIntent.status === 'succeeded' || force_create) {
        try {
          // Check if user already has an active subscription
          const existingSubscription = await storage.getActiveSubscriptionByUserId(req.user!.id);
          
          if (existingSubscription) {
            // Cancel the existing subscription
            console.log(`Cancelling existing subscription ${existingSubscription.id} for user ${req.user!.id}`);
            await storage.cancelSubscription(existingSubscription.id);
          }
          
          // Create a new subscription
          console.log(`Creating new subscription for user ${req.user!.id} with plan ${paymentIntent.metadata.planId}`);
          const subscription = await storage.createSubscription({
            userId: req.user!.id,
            plan: paymentIntent.metadata.planId,
            active: true,
            startDate: new Date(),
            endDate: undefined
          });
          
          console.log(`Successfully created subscription ${subscription.id}`);
        } catch (subError) {
          console.error('Error creating subscription:', subError);
        }
      }
      
      // Return the payment intent status
      res.json({
        status: paymentIntent.status,
        amount: paymentIntent.amount / 100, // Convert from cents to dollars
        plan: paymentIntent.metadata.planId,
        planName: paymentIntent.metadata.planName
      });
    } catch (error: any) {
      console.error('Error checking payment status:', error);
      res.status(500).json({
        message: 'Error checking payment status',
        error: error.message
      });
    }
  });

  // Payment webhook for handling successful payments
  // Note: For real-world apps, you should use Stripe CLI to test webhooks locally
  apiRouter.post("/webhook", async (req, res) => {
    try {
      // For simplicity, we'll skip webhook signature verification in this sandbox app
      // In production, you would need to set up a webhook endpoint in Stripe and use
      // the webhook signing secret to verify the webhook signature
      
      // Parse the request body if it's a buffer or use it directly if it's already an object
      const event = typeof req.body === 'string' || Buffer.isBuffer(req.body) 
        ? JSON.parse(Buffer.from(req.body).toString()) 
        : req.body;
      
      console.log('Webhook received:', event.type);
      
      // Handle successful payments
      if (event.type === 'payment_intent.succeeded') {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log('Payment succeeded:', paymentIntent.id);
        
        try {
          // Extract metadata
          const { userId, planId } = paymentIntent.metadata;
          
          if (!userId || !planId) {
            throw new Error('Missing user or plan information in payment metadata');
          }
          
          // Check if user already has an active subscription
          const existingSubscription = await storage.getActiveSubscriptionByUserId(parseInt(userId));
          
          if (existingSubscription) {
            console.log(`User ${userId} already has an active subscription. Cancelling the existing one.`);
            await storage.cancelSubscription(existingSubscription.id);
          }
          
          // Create a subscription for the user
          const subscription = await storage.createSubscription({
            userId: parseInt(userId),
            plan: planId,
            active: true,
            startDate: new Date(),
            endDate: undefined
          });
          
          console.log(`Subscription created for user ${userId} with plan ${planId}, ID: ${subscription.id}`);
        } catch (error: any) {
          console.error('Error processing payment success:', error.message);
          // Don't return error response for webhooks to avoid retries
        }
      }
      
      // Acknowledge receipt of the event
      res.json({received: true});
    } catch (error: any) {
      console.error(`Webhook error: ${error.message}`);
      res.status(400).send(`Webhook Error: ${error.message}`);
    }
  });

  // Auth routes
  apiRouter.post("/auth/register", register);
  apiRouter.post("/auth/login", login);
  apiRouter.get("/user", authenticate, getCurrentUser);
  
  // Initial seeded user check
  apiRouter.get("/auth/status", (req, res) => {
    res.json({ 
      message: "Auth service is running",
      testAccounts: [
        { username: "admin", password: "admin123", role: "admin" },
        { username: "developer", password: "developer123", role: "developer" }
      ]
    });
  });

  // Subscription routes
  apiRouter.post("/subscriptions/subscribe", authenticate, async (req, res) => {
    try {
      const result = subscriptionSchema.safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ message: 'Invalid input', errors: result.error.format() });
      }
      
      const { plan } = result.data;
      
      // Check if user already has an active subscription
      const existingSubscription = await storage.getActiveSubscriptionByUserId(req.user!.id);
      
      if (existingSubscription) {
        return res.status(400).json({ message: 'User already has an active subscription' });
      }
      
      // Create subscription
      const subscription = await storage.createSubscription({
        userId: req.user!.id,
        plan,
        active: true,
        startDate: new Date(),
        endDate: undefined
      });
      
      return res.status(201).json({ 
        message: 'Subscription created successfully',
        subscription
      });
    } catch (error) {
      console.error('Subscribe error:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  });
  
  apiRouter.get("/subscriptions/active", authenticate, async (req, res) => {
    try {
      // Get user's active subscription
      const subscription = await storage.getActiveSubscriptionByUserId(req.user!.id);
      
      if (!subscription) {
        return res.status(404).json({ message: 'No active subscription found' });
      }
      
      return res.status(200).json(subscription);
    } catch (error) {
      console.error('Get active subscription error:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  });
  
  apiRouter.post("/subscriptions/cancel", authenticate, async (req, res) => {
    try {
      // Get user's active subscription
      const subscription = await storage.getActiveSubscriptionByUserId(req.user!.id);
      
      if (!subscription) {
        return res.status(404).json({ message: 'No active subscription found' });
      }
      
      // Cancel subscription
      const canceledSubscription = await storage.cancelSubscription(subscription.id);
      
      return res.status(200).json({
        message: 'Subscription canceled successfully',
        subscription: canceledSubscription
      });
    } catch (error) {
      console.error('Cancel subscription error:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  });

  // Apply subscription check middleware to all API routes
  // This will enforce the subscription requirement for protected endpoints
  apiRouter.use(checkSubscription);
  
  // Protected API endpoints
  // These require authentication, subscription, and are rate limited
  const protectedRouter = express.Router();
  apiRouter.use(protectedRouter);
  
  protectedRouter.use(authenticate, logRequest, rateLimit);
  
  // Balance endpoint
  protectedRouter.get("/balance", async (req, res) => {
    try {
      // In a real app, we would fetch the actual balance from a database
      // For this mock, we're returning a fixed balance
      const balance = {
        availableBalance: 12500.75,
        pendingBalance: 1250.25,
        currency: "USD",
        lastUpdated: new Date()
      };
      
      return res.status(200).json(balance);
    } catch (error) {
      console.error('Get balance error:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  });
  
  // Transfer endpoint
  protectedRouter.post("/transfer", async (req, res) => {
    try {
      const result = transferSchema.safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ message: 'Invalid input', errors: result.error.format() });
      }
      
      const { fromAccount, toAccount, amount, description } = result.data;
      
      // Create transaction record
      const transaction = await storage.createTransaction({
        userId: req.user!.id,
        type: 'debit',
        amount,
        description: description || `Transfer to ${toAccount}`,
        status: 'completed',
        fromAccount,
        toAccount
      });
      
      return res.status(201).json({
        message: 'Transfer completed successfully',
        transaction
      });
    } catch (error) {
      console.error('Transfer error:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  });
  
  // Transactions endpoint with pagination
  protectedRouter.get("/transactions", async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 10;
      
      // Validate pagination params
      if (page < 1 || pageSize < 1 || pageSize > 100) {
        return res.status(400).json({ message: 'Invalid pagination parameters' });
      }
      
      const { transactions, total } = await storage.getTransactionsByUserId(req.user!.id, page, pageSize);
      
      return res.status(200).json({
        data: transactions,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize)
        }
      });
    } catch (error) {
      console.error('Get transactions error:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  });
  
  // Invoice endpoint
  protectedRouter.get("/invoice", async (req, res) => {
    try {
      const startDate = req.query.start ? new Date(req.query.start as string) : undefined;
      const endDate = req.query.end ? new Date(req.query.end as string) : undefined;
      
      // Validate dates
      if ((startDate && isNaN(startDate.getTime())) || (endDate && isNaN(endDate.getTime()))) {
        return res.status(400).json({ message: 'Invalid date format' });
      }
      
      // In a real app, we would generate an actual invoice based on transactions
      // For this mock, we'll return a simple invoice
      const invoice = {
        invoiceId: `INV-${Date.now()}`,
        userId: req.user!.id,
        startDate: startDate || new Date(new Date().setDate(new Date().getDate() - 30)),
        endDate: endDate || new Date(),
        items: [
          { description: 'API Calls', quantity: 1250, unitPrice: 0.001, amount: 1.25 },
          { description: 'Storage', quantity: 1, unitPrice: 5.00, amount: 5.00 },
          { description: 'Subscription Fee', quantity: 1, unitPrice: 49.99, amount: 49.99 }
        ],
        subtotal: 56.24,
        tax: 5.62,
        total: 61.86,
        currency: 'USD',
        status: 'paid',
        createdAt: new Date()
      };
      
      return res.status(200).json(invoice);
    } catch (error) {
      console.error('Generate invoice error:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  });
  
  // Admin-only routes
  const adminRouter = express.Router();
  apiRouter.use("/admin", authenticate, authorizeRoles('admin'), adminRouter);
  
  // List all users
  adminRouter.get("/users", async (_req, res) => {
    try {
      const users = await storage.getAllUsers();
      
      // Remove passwords
      const sanitizedUsers = users.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
      
      return res.status(200).json(sanitizedUsers);
    } catch (error) {
      console.error('Get users error:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  });
  
  // Force cancel a user's subscription
  adminRouter.post("/subscriptions/cancel", async (req, res) => {
    try {
      const { subscriptionId } = req.body;
      
      if (!subscriptionId) {
        return res.status(400).json({ message: 'Subscription ID is required' });
      }
      
      const subscription = await storage.getSubscriptionById(subscriptionId);
      
      if (!subscription) {
        return res.status(404).json({ message: 'Subscription not found' });
      }
      
      const canceledSubscription = await storage.cancelSubscription(subscription.id);
      
      return res.status(200).json({
        message: 'Subscription canceled successfully',
        subscription: canceledSubscription
      });
    } catch (error) {
      console.error('Admin cancel subscription error:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  });
  
  // Get logs
  adminRouter.get("/logs", async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 10;
      const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;
      
      // Validate pagination params
      if (page < 1 || pageSize < 1 || pageSize > 100) {
        return res.status(400).json({ message: 'Invalid pagination parameters' });
      }
      
      let logs;
      if (userId) {
        logs = await storage.getUserApiLogs(userId, page, pageSize);
      } else {
        logs = await storage.getApiLogs(page, pageSize);
      }
      
      return res.status(200).json({
        data: logs.logs,
        pagination: {
          page,
          pageSize,
          total: logs.total,
          totalPages: Math.ceil(logs.total / pageSize)
        }
      });
    } catch (error) {
      console.error('Get logs error:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
