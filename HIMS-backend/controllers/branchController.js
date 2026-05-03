import db from '../config/db.js';

// 1. Get all branches (Hierarchy aware)
export const getBranches = async (req, res) => {
  try {
    const { district_id, role_level, branch_id } = req.query;
    
    let query = `
      SELECT b.*, d.name as district_name, p.branch_name as parent_branch_name 
      FROM branches b
      LEFT JOIN districts d ON b.district_id = d.id
      LEFT JOIN branches p ON b.parent_branch_id = p.id
      WHERE 1=1
    `;
    const params = [];

    // Sub-Central role: only see branches in their district
    if (role_level === 'Sub-Central' && district_id) {
      query += ' AND b.district_id = ?';
      params.push(district_id);
    }
    // Central role: sees all branches (no filter)
    // Branch level sees only their own branch
    else if (role_level === 'Branch' && branch_id) {
      query += ' AND b.id = ?';
      params.push(branch_id);
    }

    query += ` ORDER BY d.name, b.branch_name`;

    const [branches] = await db.query(query, params);
    
    // Also fetch districts to populate dropdowns
    const [districts] = await db.query('SELECT * FROM districts ORDER BY name');

    // Also fetch facility categories
    const [categories] = await db.query('SELECT * FROM facility_categories ORDER BY name');

    res.json({ success: true, branches, districts, categories });
  } catch (error) {
    console.error('Error fetching branches:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// 2. Create District (Sub-Central Hub)
export const createDistrict = async (req, res) => {
  try {
    const { name, state = 'Jharkhand' } = req.body;
    
    if (!name) return res.status(400).json({ success: false, message: 'District name is required' });

    const [result] = await db.query(
      'INSERT INTO districts (name, state) VALUES (?, ?)',
      [name, state]
    );

    res.json({ success: true, message: 'District created successfully', district_id: result.insertId });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ success: false, message: 'District already exists' });
    }
    console.error('Error creating district:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Update District
export const updateDistrict = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'District name is required' });

    await db.query('UPDATE districts SET name = ? WHERE id = ?', [name, id]);
    res.json({ success: true, message: 'District updated successfully' });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') return res.status(400).json({ success: false, message: 'District already exists' });
    console.error('Error updating district:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Delete District
export const deleteDistrict = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if there are branches assigned to this district
    const [branches] = await db.query('SELECT id FROM branches WHERE district_id = ? LIMIT 1', [id]);
    if (branches.length > 0) {
      return res.status(400).json({ success: false, message: 'Cannot delete district. It has assigned health centers.' });
    }

    await db.query('DELETE FROM districts WHERE id = ?', [id]);
    res.json({ success: true, message: 'District deleted successfully' });
  } catch (error) {
    console.error('Error deleting district:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// 3. Create Center (Lab/Branch)
export const createCenter = async (req, res) => {
  try {
    const { district_id, branch_name, category = 'General Lab', hospital_code, address, contact_number, branch_level = 'Center', parent_branch_id = null } = req.body;

    if (!district_id || !branch_name || !hospital_code) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const [result] = await db.query(
      `INSERT INTO branches (district_id, branch_name, category, branch_level, parent_branch_id, hospital_code, address, contact_number, status) 
       VALUES (?, ?, ?, ?, ?, UPPER(?), ?, ?, 'Active')`,
      [district_id, branch_name, category, branch_level, parent_branch_id || null, hospital_code, address, contact_number]
    );

    res.json({ success: true, message: 'Center created successfully', branch_id: result.insertId });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ success: false, message: 'Hospital Code already exists' });
    }
    console.error('Error creating center:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Update Center
export const updateCenter = async (req, res) => {
  try {
    const { id } = req.params;
    const { district_id, branch_name, category, hospital_code, address, contact_number, branch_level, parent_branch_id } = req.body;

    if (!district_id || !branch_name || !hospital_code) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    await db.query(
      `UPDATE branches 
       SET district_id = ?, branch_name = ?, category = ?, branch_level = ?, parent_branch_id = ?, hospital_code = UPPER(?), address = ?, contact_number = ?
       WHERE id = ?`,
      [district_id, branch_name, category, branch_level, parent_branch_id || null, hospital_code, address, contact_number, id]
    );

    res.json({ success: true, message: 'Center updated successfully' });
  } catch (error) {
    console.error('Error updating center:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Delete Center
export const deleteCenter = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Optional: check if there are users, patients, or bills linked to this branch before deleting
    // For now, we will allow direct deletion
    await db.query('DELETE FROM branches WHERE id = ?', [id]);
    res.json({ success: true, message: 'Center deleted successfully' });
  } catch (error) {
    console.error('Error deleting center:', error);
    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
      return res.status(400).json({ success: false, message: 'Cannot delete this facility because it is actively being used by registered staff, infrastructure, or patient records.' });
    }
    res.status(500).json({ success: false, message: 'Server error (Make sure no records depend on this center)' });
  }
};

// --- FACILITY CATEGORY MANAGEMENT ---

// Create Category
export const createFacilityCategory = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Category name is required' });

    const [result] = await db.query('INSERT INTO facility_categories (name) VALUES (?)', [name]);
    res.json({ success: true, message: 'Category created', category_id: result.insertId });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') return res.status(400).json({ success: false, message: 'Category already exists' });
    console.error('Error creating category:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Update Category
export const updateFacilityCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Category name is required' });

    await db.query('UPDATE facility_categories SET name = ? WHERE id = ?', [name, id]);
    res.json({ success: true, message: 'Category updated' });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') return res.status(400).json({ success: false, message: 'Category already exists' });
    console.error('Error updating category:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Delete Category
export const deleteFacilityCategory = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM facility_categories WHERE id = ?', [id]);
    res.json({ success: true, message: 'Category deleted' });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
