import express from 'express';
import {
  getInventoryItems,
  getInventoryItemById,
  addInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  getItemCategories,
  getBatches,
  addBatch,
  updateBatch,
  getLowStockAlerts,
  getExpiryAlerts,
  getExpiredStock,
  getInventoryDashboard,
  getReagentTestMappings,
  addReagentTestMapping,
  updateReagentTestMapping,
  deleteReagentTestMapping,
  getTestReagents
} from '../controllers/inventoryController.js';

import {
  getVendors,
  getVendorById,
  addVendor,
  updateVendor,
  deleteVendor,
  getVendorPurchaseSummary
} from '../controllers/vendorController.js';

import {
  getPurchaseRequisitions,
  getPurchaseRequisitionById,
  createPurchaseRequisition,
  updatePurchaseRequisition,
  approvePurchaseRequisition,
  getPurchaseOrders,
  getPurchaseOrderById,
  createPurchaseOrder,
  updatePurchaseOrder,
  getGoodsReceipts,
  getGoodsReceiptById,
  createGoodsReceipt,
  approveGoodsReceipt,
  getPendingForGRN
} from '../controllers/purchaseController.js';

import {
  getStockLevels,
  getBatchStock,
  getStockTransactions,
  adjustStock,
  getStockTransfers,
  getStockTransferById,
  createStockTransfer,
  approveStockTransfer,
  receiveStockTransfer,
  consumeReagentsForTest,
  getConsumptionLogs,
  getQCInventory,
  openVial
} from '../controllers/stockController.js';

import {
  getStockLedger,
  getConsumptionReport,
  getExpiryReport,
  getPurchaseReport,
  getReagentUsageByTest,
  getLowStockReport
} from '../controllers/inventoryReportsController.js';

const router = express.Router();

// ============================================
// DASHBOARD
// ============================================
router.get('/dashboard', getInventoryDashboard);

// ============================================
// INVENTORY ITEMS
// ============================================
router.get('/items', getInventoryItems);
router.get('/items/categories', getItemCategories);
router.get('/items/:id', getInventoryItemById);
router.post('/items', addInventoryItem);
router.put('/items/:id', updateInventoryItem);
router.delete('/items/:id', deleteInventoryItem);

// ============================================
// BATCHES
// ============================================
router.get('/batches', getBatches);
router.post('/batches', addBatch);
router.put('/batches/:id', updateBatch);

// ============================================
// ALERTS
// ============================================
router.get('/alerts/low-stock', getLowStockAlerts);
router.get('/alerts/expiry', getExpiryAlerts);
router.get('/alerts/expired', getExpiredStock);

// ============================================
// VENDORS
// ============================================
router.get('/vendors', getVendors);
router.get('/vendors/purchase-summary', getVendorPurchaseSummary);
router.get('/vendors/:id', getVendorById);
router.post('/vendors', addVendor);
router.put('/vendors/:id', updateVendor);
router.delete('/vendors/:id', deleteVendor);

// ============================================
// PURCHASE REQUISITIONS
// ============================================
router.get('/purchase-requisitions', getPurchaseRequisitions);
router.get('/purchase-requisitions/:id', getPurchaseRequisitionById);
router.post('/purchase-requisitions', createPurchaseRequisition);
router.put('/purchase-requisitions/:id', updatePurchaseRequisition);
router.put('/purchase-requisitions/:id/approve', approvePurchaseRequisition);

// ============================================
// PURCHASE ORDERS
// ============================================
router.get('/purchase-orders', getPurchaseOrders);
router.get('/purchase-orders/:id', getPurchaseOrderById);
router.post('/purchase-orders', createPurchaseOrder);
router.put('/purchase-orders/:id', updatePurchaseOrder);

// ============================================
// GOODS RECEIPTS
// ============================================
router.get('/goods-receipts', getGoodsReceipts);
router.get('/goods-receipts/:id', getGoodsReceiptById);
router.post('/goods-receipts', createGoodsReceipt);
router.put('/goods-receipts/:id/approve', approveGoodsReceipt);
router.get('/pending-grn', getPendingForGRN);

// ============================================
// STOCK MANAGEMENT
// ============================================
router.get('/stock', getStockLevels);
router.get('/stock/batches', getBatchStock);
router.get('/stock/transactions', getStockTransactions);
router.post('/stock/adjust', adjustStock);

// ============================================
// STOCK TRANSFERS
// ============================================
router.get('/transfers', getStockTransfers);
router.get('/transfers/:id', getStockTransferById);
router.post('/transfers', createStockTransfer);
router.put('/transfers/:id/approve', approveStockTransfer);
router.put('/transfers/:id/receive', receiveStockTransfer);

// ============================================
// REAGENT CONSUMPTION
// ============================================
router.get('/reagent-mappings', getReagentTestMappings);
router.post('/reagent-mappings', addReagentTestMapping);
router.put('/reagent-mappings/:id', updateReagentTestMapping);
router.delete('/reagent-mappings/:id', deleteReagentTestMapping);
router.get('/tests/:test_id/reagents', getTestReagents);

// Auto-consumption endpoint
router.post('/consume-reagents', consumeReagentsForTest);
router.get('/consumption-logs', getConsumptionLogs);

// ============================================
// QC / CONTROL INVENTORY
// ============================================
router.get('/qc-inventory', getQCInventory);
router.put('/batches/:id/open-vial', openVial);

// ============================================
// REPORTS
// ============================================
router.get('/reports/stock-ledger', getStockLedger);
router.get('/reports/consumption', getConsumptionReport);
router.get('/reports/expiry', getExpiryReport);
router.get('/reports/purchase', getPurchaseReport);
router.get('/reports/reagent-usage', getReagentUsageByTest);
router.get('/reports/low-stock', getLowStockReport);

export default router;
