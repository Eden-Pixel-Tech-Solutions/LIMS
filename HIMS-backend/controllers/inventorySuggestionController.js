import db from '../config/db.js';

export const getPurchaseSuggestions = async (req, res) => {
  try {
    const [suggestions] = await db.query(
      `SELECT s.*, i.item_name, i.item_code, i.unit, v.vendor_name 
       FROM inventory_purchase_suggestions s
       JOIN inventory_item_master i ON s.item_id = i.id
       LEFT JOIN vendors v ON s.vendor_id = v.id
       ORDER BY s.status ASC, s.created_at DESC`
    );
    res.json({ success: true, data: suggestions });
  } catch (error) {
    console.error('Error fetching suggestions:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const generatePurchaseSuggestions = async (req, res) => {
  try {
    // 1. Calculate Reorder Predictions (Same logic as analytics)
    const [predictionsRes] = await db.query(
      `SELECT 
        i.id as item_id, i.preferred_vendor_id, i.estimated_cost,
        COALESCE(i.lead_time_days, 3) as lead_time_days, 
        COALESCE(i.safety_stock_buffer, 20) as safety_stock_buffer,
        COALESCE(b.total_qty, 0) as current_stock,
        COALESCE(t.total_out_30_days, 0) as total_out_30_days,
        (COALESCE(t.total_out_30_days, 0) / 30) as adu
      FROM inventory_item_master i
      LEFT JOIN (
        SELECT item_id, SUM(quantity_available) as total_qty 
        FROM inventory_batches 
        WHERE status IN ('Available', 'Active') 
        GROUP BY item_id
      ) b ON i.id = b.item_id
      LEFT JOIN (
        SELECT item_id, SUM(quantity) as total_out_30_days 
        FROM inventory_transactions 
        WHERE type = 'OUT' AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        GROUP BY item_id
      ) t ON i.id = t.item_id`
    );

    let generatedCount = 0;

    for (const item of predictionsRes) {
      const adu = parseFloat(item.adu) || 0;
      const reorderPoint = Math.ceil((adu * item.lead_time_days) + item.safety_stock_buffer);
      
      if (item.current_stock <= reorderPoint && adu > 0) {
        // Needs reorder
        const suggestedQty = Math.ceil(reorderPoint - item.current_stock + (adu * 30)); // Reorder enough for next 30 days
        const estimatedTotalCost = suggestedQty * (parseFloat(item.estimated_cost) || 0);

        // Check if a pending suggestion already exists
        const [existing] = await db.query(
          `SELECT id FROM inventory_purchase_suggestions WHERE item_id = ? AND status = 'Pending'`,
          [item.item_id]
        );

        if (existing.length === 0) {
          // Insert new suggestion
          await db.query(
            `INSERT INTO inventory_purchase_suggestions 
             (item_id, vendor_id, suggested_qty, estimated_cost, status) 
             VALUES (?, ?, ?, ?, 'Pending')`,
            [item.item_id, item.preferred_vendor_id, suggestedQty, estimatedTotalCost]
          );
          generatedCount++;
        } else {
          // Update existing pending suggestion with fresh logic
          await db.query(
            `UPDATE inventory_purchase_suggestions 
             SET suggested_qty = ?, estimated_cost = ?, vendor_id = ? 
             WHERE id = ?`,
            [suggestedQty, estimatedTotalCost, item.preferred_vendor_id, existing[0].id]
          );
        }
      }
    }

    res.json({ success: true, message: `Successfully generated ${generatedCount} new suggestions.` });
  } catch (error) {
    console.error('Error generating suggestions:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateSuggestionStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    await db.query(
      `UPDATE inventory_purchase_suggestions SET status = ? WHERE id = ?`,
      [status, id]
    );

    res.json({ success: true, message: 'Suggestion status updated' });
  } catch (error) {
    console.error('Error updating suggestion:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
