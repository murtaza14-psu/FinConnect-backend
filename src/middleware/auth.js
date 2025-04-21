const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
    try {
        // Get token from header
        const authHeader = req.header('Authorization');
        if (!authHeader) {
            return res.status(401).json({
                success: false,
                error: {
                    message: 'No token provided',
                    statusCode: 401
                }
            });
        }

        // Check if token is in correct format
        const token = authHeader.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({
                success: false,
                error: {
                    message: 'Invalid token format',
                    statusCode: 401
                }
            });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Check if token has required data
        if (!decoded.id || !decoded.role) {
            return res.status(401).json({
                success: false,
                error: {
                    message: 'Invalid token data',
                    statusCode: 401
                }
            });
        }

        // Attach user data to request
        req.user = {
            id: decoded.id,
            role: decoded.role,
            email: decoded.email
        };

        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                error: {
                    message: 'Invalid token',
                    statusCode: 401
                }
            });
        }
        
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                error: {
                    message: 'Token expired',
                    statusCode: 401
                }
            });
        }

        // For any other errors
        console.error('Auth middleware error:', error);
        return res.status(401).json({
            success: false,
            error: {
                message: 'Authentication failed',
                statusCode: 401
            }
        });
    }
};

const checkRole = (roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                error: {
                    message: 'Access denied',
                    statusCode: 403
                }
            });
        }
        next();
    };
};

module.exports = { auth, checkRole }; 