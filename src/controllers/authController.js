const jwt = require('jsonwebtoken');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Validate input
        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                error: {
                    message: 'Please provide name, email, and password',
                    statusCode: 400
                }
            });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                error: {
                    message: 'Please provide a valid email address',
                    statusCode: 400
                }
            });
        }

        // Check if user already exists
        const existingUser = await User.findByEmail(email);
        if (existingUser) {
            return res.status(400).json({
                success: false,
                error: {
                    message: 'User already exists',
                    statusCode: 400
                }
            });
        }

        // Create new user with default role and subscription status
        const userId = await User.create({ 
            name, 
            email, 
            password,
            role: 'Developer',
            subscribed: false
        });
        
        // Generate JWT token
        const token = jwt.sign(
            { id: userId, email, role: 'Developer' },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );

        res.status(201).json({
            success: true,
            data: {
                token,
                user: {
                    id: userId,
                    name,
                    email,
                    role: 'Developer',
                    subscribed: false
                }
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Registration failed',
                statusCode: 500
            }
        });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user
        const user = await User.findByEmail(email);
        if (!user) {
            return res.status(401).json({
                success: false,
                error: {
                    message: 'Invalid credentials',
                    statusCode: 401
                }
            });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                error: {
                    message: 'Invalid credentials',
                    statusCode: 401
                }
            });
        }

        // Generate JWT token
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );

        res.json({
            success: true,
            data: {
                token,
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    subscribed: user.subscribed
                }
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Login failed',
                statusCode: 500
            }
        });
    }
};

module.exports = { register, login }; 