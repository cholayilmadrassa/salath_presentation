import express from 'express';
import mongoose from 'mongoose';
import morgan from 'morgan';
import cors from 'cors';
import { PORT, MONGODB_URI, CLIENT_ORIGIN, PLATFORM_ROOT_DOMAIN } from './config.js';

import Tenant from './models/Tenant.js';
import { resolveTenant } from './middleware/resolveTenant.js';

import authRoutes from './routes/auth.js';
import superAdminRoutes from './routes/superAdmin.js';
import tenantAdminRoutes from './routes/tenantAdmin.js';
import memberRoutes from './routes/member.js';
import countsRoutes from './routes/counts.js';
import legacyAdminRoutes from './routes/admin.js';
import pushRoutes from './routes/pushRoutes.js';
import notificationAdminRoutes from './routes/notificationAdminRoutes.js';
import { seedSuperAdmin } from './utils/seedSuperAdmin.js';
import { initNotificationScheduler } from './services/notificationScheduler.js';

// Process Error Handlers
process.on('uncaughtException', (err) => console.error('[UNCAUGHT EXCEPTION]:', err));
process.on('unhandledRejection', (reason) => console.error('[UNHANDLED REJECTION]:', reason));

// Express App Initialization
const app = express();

// Dynamic CORS configuration supporting subdomains & custom domains
const corsOptions = {
  origin: async (origin, callback) => {
    if (!origin) return callback(null, true);

    try {
      const url = new URL(origin);
      const host = url.hostname.toLowerCase();
      const rootDomain = PLATFORM_ROOT_DOMAIN ? PLATFORM_ROOT_DOMAIN.toLowerCase() : 'swalath.online';

      if (
        origin === CLIENT_ORIGIN ||
        host === 'localhost' ||
        host === '127.0.0.1' ||
        host === rootDomain ||
        host.endsWith(`.${rootDomain}`) ||
        host.endsWith('.localhost')
      ) {
        return callback(null, true);
      }

      const cleanHost = host.replace(/^www\./, '');
      const matchedTenant = await Tenant.findOne({
        $or: [
          { customDomain: host, customDomainVerified: true },
          { customDomain: cleanHost, customDomainVerified: true }
        ]
      });
      if (matchedTenant) {
        return callback(null, true);
      }

      return callback(null, true);
    } catch (e) {
      return callback(null, true);
    }
  },
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'x-tenant-id', 'x-tenant-slug', 'x-tenant-host', 'x-forwarded-host', 'Accept', 'Origin'],
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));
app.use(morgan('dev'));

// Tenant Resolution Middleware
app.use(resolveTenant);

// Health Check Route
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    name: 'Multi-Tenant Event Platform API',
    rootDomain: PLATFORM_ROOT_DOMAIN,
    tenantResolved: req.tenant
      ? {
        id: req.tenant._id,
        name: req.tenant.name,
        slug: req.tenant.slug,
        status: req.tenant.status,
        branding: req.tenant.branding,
      }
      : null,
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/super-admin', superAdminRoutes);
app.use('/api/admin/notifications', notificationAdminRoutes);
app.use('/api/admin', tenantAdminRoutes);
app.use('/api/events', memberRoutes);
app.use('/api/counts', countsRoutes);
app.use('/api/push', pushRoutes);
app.use('/api/notifications', pushRoutes);
app.use('/api/legacy-admin', legacyAdminRoutes);

// Global 404 Handler
app.use((_req, res) => res.status(404).json({ error: 'Route not found' }));

// Global Error Handler
app.use((err, _req, res, _next) => {
  console.error('[SERVER ERROR]:', err);
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});

// Database Connection
async function connectDatabase() {
  console.log(`Connecting to MongoDB at: ${MONGODB_URI}...`);
  await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
  console.log('MongoDB connected successfully');
}

// Server Listener with automatic Port fallback
function startListener(initialPort) {
  const server = app.listen(initialPort, () => {
    console.log(`🚀 Multi-Tenant API Server active on http://localhost:${initialPort}`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`[PORT NOTICE]: Port ${initialPort} is in use. Trying port ${Number(initialPort) + 1}...`);
      startListener(Number(initialPort) + 1);
    } else {
      console.error('[SERVER LISTEN ERROR]:', err);
      process.exit(1);
    }
  });

  // Graceful Shutdown
  const shutdown = async () => {
    console.log('\nGracefully shutting down server...');
    server.close(() => console.log('HTTP Server closed.'));
    await mongoose.disconnect();
    console.log('MongoDB disconnected.');
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

// Application Startup Routine
async function bootstrap() {
  try {
    await connectDatabase();
    await seedSuperAdmin();
    initNotificationScheduler();
    startListener(PORT);
  } catch (err) {
    console.error('[STARTUP ERROR]: Could not connect to MongoDB.', err.message);
    process.exit(1);
  }
}

bootstrap();