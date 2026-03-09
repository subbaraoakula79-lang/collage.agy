import 'dotenv/config';
import path from 'path';
// Ensure env is loaded before any other imports
import dotenv from 'dotenv';
dotenv.config({ path: path.join(__dirname, '../.env') });

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import authRoutes from './routes/auth.routes';
import studentRoutes from './routes/student.routes';
import facultyRoutes from './routes/faculty.routes';
import adminRoutes from './routes/admin.routes';
import digilockerRoutes from './routes/digilocker.routes';
import paymentRoutes from './routes/payment.routes';
import chatbotRoutes from './routes/chatbot.routes';
import notificationRoutes from './routes/notification.routes';
import { errorHandler } from './middleware/errorHandler';

const app = express();
const PREFERRED_PORT = parseInt(process.env.PORT || '5001', 10);

// Security middleware
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    message: { error: 'Too many requests, please try again later.' }
});
app.use('/api/', limiter);

// Static files for certificates/receipts
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/faculty', facultyRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/digilocker', digilockerRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/notifications', notificationRoutes);

// Health check
app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', mode: process.env.ENV_MODE, timestamp: new Date().toISOString() });
});

// Error handler
app.use(errorHandler);

// Start server with automatic port fallback
function startServer(port: number, maxRetries = 5): void {
    const server = app.listen(port, () => {
        console.log(`🚀 Server running on http://localhost:${port}`);
        console.log(`📦 Mode: ${process.env.ENV_MODE || 'MOCK_AP'}`);
    });

    server.on('error', (err: NodeJS.ErrnoException) => {
        if (err.code === 'EADDRINUSE' && maxRetries > 0) {
            console.warn(`⚠️  Port ${port} is in use, trying ${port + 1}...`);
            server.close();
            startServer(port + 1, maxRetries - 1);
        } else {
            console.error(`❌ Failed to start server:`, err.message);
            process.exit(1);
        }
    });
}

startServer(PREFERRED_PORT);

export default app;
