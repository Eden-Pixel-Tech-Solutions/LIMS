import db from '../config/db.js';

// -----------------------------------------
// INVOICES
// -----------------------------------------

export const getInvoices = async (req, res) => {
  try {
    const { status, vendor_id } = req.query;
    let sql = `
      SELECT i.*, v.vendor_name 
      FROM inventory_supplier_invoices i
      JOIN vendors v ON i.vendor_id = v.id
      WHERE 1=1
    `;
    const params = [];
    if (status) { sql += ` AND i.status = ?`; params.push(status); }
    if (vendor_id) { sql += ` AND i.vendor_id = ?`; params.push(vendor_id); }
    
    sql += ` ORDER BY i.created_at DESC`;

    const [invoices] = await db.query(sql, params);
    res.json({ success: true, data: invoices });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createInvoice = async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const { invoice_number, vendor_id, po_id, grn_id, invoice_date, due_date, total_amount } = req.body;

    if (!vendor_id) throw new Error('Supplier is required');
    if (!invoice_number) throw new Error('Invoice number is required');

    // 1. Insert Invoice
    const [invRes] = await connection.query(
      `INSERT INTO inventory_supplier_invoices 
       (invoice_number, vendor_id, po_id, grn_id, invoice_date, due_date, total_amount, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'PENDING')`,
      [invoice_number, vendor_id, po_id || null, grn_id || null, invoice_date, due_date, total_amount]
    );
    const invoiceId = invRes.insertId;

    // 2. Add Ledger Entry (DEBIT)
    // Get latest balance for supplier
    const [lastLedger] = await connection.query(
      `SELECT balance FROM inventory_supplier_ledger WHERE vendor_id = ? ORDER BY id DESC LIMIT 1`, 
      [vendor_id]
    );
    const prevBalance = lastLedger.length > 0 ? parseFloat(lastLedger[0].balance) : 0;
    const newBalance = prevBalance + parseFloat(total_amount); // Debit increases what we owe

    await connection.query(
      `INSERT INTO inventory_supplier_ledger 
       (vendor_id, type, reference_id, debit, credit, balance)
       VALUES (?, 'INVOICE', ?, ?, 0, ?)`,
      [vendor_id, invoiceId, total_amount, newBalance]
    );

    await connection.commit();
    res.status(201).json({ success: true, message: 'Invoice created successfully', data: { id: invoiceId } });
  } catch (error) {
    await connection.rollback();
    console.error('Error creating invoice:', error);
    res.status(500).json({ success: false, message: error.message });
  } finally {
    connection.release();
  }
};

// -----------------------------------------
// PAYMENTS
// -----------------------------------------

