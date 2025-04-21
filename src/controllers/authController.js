const jwt = require('jsonwebtoken');
const User = require('../models/User');
const bcrypt = require('bcrypt');

const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

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

        // Create new user
        const userId = await User.create({ name, email, password });
        
        // Generate JWT token
        const token = jwt.sign(
            { id: userId, email, role: 'developer' },
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
                    email
                }
            }
        });
    } catch (error) {
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
                    subscription_status: user.subscription_status
                }
            }
        });
    } catch (error) {
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