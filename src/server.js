require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
    windowMs: process.env.RATE_LIMIT_WINDOW_MS,
    max: process.env.RATE_LIMIT_MAX
});
app.use(limiter);

// Routes will be added here
// app.use('/api/auth', require('./routes/auth'));
// app.use('/api/balance', require('./routes/balance'));
// app.use('/api/transfer', require('./routes/transfer'));
// app.use('/api/transactions', require('./routes/transactions'));
// app.use('/api/invoice', require('./routes/invoice'));
// app.use('/api/admin', require('./routes/admin'));

// Error handling
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 