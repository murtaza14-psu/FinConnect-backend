const User = require('../models/User');

const subscribe = async (req, res) => {
    try {
        const userId = req.user.id;

        // Update user's subscription status
        const updated = await User.updateSubscriptionStatus(userId, true);
        
        if (!updated) {
            return res.status(404).json({
                success: false,
                error: {
                    message: 'User not found',
                    statusCode: 404
                }
            });
        }

        res.json({
            success: true,
            data: {
                message: 'Subscription activated successfully',
                subscribed: true
            }
        });
    } catch (error) {
        console.error('Subscription error:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to activate subscription',
                statusCode: 500
            }
        });
    }
};

const cancel = async (req, res) => {
    try {
        const userId = req.user.id;

        // Update user's subscription status
        const updated = await User.updateSubscriptionStatus(userId, false);
        
        if (!updated) {
            return res.status(404).json({
                success: false,
                error: {
                    message: 'User not found',
                    statusCode: 404
                }
            });
        }

        res.json({
            success: true,
            data: {
                message: 'Subscription cancelled successfully',
                subscribed: false
            }
        });
    } catch (error) {
        console.error('Subscription cancellation error:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Failed to cancel subscription',
                statusCode: 500
            }
        });
    }
};

module.exports = { subscribe, cancel }; 