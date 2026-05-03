import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import patientRoutes from './routes/patientRoutes.js';
import appointmentRoutes from './routes/appointmentRoutes.js';
import billingRoutes from './routes/billingRoutes.js';
import staffRoutes from './routes/staffRoutes.js';
import infraRoutes from './routes/infraRoutes.js';
import dutyRoutes from './routes/dutyRoutes.js';
import billingPackageRoutes from './routes/billingPackageRoutes.js';
import departmentRoutes from './routes/departmentRoutes.js';
import labRoutes from './routes/labRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import inventoryRoutes from './routes/inventoryRoutes.js';
import inventoryVendorRoutes from './routes/inventoryVendorRoutes.js';
import inventoryItemRoutes from './routes/inventoryItemRoutes.js';
import inventoryBatchRoutes from './routes/inventoryBatchRoutes.js';
import inventoryTransactionRoutes from './routes/inventoryTransactionRoutes.js';
import inventoryMappingRoutes from './routes/inventoryMappingRoutes.js';
import inventoryAnalyticsRoutes from './routes/inventoryAnalyticsRoutes.js';
import inventorySuggestionRoutes from './routes/inventorySuggestionRoutes.js';
import inventoryTransferRoutes from './routes/inventoryTransferRoutes.js';
import inventoryAccountsPayableRoutes from './routes/inventoryAccountsPayableRoutes.js';
import inventoryProcurementRoutes from './routes/inventoryProcurementRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';
import branchRoutes from './routes/branchRoutes.js';
import inventoryNetworkRoutes from './routes/inventoryNetworkRoutes.js';
import hl7Routes from './routes/hl7Routes.js';
import db from './config/db.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware - CORS configured to allow all origins for IP access
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/infra', infraRoutes);
app.use('/api/duty', dutyRoutes);
app.use('/api/billing-packages', billingPackageRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/lab', labRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/v2/inventory/vendors', inventoryVendorRoutes);
app.use('/api/v2/inventory/items', inventoryItemRoutes);
app.use('/api/v2/inventory/batches', inventoryBatchRoutes);
app.use('/api/v2/inventory/transactions', inventoryTransactionRoutes);
app.use('/api/v2/inventory/mappings', inventoryMappingRoutes);
app.use('/api/v2/inventory/analytics', inventoryAnalyticsRoutes);
app.use('/api/v2/inventory/suggestions', inventorySuggestionRoutes);
app.use('/api/v2/inventory/transfers', inventoryTransferRoutes);
app.use('/api/v2/inventory/ap', inventoryAccountsPayableRoutes);
app.use('/api/v2/inventory/procurement', inventoryProcurementRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/branches', branchRoutes);
app.use('/api/inventory-network', inventoryNetworkRoutes);
app.use('/api/hl7', hl7Routes);

// Health check route
app.get('/', (req, res) => {
  res.send('HIMS Backend is running!');
});

// Start server - bind to 0.0.0.0 to accept external connections
app.listen(PORT, '0.0.0.0', async () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
  console.log(`Accessible via your IP address on port ${PORT}`);
  
  // Test DB connection on startup
  try {
    const connection = await db.getConnection();
    console.log('Database connected successfully!');
    connection.release();
  } catch (err) {
    console.error('Database connection failed:', err.message);
  }
});
