import db from '../config/db.js';
import bcrypt from 'bcryptjs';

// Get counts grouped by role
export const getStaffStats = async (req, res) => {
  try {
    const query = `
      SELECT role, count(*) as count 
      FROM users 
      GROUP BY role
    `;
    const [rows] = await db.query(query);
    
    // Format into a nice object
    const stats = rows.reduce((acc, row) => {
      acc[row.role] = row.count;
      return acc;
    }, {});

    res.json({ success: true, stats });
  } catch (error) {
    console.error('Error fetching staff stats:', error);
    res.status(500).json({ success: false, message: 'Server error fetching stats' });
  }
};

// Get only doctors
export const getDoctors = async (req, res) => {
  try {
    const query = 'SELECT first_name, last_name, department FROM users WHERE role = "Doctor" ORDER BY department ASC, first_name ASC';
    const [rows] = await db.query(query);
    res.json({ success: true, doctors: rows });
  } catch (error) {
    console.error('Error fetching doctors:', error);
    res.status(500).json({ success: false, message: 'Server error fetching doctors' });
  }
};

// List all staff members
export const getAllStaff = async (req, res) => {
  try {
    const { branch_id } = req.query;
    let query = 'SELECT id, first_name, last_name, email, phone, role, department, staff_id, branch_id, created_at FROM users';
    const params = [];

    if (branch_id) {
      query += ' WHERE branch_id = ?';
      params.push(branch_id);
    }

    query += ' ORDER BY created_at DESC';
    const [rows] = await db.query(query, params);
    res.json({ success: true, staff: rows });
  } catch (error) {
    console.error('Error fetching staff list:', error);
    res.status(500).json({ success: false, message: 'Server error fetching staff' });
  }
};

// Add new staff member
export const addStaff = async (req, res) => {
  try {
    const { firstName, lastName, email, phone, role, department, staffId, password } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({ success: false, message: 'Required fields missing' });
    }

    // Check if email exists
    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const query = `
      INSERT INTO users (first_name, last_name, email, phone, role, department, staff_id, password)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const values = [firstName, lastName, email, phone, role, department, staffId, hashedPassword];

    const [result] = await db.query(query, values);

    res.status(201).json({
      success: true,
      message: 'Staff member added successfully',
      id: result.insertId
    });
  } catch (error) {
    console.error('Error adding staff:', error);
    res.status(500).json({ success: false, message: 'Server error adding staff' });
  }
};