export const createPayment = async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const { vendor_id, invoice_id, amount, payment_method, reference_no, paid_by } = req.body;
    const paymentAmt = parseFloat(amount);

    if (!vendor_id) throw new Error('Supplier is required for payment');
    if (!invoice_id) throw new Error('Invoice is required for payment');
    if (isNaN(paymentAmt) || paymentAmt <= 0) throw new Error('Valid payment amount is required');

    // 1. Check Invoice
    const [invRes] = await connection.query(`SELECT * FROM inventory_supplier_invoices WHERE id = ? FOR UPDATE`, [invoice_id]);
    if (invRes.length === 0) throw new Error('Invoice not found');
    const invoice = invRes[0];

    const pendingAmount = parseFloat(invoice.total_amount) - parseFloat(invoice.paid_amount);
    if (paymentAmt > pendingAmount) {
      throw new Error(`Cannot pay more than pending amount. Pending: ${pendingAmount}`);
    }

    // 2. Generate Payment Number
    const dateStr = new Date().toISOString().slice(0,10).replace(/-/g, '');
    const [countRes] = await connection.query(`SELECT COUNT(*) as cnt FROM inventory_payments WHERE DATE(created_at) = CURDATE()`);
    const count = (countRes[0].cnt + 1).toString().padStart(3, '0');
    const paymentNumber = `PAY-${dateStr}-${count}`;

    // 3. Insert Payment
    const [payRes] = await connection.query(
      `INSERT INTO inventory_payments 
       (payment_number, vendor_id, invoice_id, amount, payment_method, reference_no, paid_by)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [paymentNumber, vendor_id, invoice_id, paymentAmt, payment_method, reference_no || '', paid_by || 1]
    );
    const paymentId = payRes.insertId;

    // 4. Update Invoice Status
    const newPaidAmount = parseFloat(invoice.paid_amount) + paymentAmt;
    let newStatus = 'PENDING';
    if (newPaidAmount >= parseFloat(invoice.total_amount)) newStatus = 'PAID';
    else if (newPaidAmount > 0) newStatus = 'PARTIAL';

    await connection.query(
      `UPDATE inventory_supplier_invoices SET paid_amount = ?, status = ? WHERE id = ?`,
      [newPaidAmount, newStatus, invoice_id]
    );

    // 5. Add Ledger Entry (CREDIT)
    const [lastLedger] = await connection.query(
      `SELECT balance FROM inventory_supplier_ledger WHERE vendor_id = ? ORDER BY id DESC LIMIT 1`, 
      [vendor_id]
    );
    const prevBalance = lastLedger.length > 0 ? parseFloat(lastLedger[0].balance) : 0;
    const newBalance = prevBalance - paymentAmt; // Credit decreases what we owe

    await connection.query(
      `INSERT INTO inventory_supplier_ledger 
       (vendor_id, type, reference_id, debit, credit, balance)
       VALUES (?, 'PAYMENT', ?, 0, ?, ?)`,
      [vendor_id, paymentId, paymentAmt, newBalance]
    );

    await connection.commit();
    res.status(201).json({ success: true, message: 'Payment recorded successfully' });
  } catch (error) {
    await connection.rollback();
    console.error('Error recording payment:', error);
    res.status(500).json({ success: false, message: error.message });
  } finally {
    connection.release();
  }
};

// -----------------------------------------
// DASHBOARD & LEDGER
// -----------------------------------------

export const getDashboardStats = async (req, res) => {
  try {
    // Total Payable (Sum of all unpaid amounts)
    const [payableRes] = await db.query(
      `SELECT SUM(total_amount - paid_amount) as total_payable FROM inventory_supplier_invoices WHERE status != 'PAID'`
    );

    // Paid This Month
    const [paidMonthRes] = await db.query(
      `SELECT SUM(amount) as paid_this_month FROM inventory_payments 
       WHERE MONTH(paid_at) = MONTH(CURRENT_DATE()) AND YEAR(paid_at) = YEAR(CURRENT_DATE())`
    );

    // Overdue Amount
    const [overdueRes] = await db.query(
      `SELECT SUM(total_amount - paid_amount) as overdue_amount 
       FROM inventory_supplier_invoices 
       WHERE status != 'PAID' AND due_date < CURRENT_DATE()`
    );

    res.json({
      success: true,
      data: {
        total_payable: payableRes[0].total_payable || 0,
        paid_this_month: paidMonthRes[0].paid_this_month || 0,
        overdue_amount: overdueRes[0].overdue_amount || 0
      }
    });
  } catch (error) {
    console.error('Error fetching AP dashboard stats:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getSupplierLedger = async (req, res) => {
  try {
    const { vendor_id } = req.params;
    
    // We want to fetch ledger entries with extra context
    const [ledger] = await db.query(
      `SELECT l.*, 
        CASE 
          WHEN l.type = 'INVOICE' THEN (SELECT invoice_number FROM inventory_supplier_invoices WHERE id = l.reference_id)
          WHEN l.type = 'PAYMENT' THEN (SELECT payment_number FROM inventory_payments WHERE id = l.reference_id)
        END as reference_number
       FROM inventory_supplier_ledger l
       WHERE l.vendor_id = ?
       ORDER BY l.created_at ASC`,
      [vendor_id]
    );

    res.json({ success: true, data: ledger });
  } catch (error) {
    console.error('Error fetching ledger:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
